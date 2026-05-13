import { JSDOM } from "jsdom";

const URL_RE = /https?:\/\/([a-z0-9-]+)\.wd[0-9]+\.myworkdayjobs\.com\/(?:[a-z]{2}-[A-Z]{2}\/)?([^\/]+)\/job\/[^\/]+\/([^\/?]+)/i;

export function match(url) {
  return URL_RE.test(url);
}

export async function fetchJob(url) {
  const m = url.match(URL_RE);
  if (!m) return null;
  const [, tenant, site, jobSlug] = m;

  const wdJsonUrl = url.replace(/(\/job\/[^\/]+\/[^\/?]+).*$/, (_, p) => p);
  const apiUrl = `https://${tenant}.wd1.myworkdayjobs.com/wday/cxs/${tenant}/${site}/job/${jobSlug}`;

  let res;
  try {
    res = await fetch(apiUrl, { headers: { Accept: "application/json" } });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  let data;
  try {
    data = await res.json();
  } catch {
    return null;
  }

  const info = data?.jobPostingInfo || {};
  const html = info.jobDescription || "";
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`);
  const rawText = dom.window.document.body.textContent.replace(/\s+/g, " ").trim();

  return {
    ats_provider: "workday",
    company: tenant,
    title: info.title || "",
    location: info.location || "",
    raw_text: rawText,
    source_url: url,
  };
}

