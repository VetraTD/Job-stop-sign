import { GoogleGenAI, Type } from "@google/genai";
import { env } from "../config/env.js";

const client = new GoogleGenAI({ apiKey: env.GOOGLE_GENAI_API_KEY });

const TOOL_DECLARATIONS = [
  {
    name: "list_saved_jobs",
    description:
      "List the user's currently saved jobs. Use early when the user mentions a job or asks what jobs they have lined up. Returns an array of { id, company, title, status }.",
    parameters: { type: Type.OBJECT, properties: {}, required: [] },
  },
  {
    name: "start_mock_interview",
    description:
      "Begin a mock interview for a specific saved job. Pass the job_id returned by list_saved_jobs. Returns { session_id, first_question }.",
    parameters: {
      type: Type.OBJECT,
      properties: { job_id: { type: Type.STRING, description: "UUID of the saved job" } },
      required: ["job_id"],
    },
  },
  {
    name: "score_answer",
    description:
      "Score the user's most recent answer in an active mock interview. Provide a score 0-10 and one-sentence feedback.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        session_id: { type: Type.STRING },
        question: { type: Type.STRING },
        answer: { type: Type.STRING },
        score: { type: Type.NUMBER, description: "0 to 10" },
        feedback: { type: Type.STRING },
      },
      required: ["session_id", "question", "answer", "score", "feedback"],
    },
  },
  {
    name: "load_pack",
    description:
      "Load the application pack for a specific job. Use when the user wants to discuss cover letter, bullets, interview prep, or follow-up email for a job. Returns the pack contents.",
    parameters: {
      type: Type.OBJECT,
      properties: { job_id: { type: Type.STRING } },
      required: ["job_id"],
    },
  },
  {
    name: "save_debrief",
    description:
      "Save a 1-3 sentence summary of the call. Call this near the end of every call before saying goodbye.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        linked_job_id: { type: Type.STRING, description: "Optional UUID if this call focused on a specific job" },
      },
      required: ["summary"],
    },
  },
  {
    name: "end_call",
    description:
      "Politely end the call. Call this after save_debrief, after the user has clearly indicated they are done.",
    parameters: {
      type: Type.OBJECT,
      properties: { farewell: { type: Type.STRING, description: "Optional brief goodbye line" } },
      required: [],
    },
  },
];

