import * as greenhouse from "./adapters/greenhouse.js";
import * as lever from "./adapters/lever.js";
import * as workday from "./adapters/workday.js";
import * as linkedin from "./adapters/linkedin.js";
import * as generic from "./adapters/generic.js";
import { ApiError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

const adapters = [greenhouse, lever, workday, linkedin];

export async function fetchJD(url) {
  for (const a of adapters) {
    if (a.match(url)) {
      try {
        const out = await a.fetchJob(url);
        if (out && out.raw_text && out.raw_text.length >= 200) return out;
        logger.warn({ url, provider: out?.ats_provider }, "jd_adapter_thin_result");
      } catch (err) {
        logger.warn({ url, err: err.message }, "jd_adapter_failed");
      }
      break;
    }
  }
  try {
    const out = await generic.fetchJob(url);
    if (out) return out;
  } catch (err) {
    logger.warn({ url, err: err.message }, "jd_generic_failed");
  }
  throw new ApiError(422, "UNPARSEABLE_JD", "Could not fetch job description from that URL. Paste the JD text instead.");
}
