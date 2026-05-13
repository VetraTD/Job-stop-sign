const URL_RE = /jobs\.lever\.co\/([^\/]+)\/([0-9a-f-]{36})/i;

export function match(url) {
  return URL_RE.test(url);
}

export async function fetchJob(url) {
  const m = url.match(URL_RE);
  if (!m) return null;
  const [, company, postingId] = m;
  const apiUrl = `https://api.lever.co/v0/postings/${encodeURIComponent(company)}/${encodeURIComponent(postingId)}?mode=json`;
  const res = await fetch(apiUrl, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = await res.json();

  const parts = [];
  if (data.descriptionPlain) parts.push(data.descriptionPlain);
  if (Array.isArray(data.lists)) {
    for (const list of data.lists) {
      if (list.text) parts.push(list.text);
      if (list.content) parts.push(stripTags(list.content));
    }
  }
  if (data.additionalPlain) parts.push(data.additionalPlain);

  const rawText = parts.join("\n\n").replace(/\s+/g, " ").trim();

  return {
    ats_provider: "lever",
    company: data?.categories?.team || company,
    title: data?.text || "",
    location: data?.categories?.location || "",
    raw_text: rawText,
    source_url: url,
  };
}

function stripTags(html) {
  return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

