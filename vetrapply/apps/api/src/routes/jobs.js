import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler, ApiError } from "../lib/errors.js";
import { fetchJD } from "../services/jdFetcher.js";
import { structureJd } from "../services/jdParser.js";

export const jobsRouter = Router();

jobsRouter.use(authRequired);

const PostBody = z.object({
  source_url: z.string().url().optional(),
  raw_text: z.string().min(50).max(50_000).optional(),
  company: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
}).refine((v) => v.source_url || v.raw_text, {
  message: "Provide source_url or raw_text",
});

jobsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = PostBody.parse(req.body);

    let ats_provider = "manual";
    let company = body.company || "";
    let title = body.title || "";
    let location = body.location || "";
    let raw_text = body.raw_text || "";
    let source_url = body.source_url || null;

    if (body.source_url) {
      const fetched = await fetchJD(body.source_url);
      ats_provider = fetched.ats_provider;
      company = company || fetched.company;
      title = title || fetched.title;
      location = location || fetched.location;
      raw_text = fetched.raw_text;
    }

    if (raw_text.length < 100) {
      throw new ApiError(422, "UNPARSEABLE_JD", "JD text too short");
    }

    const parsed = await structureJd(raw_text, { company, title, location });

    const { data, error } = await req.supabaseAdmin
      .from("jobs")
      .insert({
        user_id: req.user.id,
        source_url,
        ats_provider,
        company: company || parsed.company || "",
        title: title || parsed.title || "",
        location: location || parsed.location || "",
        raw_text,
        parsed,
        status: "saved",
      })
      .select("*")
      .single();

    if (error) throw new ApiError(500, "INTERNAL", error.message);
    res.status(201).json({ job: data });
  })
);

jobsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    let q = req.supabaseAdmin
      .from("jobs")
      .select("id,company,title,location,ats_provider,status,source_url,created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status) q = q.eq("status", status);

    const { data, error } = await q;
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    res.json({ jobs: data });
  })
);

jobsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { data, error } = await req.supabaseAdmin
      .from("jobs")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .maybeSingle();
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    if (!data) throw new ApiError(404, "NOT_FOUND", "Job not found");
    res.json({ job: data });
  })
);

const PatchBody = z.object({
  status: z.enum(["saved", "dismissed", "archived"]).optional(),
  company: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
});

jobsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const updates = PatchBody.parse(req.body);
    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "VALIDATION", "No updatable fields");
    }
    const { data, error } = await req.supabaseAdmin
      .from("jobs")
      .update(updates)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select("*")
      .maybeSingle();
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    if (!data) throw new ApiError(404, "NOT_FOUND", "Job not found");
    res.json({ job: data });
  })
);

jobsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { error, count } = await req.supabaseAdmin
      .from("jobs")
      .delete({ count: "exact" })
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    if (count === 0) throw new ApiError(404, "NOT_FOUND", "Job not found");
    res.status(204).end();
  })
);
