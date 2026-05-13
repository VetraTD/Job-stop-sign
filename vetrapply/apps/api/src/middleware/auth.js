import { ApiError, asyncHandler } from "../lib/errors.js";
import { supabaseAdmin, createUserScopedClient } from "../lib/supabase.js";

export const authRequired = asyncHandler(async (req, _res, next) => {
  const hdr = req.headers.authorization || "";
  const match = hdr.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new ApiError(401, "AUTH_REQUIRED", "Missing bearer token");

  const jwt = match[1];
  const { data, error } = await supabaseAdmin.auth.getUser(jwt);
  if (error || !data?.user) throw new ApiError(401, "AUTH_INVALID", "Invalid or expired token");

  req.user = { id: data.user.id, email: data.user.email };
  req.jwt = jwt;
  req.supabase = createUserScopedClient(jwt);
  req.supabaseAdmin = supabaseAdmin;
  next();
});
