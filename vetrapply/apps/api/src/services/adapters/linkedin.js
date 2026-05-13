import { JSDOM } from "jsdom";

const URL_RE = /linkedin\.com\/jobs\/view\/(\d+)/i;

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export function match(url) {
  return URL_RE.test(url);
}

export async function fetchJob(url) {
  const m = url.match(URL_RE);
  if (!m) return null;
  const jobId = m[1];

  const apiUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;
  let res;
  try {
    res = await fetch(apiUrl, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html",
      },
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const html = await res.text();
  if (html.length < 200) return null;

  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const title =
    doc.querySelector(".top-card-layout__title")?.textContent?.trim() ||
    doc.querySelector("h1")?.textContent?.trim() ||
    "";
  const company =
    doc.querySelector(".topcard__org-name-link")?.textContent?.trim() ||
    doc.querySelector("[data-tracking-control-name='public_jobs_topcard-org-name']")?.textContent?.trim() ||
    "";
  const location =
    doc.querySelector(".topcard__flavor--bullet")?.textContent?.trim() || "";

  const descNode =
    doc.querySelector(".show-more-less-html__markup") ||
    doc.querySelector(".description__text") ||
    doc.body;
  const rawText = (descNode?.textContent || "").replace(/\s+/g, " ").trim();

  if (rawText.length < 200) return null;

  return {
    ats_provider: "linkedin",
    company,
    title,
    location,
    raw_text: rawText,
    source_url: url,
  };
}

