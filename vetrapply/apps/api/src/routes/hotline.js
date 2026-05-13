import { Router } from "express";
import crypto from "crypto";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler, ApiError } from "../lib/errors.js";
import { env } from "../config/env.js";

export const hotlineRouter = Router();

hotlineRouter.use(authRequired);

const PostBody = z.object({
  mode: z.enum(["mock_interview", "pep_talk", "pipeline_review", "debrief"]),
  job_id: z.string().uuid().optional(),
});

function randomPin() {
  const buf = crypto.randomBytes(4);
  const n = (buf.readUInt32BE(0) % 1_000_000).toString().padStart(6, "0");
  return n;
}

hotlineRouter.post(
  "/sessions",
  asyncHandler(async (req, res) => {
    const body = PostBody.parse(req.body);

    if (body.job_id) {
      const { data: job } = await req.supabaseAdmin
        .from("jobs")
        .select("id")
        .eq("id", body.job_id)
        .eq("user_id", req.user.id)
        .maybeSingle();
      if (!job) throw new ApiError(404, "NOT_FOUND", "Job not found");
    }

    const pin = randomPin();

    const { data, error } = await req.supabaseAdmin
      .from("hotline_calls")
      .insert({
        user_id: req.user.id,
        mode: body.mode,
        linked_job_id: body.job_id || null,
        metadata: { pin },
      })
      .select("id, mode, linked_job_id, started_at")
      .single();

    if (error) throw new ApiError(500, "INTERNAL", error.message);

    res.status(201).json({
      call_id: data.id,
      mode: data.mode,
      linked_job_id: data.linked_job_id,
      pin,
      dial_number: env.HOTLINE_DIAL_NUMBER || null,
      expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
    });
  })
);

hotlineRouter.get(
  "/calls",
  asyncHandler(async (req, res) => {
    const { data, error } = await req.supabaseAdmin
      .from("hotline_calls")
      .select("id, mode, linked_job_id, started_at, ended_at, summary")
      .eq("user_id", req.user.id)
      .not("twilio_call_sid", "is", null)
      .order("started_at", { ascending: false })
      .limit(50);
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    res.json({ calls: data });
  })
);

hotlineRouter.get(
  "/calls/:id",
  asyncHandler(async (req, res) => {
    const { data: call, error } = await req.supabaseAdmin
      .from("hotline_calls")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .maybeSingle();
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    if (!call) throw new ApiError(404, "NOT_FOUND", "Call not found");

    const { data: turns } = await req.supabaseAdmin
      .from("call_transcripts")
      .select("role, content, ts")
      .eq("call_id", call.id)
      .order("ts", { ascending: true });

    res.json({ call, transcript: turns || [] });
  })
);
