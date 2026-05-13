export const PACK_SCHEMA = {
  type: "object",
  required: [
    "tailored_summary",
    "cover_letter",
    "bullets",
    "application_questions",
    "interview_prep",
    "follow_up_email",
    "skills_gap",
  ],
  properties: {
    tailored_summary: { type: "string" },
    cover_letter: { type: "string" },
    bullets: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 5,
    },
    application_questions: {
      type: "array",
      items: {
        type: "object",
        required: ["question", "answer"],
        properties: {
          question: { type: "string" },
          answer: { type: "string" },
        },
      },
      maxItems: 10,
    },
    interview_prep: {
      type: "object",
      required: ["likely_questions", "story_bank"],
      properties: {
        likely_questions: {
          type: "array",
          items: { type: "string" },
          maxItems: 12,
        },
        story_bank: {
          type: "array",
          items: {
            type: "object",
            required: ["title", "situation", "task", "action", "result"],
            properties: {
              title: { type: "string" },
              situation: { type: "string" },
              task: { type: "string" },
              action: { type: "string" },
              result: { type: "string" },
            },
          },
          maxItems: 5,
        },
      },
    },
    follow_up_email: { type: "string" },
    skills_gap: {
      type: "object",
      required: ["missing", "adjacent", "recommendations"],
      properties: {
        missing: { type: "array", items: { type: "string" } },
        adjacent: { type: "array", items: { type: "string" } },
        recommendations: {
          type: "array",
          items: { type: "string" },
          maxItems: 8,
        },
      },
    },
  },
};

export function renderPackPrompt({ cv, job, geoMarket = "UK" }) {
  const cvParsed = cv.parsed ? JSON.stringify(cv.parsed, null, 2) : "(no structured CV available)";
  const jobParsed = job.parsed ? JSON.stringify(job.parsed, null, 2) : "(no structured JD available)";

  return `You are VetrApply, an AI career strategist. Produce a complete application pack in strict JSON matching the provided schema. Be specific, concrete, and grounded in the candidate's actual CV — never invent experience.

GEO_MARKET: ${geoMarket}  (UK = British spelling, £; US = American spelling, $)

Rules:
- tailored_summary: 3-4 sentences, first person, role-specific. Reference the company by name.
- cover_letter: 250-400 words, opening "Dear Hiring Team", no fluff, end with a clear call to action.
- bullets: exactly 5 CV bullets rewritten to maximise JD overlap; preserve metrics and numbers from the original CV.
- application_questions: typical screener questions for this role (Why us, why this role, salary expectations, notice period, work authorisation eligibility) tailored to the candidate.
- interview_prep.story_bank: STAR stories built only from real CV evidence; never fabricate situations the candidate did not actually have.
- skills_gap.missing: hard skills clearly required by the JD but absent from the CV.
- skills_gap.adjacent: transferable skills the candidate has that map to the missing ones.
- skills_gap.recommendations: short, actionable 1-week study or practice items.

=== CANDIDATE CV (raw text) ===
${cv.raw_text}

=== CANDIDATE CV (structured) ===
${cvParsed}

=== JOB ===
Company: ${job.company || "(unknown)"}
Title:   ${job.title || "(unknown)"}
Location: ${job.location || "(unknown)"}

JD raw:
${job.raw_text}

JD structured:
${jobParsed}

Return strict JSON matching the schema. Do not include any commentary outside the JSON object.`;
}
