import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { packsRateLimit } from "../middleware/rateLimit.js";
import { asyncHandler, ApiError } from "../lib/errors.js";
import { generatePack } from "../services/packGenerator.js";

export const packsRouter = Router();

packsRouter.use(authRequired);

const PostBody = z.object({
  cv_id: z.string().uuid(),
  job_id: z.string().uuid(),
  force: z.boolean().optional(),
});

packsRouter.post(
  "/",
  packsRateLimit,
  asyncHandler(async (req, res) => {
    const body = PostBody.parse(req.body);

    const { data: profile } = await req.supabaseAdmin
      .from("profiles")
      .select("geo_market")
      .eq("id", req.user.id)
      .maybeSingle();

    const { pack, cached } = await generatePack({
      supabase: req.supabaseAdmin,
      userId: req.user.id,
      cvId: body.cv_id,
      jobId: body.job_id,
      force: !!body.force,
      geoMarket: profile?.geo_market || "UK",
    });

    res.status(cached ? 200 : 201).json({ pack, cached });
  })
);

packsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const jobId = typeof req.query.job_id === "string" ? req.query.job_id : null;
    let q = req.supabaseAdmin
      .from("application_packs")
      .select("id, cv_id, job_id, generated_by_model, generation_cost_cents, created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });
    if (jobId) q = q.eq("job_id", jobId);
    const { data, error } = await q;
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    res.json({ packs: data });
  })
);

packsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { data, error } = await req.supabaseAdmin
      .from("application_packs")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .maybeSingle();
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    if (!data) throw new ApiError(404, "NOT_FOUND", "Pack not found");
    res.json({ pack: data });
  })
);

packsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { error, count } = await req.supabaseAdmin
      .from("application_packs")
      .delete({ count: "exact" })
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    if (count === 0) throw new ApiError(404, "NOT_FOUND", "Pack not found");
    res.status(204).end();
  })
);
