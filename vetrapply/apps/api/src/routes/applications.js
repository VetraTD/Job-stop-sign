import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler, ApiError } from "../lib/errors.js";

export const applicationsRouter = Router();

applicationsRouter.use(authRequired);

const STATUSES = ["saved", "applied", "interview", "offer", "rejected", "withdrawn"];

const PostBody = z.object({
  job_id: z.string().uuid(),
  pack_id: z.string().uuid().optional(),
  status: z.enum(STATUSES).optional(),
  applied_at: z.string().datetime().optional(),
  interview_at: z.string().datetime().optional(),
  notes: z.string().max(5000).optional(),
});

applicationsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = PostBody.parse(req.body);

    const { data: job } = await req.supabaseAdmin
      .from("jobs")
      .select("id")
      .eq("id", body.job_id)
      .eq("user_id", req.user.id)
      .maybeSingle();
    if (!job) throw new ApiError(404, "NOT_FOUND", "Job not found");

    if (body.pack_id) {
      const { data: pack } = await req.supabaseAdmin
        .from("application_packs")
        .select("id")
        .eq("id", body.pack_id)
        .eq("user_id", req.user.id)
        .maybeSingle();
      if (!pack) throw new ApiError(404, "NOT_FOUND", "Pack not found");
    }

    const upsertRow = {
      user_id: req.user.id,
      job_id: body.job_id,
      pack_id: body.pack_id || null,
      status: body.status || "saved",
    };
    if (body.applied_at) upsertRow.applied_at = body.applied_at;
    if (body.interview_at) upsertRow.interview_at = body.interview_at;
    if (body.notes !== undefined) upsertRow.notes = body.notes;

    const { data, error } = await req.supabaseAdmin
      .from("applications")
      .upsert(upsertRow, { onConflict: "user_id,job_id" })
      .select("*")
      .single();

    if (error) throw new ApiError(500, "INTERNAL", error.message);
    res.status(201).json({ application: data });
  })
);

applicationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : null;
    let q = req.supabaseAdmin
      .from("applications")
      .select("*")
      .eq("user_id", req.user.id)
      .order("updated_at", { ascending: false });
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    res.json({ applications: data });
  })
);

const PatchBody = z.object({
  pack_id: z.string().uuid().nullable().optional(),
  status: z.enum(STATUSES).optional(),
  applied_at: z.string().datetime().nullable().optional(),
  interview_at: z.string().datetime().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

applicationsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const updates = PatchBody.parse(req.body);
    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, "VALIDATION", "No updatable fields");
    }
    const { data, error } = await req.supabaseAdmin
      .from("applications")
      .update(updates)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select("*")
      .maybeSingle();
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    if (!data) throw new ApiError(404, "NOT_FOUND", "Application not found");
    res.json({ application: data });
  })
);

applicationsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { error, count } = await req.supabaseAdmin
      .from("applications")
      .delete({ count: "exact" })
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    if (count === 0) throw new ApiError(404, "NOT_FOUND", "Application not found");
    res.status(204).end();
  })
);
