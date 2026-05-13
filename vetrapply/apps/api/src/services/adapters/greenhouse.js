import { JSDOM } from "jsdom";

const URL_RE = /(?:boards|job-boards)\.greenhouse\.io\/([^\/]+)\/jobs\/(\d+)/i;

export function match(url) {
  return URL_RE.test(url);
}

export async function fetchJob(url) {
  const m = url.match(URL_RE);
  if (!m) return null;
  const [, company, jobId] = m;
  const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(company)}/jobs/${encodeURIComponent(jobId)}?content=true`;
  const res = await fetch(apiUrl, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = await res.json();

  const html = data.content || "";
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`);
  const rawText = dom.window.document.body.textContent.replace(/\s+/g, " ").trim();

  return {
    ats_provider: "greenhouse",
    company: data?.company_name || company,
    title: data?.title || "",
    location: data?.location?.name || "",
    raw_text: rawText,
    source_url: url,
  };
}

