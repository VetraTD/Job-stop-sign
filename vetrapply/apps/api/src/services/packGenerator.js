import { z } from "zod";
import { env } from "../config/env.js";
import { ApiError } from "../lib/errors.js";
import { sha256 } from "../lib/hash.js";
import { logger } from "../lib/logger.js";
import { generateStructured, estimateCostCents } from "./gemini.js";
import { PACK_SCHEMA, renderPackPrompt } from "../prompts/pack.prompt.js";

const ZodPack = z.object({
  tailored_summary: z.string().min(20),
  cover_letter: z.string().min(100),
  bullets: z.array(z.string().min(5)).min(5).max(5),
  application_questions: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .max(10),
  interview_prep: z.object({
    likely_questions: z.array(z.string()).max(12),
    story_bank: z
      .array(
        z.object({
          title: z.string(),
          situation: z.string(),
          task: z.string(),
          action: z.string(),
          result: z.string(),
        })
      )
      .max(5),
  }),
  follow_up_email: z.string().min(20),
  skills_gap: z.object({
    missing: z.array(z.string()),
    adjacent: z.array(z.string()),
    recommendations: z.array(z.string()).max(8),
  }),
});

export async function generatePack({ supabase, userId, cvId, jobId, force = false, geoMarket }) {
  const [{ data: cv, error: cvErr }, { data: job, error: jobErr }] = await Promise.all([
    supabase
      .from("cvs")
      .select("id, raw_text, parsed")
      .eq("id", cvId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("jobs")
      .select("id, raw_text, parsed, company, title, location")
      .eq("id", jobId)
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (cvErr) throw new ApiError(500, "INTERNAL", cvErr.message);
  if (jobErr) throw new ApiError(500, "INTERNAL", jobErr.message);
  if (!cv) throw new ApiError(404, "NOT_FOUND", "CV not found");
  if (!job) throw new ApiError(404, "NOT_FOUND", "Job not found");

  const inputHash = sha256(`${cvId}|${jobId}|${cv.raw_text}|${job.raw_text}`);

  if (!force) {
    const { data: existing } = await supabase
      .from("application_packs")
      .select("*")
      .eq("user_id", userId)
      .eq("input_hash", inputHash)
      .maybeSingle();
    if (existing) return { pack: existing, cached: true };
  }

  const prompt = renderPackPrompt({ cv, job, geoMarket });

  let raw;
  try {
    raw = await generateStructured({
      model: env.GEMINI_PACK_MODEL,
      prompt,
      schema: PACK_SCHEMA,
      timeoutMs: 90_000,
      retries: 1,
    });
  } catch (err) {
    logger.error({ err: err.message, cvId, jobId }, "pack_llm_failed");
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, "LLM_FAILED", "Pack generation failed. Try again.");
  }

  let validated;
  try {
    validated = ZodPack.parse(raw);
  } catch (err) {
    logger.error({ err: err.message, cvId, jobId }, "pack_schema_invalid");
    throw new ApiError(502, "LLM_FAILED", "Pack response failed validation. Try again.");
  }

  const outputJson = JSON.stringify(validated);
  const cost = estimateCostCents({
    inputChars: prompt.length,
    outputChars: outputJson.length,
  });

  const { data: row, error } = await supabase
    .from("application_packs")
    .insert({
      user_id: userId,
      cv_id: cvId,
      job_id: jobId,
      tailored_summary: validated.tailored_summary,
      cover_letter: validated.cover_letter,
      bullets: validated.bullets,
      application_questions: validated.application_questions,
      interview_prep: validated.interview_prep,
      follow_up_email: validated.follow_up_email,
      skills_gap: validated.skills_gap,
      input_hash: inputHash,
      generated_by_model: env.GEMINI_PACK_MODEL,
      generation_cost_cents: cost,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: existing } = await supabase
        .from("application_packs")
        .select("*")
        .eq("user_id", userId)
        .eq("input_hash", inputHash)
        .single();
      return { pack: existing, cached: true };
    }
    throw new ApiError(500, "INTERNAL", error.message);
  }

  return { pack: row, cached: false };
}
