import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const SIGNAL_WORDS = ["responsibilities", "requirements", "what you", "qualifications"];

export function match() {
  return true;
}

export async function fetchJob(url) {
  let res;
  try {
    res = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/html" } });
  } catch {
    return null;
  }
  if (!res.ok) return null;
  const html = await res.text();
  if (html.length < 500) return null;

  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  const textContent = (article?.textContent || dom.window.document.body?.textContent || "")
    .replace(/\s+/g, " ")
    .trim();

  const lower = textContent.toLowerCase();
  const hasSignal = SIGNAL_WORDS.some((w) => lower.includes(w));
  if (textContent.length < 1500 || !hasSignal) return null;

  const title = article?.title || dom.window.document.title || "";

  return {
    ats_provider: "other",
    company: "",
    title,
    location: "",
    raw_text: textContent,
    source_url: url,
  };
}

