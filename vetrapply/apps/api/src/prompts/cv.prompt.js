export const CV_SCHEMA = {
  type: "object",
  required: ["contact", "summary", "experience", "education", "skills", "projects"],
  properties: {
    contact: {
      type: "object",
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        linkedin: { type: "string" },
        website: { type: "string" },
      },
    },
    summary: { type: "string" },
    experience: {
      type: "array",
      items: {
        type: "object",
        required: ["company", "title", "bullets"],
        properties: {
          company: { type: "string" },
          title: { type: "string" },
          start: { type: "string" },
          end: { type: "string" },
          location: { type: "string" },
          bullets: { type: "array", items: { type: "string" } },
        },
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          school: { type: "string" },
          degree: { type: "string" },
          start: { type: "string" },
          end: { type: "string" },
        },
      },
    },
    skills: { type: "array", items: { type: "string" } },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          link: { type: "string" },
        },
      },
    },
  },
};

export function renderCvPrompt(rawText) {
  return `You are a precise CV parser. Extract structured information from the raw CV text below into JSON matching the provided schema. Never invent fields the CV does not contain — use empty strings or empty arrays for missing data.

Rules:
- Dates: use ISO-like strings ("2024-01", "Present", "2019"). Do not normalise beyond what the CV says.
- bullets: keep verbatim where possible. Preserve metrics and numbers.
- skills: extract the explicit "Skills" or "Technical Skills" section if present; otherwise infer from experience bullets.
- contact.linkedin / website: only if URL is present.

=== CV RAW TEXT ===
${rawText}
=== END CV ===

Return strict JSON.`;
}
