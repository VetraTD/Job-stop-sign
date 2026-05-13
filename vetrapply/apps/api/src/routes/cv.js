import { Router } from "express";
import crypto from "crypto";
import { authRequired } from "../middleware/auth.js";
import { cvUpload, handleMulterError } from "../middleware/upload.js";
import { asyncHandler, ApiError } from "../lib/errors.js";
import { parseCv } from "../services/cvParser.js";
import { env } from "../config/env.js";

export const cvRouter = Router();

cvRouter.use(authRequired);

cvRouter.post(
  "/",
  cvUpload.single("file"),
  handleMulterError,
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "VALIDATION", "No file uploaded (field 'file')");
    const label = (req.body.label || "My CV").toString().slice(0, 200);

    const { raw, parsed } = await parseCv(req.file.buffer, req.file.mimetype);

    const cvId = crypto.randomUUID();
    const ext = req.file.mimetype === "application/pdf" ? "pdf" : "docx";
    const filePath = `${req.user.id}/${cvId}.${ext}`;

    const { error: upErr } = await req.supabaseAdmin
      .storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
    if (upErr) throw new ApiError(500, "INTERNAL", `Storage upload failed: ${upErr.message}`);

    if (req.body.is_active !== "false") {
      await req.supabaseAdmin
        .from("cvs")
        .update({ is_active: false })
        .eq("user_id", req.user.id);
    }

    const { data: row, error } = await req.supabaseAdmin
      .from("cvs")
      .insert({
        id: cvId,
        user_id: req.user.id,
        label,
        file_path: filePath,
        file_mime: req.file.mimetype,
        raw_text: raw,
        parsed,
        is_active: req.body.is_active !== "false",
      })
      .select("*")
      .single();

    if (error) {
      await req.supabaseAdmin.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([filePath]);
      throw new ApiError(500, "INTERNAL", error.message);
    }

    res.status(201).json({ cv: row });
  })
);

cvRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { data, error } = await req.supabaseAdmin
      .from("cvs")
      .select("id,label,file_mime,is_active,created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    res.json({ cvs: data });
  })
);

cvRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { data, error } = await req.supabaseAdmin
      .from("cvs")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .maybeSingle();
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    if (!data) throw new ApiError(404, "NOT_FOUND", "CV not found");

    const { data: signed } = await req.supabaseAdmin
      .storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .createSignedUrl(data.file_path, 300);

    res.json({ cv: data, signed_url: signed?.signedUrl || null });
  })
);

cvRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const updates = {};
    if (typeof req.body.label === "string") updates.label = req.body.label.slice(0, 200);
    if (typeof req.body.is_active === "boolean") updates.is_active = req.body.is_active;
    if (Object.keys(updates).length === 0) throw new ApiError(400, "VALIDATION", "No updatable fields");

    if (updates.is_active === true) {
      await req.supabaseAdmin
        .from("cvs")
        .update({ is_active: false })
        .eq("user_id", req.user.id);
    }

    const { data, error } = await req.supabaseAdmin
      .from("cvs")
      .update(updates)
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select("*")
      .maybeSingle();
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    if (!data) throw new ApiError(404, "NOT_FOUND", "CV not found");
    res.json({ cv: data });
  })
);

cvRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { data: existing } = await req.supabaseAdmin
      .from("cvs")
      .select("file_path")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .maybeSingle();
    if (!existing) throw new ApiError(404, "NOT_FOUND", "CV not found");

    await req.supabaseAdmin
      .storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .remove([existing.file_path]);

    const { error } = await req.supabaseAdmin
      .from("cvs")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id);
    if (error) throw new ApiError(500, "INTERNAL", error.message);
    res.status(204).end();
  })
);
