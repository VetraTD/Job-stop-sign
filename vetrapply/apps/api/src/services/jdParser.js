import { env } from "../config/env.js";
import { generateStructured } from "./gemini.js";
import { JD_SCHEMA, renderJdPrompt } from "../prompts/jd.prompt.js";

export async function structureJd(rawText, hints = {}) {
  return generateStructured({
    model: env.GEMINI_PARSER_MODEL,
    prompt: renderJdPrompt(rawText.slice(0, 25_000), hints),
    schema: JD_SCHEMA,
    timeoutMs: 45_000,
  });
}
