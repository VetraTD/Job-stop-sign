import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { env } from "../config/env.js";

export const globalRateLimit = rateLimit({
  windowMs: 60_000,
  limit: env.RATE_LIMIT_GLOBAL_PER_MIN,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests" } },
});

export const packsRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: env.RATE_LIMIT_PACKS_PER_HOUR,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req, res) => req.user?.id || ipKeyGenerator(req, res),
  message: { error: { code: "RATE_LIMITED", message: "Pack generation limit reached. Try again later." } },
});