export function buildSystemPrompt({ profile, cv, jobs, applications, mode }) {
  const name = profile?.display_name?.trim() || "there";
  const geo = profile?.geo_market || "UK";
  const styleNote =
    geo === "UK"
      ? "Use British English (favourites, organise, programme). Currency in £."
      : "Use American English. Currency in $.";

  const cvSnippet = cv
    ? `=== USER CV (active) ===
Label: ${cv.label}
Raw text (first 4k chars):
${(cv.raw_text || "").slice(0, 4000)}

Structured summary: ${cv.parsed?.summary || "(none)"}
Top skills: ${(cv.parsed?.skills || []).slice(0, 20).join(", ") || "(none)"}
Most recent role: ${
        cv.parsed?.experience?.[0]
          ? `${cv.parsed.experience[0].title} at ${cv.parsed.experience[0].company}`
          : "(none)"
      }`
    : "=== USER CV ===\n(no CV uploaded yet)";

  const jobsSnippet =
    jobs.length > 0
      ? `=== SAVED JOBS (${jobs.length}) ===
${jobs
  .map(
    (j, i) =>
      `${i + 1}. ${j.title || "(no title)"} at ${j.company || "(no company)"} — id=${j.id} status=${j.status}`
  )
  .join("\n")}`
      : "=== SAVED JOBS ===\n(no saved jobs)";

  const appsSnippet =
    applications.length > 0
      ? `=== APPLICATION PIPELINE ===
${applications
  .map(
    (a) =>
      `- job ${a.job_id}: ${a.status}${a.applied_at ? ` (applied ${a.applied_at.slice(0, 10)})` : ""}${
        a.interview_at ? ` (interview ${a.interview_at.slice(0, 10)})` : ""
      }`
  )
  .join("\n")}`
      : "";

  const modeHint = mode
    ? `=== REQUESTED MODE ===\nUser pre-selected mode: ${mode}. Open with that unless they redirect.`
    : "=== MODE ===\nAsk the user which mode they want at the start: mock interview, pep talk, pipeline review, or debrief.";

  return `=== IDENTITY ===
You are VetrApply Hotline — a personal AI career coach on a live phone call with ${name}. You have read their CV and their saved jobs. Your job is to help them with one of four modes:
  - mock interview: ask realistic interview questions for a specific saved job and give feedback on their answers
  - pep talk: short, focused confidence boost before a real interview
  - pipeline review: walk through their saved jobs and applications, surface what to do next
  - debrief: capture what happened in an interview they just had

${styleNote}

=== STYLE ===
You are on a live phone call. Keep replies 1-3 sentences. Sound warm, direct, and human. No corporate jargon. Use natural acknowledgements ("Got it." "Alright." "Makes sense."). Never read out IDs or UUIDs to the caller.

=== CRITICAL RULES ===
- NEVER invent experience the candidate doesn't have. If you need information about their CV or jobs, it is loaded below — read it before asking the caller.
- For mock interviews: ask one question, wait for their full answer, then call score_answer with score 0-10 and one-sentence feedback, then ask the next question.
- Before ending the call, you MUST call save_debrief with a 1-3 sentence summary, then end_call.
- Do not say "I'm an AI" or "I cannot help with that" — you are a coach, just stay in role.

${cvSnippet}

${jobsSnippet}

${appsSnippet}

${modeHint}

=== TOOL CONTRACT ===
Tools available: list_saved_jobs, start_mock_interview, score_answer, load_pack, save_debrief, end_call.
- Most of the time the data you need is already in the context above — only call list_saved_jobs if the caller asks "what jobs am I on" and you need to refresh.
- start_mock_interview returns first question; you then ask it; their answer comes back as next user message; you call score_answer; then ask next question.
- save_debrief + end_call always run at the close of the call.`;
}

/**
 * One turn of the coach conversation.
 * @param {{ systemPrompt: string, history: Array<{role:'user'|'model'|'tool', parts: any[]}>, userText: string }} args
 * @returns {Promise<{ text: string, toolCalls: Array<{name:string, args:any}> }>}
 */
export async function coachTurn({ systemPrompt, history, userText }) {
  const contents = [
    ...history,
    { role: "user", parts: [{ text: userText }] },
  ];

  const res = await client.models.generateContent({
    model: env.GEMINI_PHONE_MODEL,
    contents,
    config: {
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      temperature: 0.7,
      maxOutputTokens: 400,
    },
  });

  let text = "";
  const toolCalls = [];
  const parts = res?.candidates?.[0]?.content?.parts || [];
  for (const p of parts) {
    if (p.text) text += p.text;
    if (p.functionCall) {
      toolCalls.push({ name: p.functionCall.name, args: p.functionCall.args || {} });
    }
  }
  return { text: text.trim(), toolCalls };
}

/**
 * Continuation turn after providing tool results back to the model.
 */
export async function continueWithToolResults({ systemPrompt, history, toolResults }) {
  const contents = [
    ...history,
    {
      role: "user",
      parts: toolResults.map((r) => ({
        functionResponse: { name: r.name, response: r.response },
      })),
    },
  ];

  const res = await client.models.generateContent({
    model: env.GEMINI_PHONE_MODEL,
    contents,
    config: {
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      temperature: 0.7,
      maxOutputTokens: 400,
    },
  });

  let text = "";
  const toolCalls = [];
  const parts = res?.candidates?.[0]?.content?.parts || [];
  for (const p of parts) {
    if (p.text) text += p.text;
    if (p.functionCall) {
      toolCalls.push({ name: p.functionCall.name, args: p.functionCall.args || {} });
    }
  }
  return { text: text.trim(), toolCalls };
}
