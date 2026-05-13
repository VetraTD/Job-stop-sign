import "dotenv/config";
import { z } from "zod";

const Schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  SUPABASE_STORAGE_BUCKET: z.string().default("cvs"),

  GOOGLE_GENAI_API_KEY: z.string().optional().default(""),
  GEMINI_PACK_MODEL: z.string().default("gemini-2.5-pro"),
  GEMINI_PARSER_MODEL: z.string().default("gemini-2.5-pro"),

  SENTRY_DSN: z.string().optional().default(""),

  CORS_ORIGINS: z.string().default("http://localhost:5173"),

  RATE_LIMIT_GLOBAL_PER_MIN: z.coerce.number().int().positive().default(120),
  RATE_LIMIT_PACKS_PER_HOUR: z.coerce.number().int().positive().default(20),

  RUN_LLM_TESTS: z.coerce.number().int().min(0).max(1).default(0),

  HOTLINE_DIAL_NUMBER: z.string().optional().default(""),
});

const parsed = Schema.safeParse(process.env);
if (!parsed.success) {
  console.error("[env] invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = Object.freeze({
  ...parsed.data,
  CORS_ORIGINS_LIST: parsed.data.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
  IS_PROD: parsed.data.NODE_ENV === "production",
});
