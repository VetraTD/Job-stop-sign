import "dotenv/config";
import { z } from "zod";

const Schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default("INFO"),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  TWILIO_ACCOUNT_SID: z.string().min(10).optional().default(""),
  TWILIO_AUTH_TOKEN: z.string().min(10).optional().default(""),
  TWILIO_VALIDATE_SIGNATURE: z.string().default("true").transform((v) => v !== "false"),

  GOOGLE_GENAI_API_KEY: z.string().min(10),
  GEMINI_PHONE_MODEL: z.string().default("gemini-2.5-flash"),

  SENTRY_DSN: z.string().optional().default(""),

  BASE_URL: z.string().url(),

  VETRAPPLY_API_BASE: z.string().url().default("http://localhost:8080"),
});

const parsed = Schema.safeParse(process.env);
if (!parsed.success) {
  console.error("[phone-env] invalid environment:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = Object.freeze({
  ...parsed.data,
  IS_PROD: parsed.data.NODE_ENV === "production",
});
