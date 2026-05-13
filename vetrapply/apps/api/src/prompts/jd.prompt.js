export const JD_SCHEMA = {
  type: "object",
  required: ["company", "title", "requirements", "responsibilities"],
  properties: {
    company: { type: "string" },
    title: { type: "string" },
    location: { type: "string" },
    seniority: { type: "string" },
    employment_type: { type: "string" },
    salary: { type: "string" },
    requirements: { type: "array", items: { type: "string" } },
    nice_to_have: { type: "array", items: { type: "string" } },
    responsibilities: { type: "array", items: { type: "string" } },
    benefits: { type: "array", items: { type: "string" } },
    hard_skills: { type: "array", items: { type: "string" } },
    soft_skills: { type: "array", items: { type: "string" } },
  },
};

export function renderJdPrompt(rawText, hints = {}) {
  return `You are a precise job description parser. Extract structured information from the raw JD text into JSON matching the provided schema. Do not invent details — use empty strings or empty arrays for absent fields.

${hints.company ? `Known company: ${hints.company}` : ""}
${hints.title ? `Known title: ${hints.title}` : ""}
${hints.location ? `Known location: ${hints.location}` : ""}

Rules:
- requirements vs nice_to_have: split based on language ("required" / "must have" vs "preferred" / "bonus" / "nice").
- hard_skills: concrete technologies, certifications, languages. soft_skills: communication, leadership traits.
- seniority: one of intern / junior / mid / senior / lead / exec if inferable; else empty string.
- employment_type: one of full-time / part-time / contract / internship if inferable; else empty.
- salary: copy as written; do not parse currency.

=== JD RAW TEXT ===
${rawText}
=== END JD ===

Return strict JSON.`;
}
