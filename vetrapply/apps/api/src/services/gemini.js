import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";
import { ApiError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

const client = env.GOOGLE_GENAI_API_KEY
  ? new GoogleGenAI({ apiKey: env.GOOGLE_GENAI_API_KEY })
  : null;

function ensureClient() {
  if (!client) throw new ApiError(500, "INTERNAL", "GOOGLE_GENAI_API_KEY not configured");
  return client;
}

function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

async function withRetry(fn, { retries = 1, baseDelayMs = 1500 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      const wait = baseDelayMs * Math.pow(2, attempt);
      logger.warn({ err: err.message, attempt: attempt + 1, wait }, "gemini_retry");
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

/**
 * Call Gemini with strict JSON schema response. Returns parsed JSON.
 * @param {{ model: string, prompt: string, schema: object, timeoutMs?: number, retries?: number }} opts
 */
export async function generateStructured({ model, prompt, schema, timeoutMs = 60_000, retries = 1 }) {
  const c = ensureClient();
  const op = () =>
    withTimeout(
      c.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      }),
      timeoutMs,
      `gemini.${model}`
    );

  const res = await withRetry(op, { retries });
  const text = res?.text;
  if (!text) {
    logger.error({ model, raw: JSON.stringify(res).slice(0, 500) }, "gemini_empty_response");
    throw new ApiError(502, "LLM_FAILED", "Empty response from LLM");
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    logger.error({ model, text: text.slice(0, 500) }, "gemini_invalid_json");
    throw new ApiError(502, "LLM_FAILED", "LLM returned invalid JSON");
  }
}

/**
 * Estimate cost in cents for Gemini 2.5 Pro: $1.25/M in, $5/M out.
 */
export function estimateCostCents({ inputChars, outputChars }) {
  const inputTokens = Math.ceil(inputChars / 4);
  const outputTokens = Math.ceil(outputChars / 4);
  const inputCents = (inputTokens / 1_000_000) * 125;
  const outputCents = (outputTokens / 1_000_000) * 500;
  return Math.ceil(inputCents + outputCents);
}
