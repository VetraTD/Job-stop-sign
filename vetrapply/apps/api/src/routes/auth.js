import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { asyncHandler, ApiError } from "../lib/errors.js";

export const authRouter = Router();

authRouter.get(
  "/me",
  authRequired,
  asyncHandler(async (req, res) => {
    const { data: existing, error: selErr } = await req.supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .maybeSingle();

    if (selErr) throw new ApiError(500, "INTERNAL", selErr.message);

    let profile = existing;
    if (!profile) {
      const { data: created, error: insErr } = await req.supabaseAdmin
        .from("profiles")
        .insert({ id: req.user.id })
        .select("*")
        .single();
      if (insErr) throw new ApiError(500, "INTERNAL", insErr.message);
      profile = created;
    }

    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        profile,
      },
    });
  })
);
