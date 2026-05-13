import * as db from "../lib/supabase.js";

/**
 * Execute one tool call. Returns the JSON-serialisable response the model expects back.
 *
 * Returns null if this tool is terminal (end_call) and the caller should stop.
 */
export async function runTool({ name, args, state }) {
  switch (name) {
    case "list_saved_jobs": {
      return {
        jobs: (state.userCtx.jobs || []).map((j) => ({
          id: j.id,
          company: j.company,
          title: j.title,
          status: j.status,
        })),
      };
    }

    case "load_pack": {
      const pack = await db.loadActivePack(state.userCtx.profile.id, args.job_id);
      if (!pack) return { error: "no pack found for that job_id" };
      return {
        tailored_summary: pack.tailored_summary,
        cover_letter: pack.cover_letter,
        bullets: pack.bullets,
        application_questions: pack.application_questions,
        interview_prep: pack.interview_prep,
        follow_up_email: pack.follow_up_email,
        skills_gap: pack.skills_gap,
      };
    }

    case "start_mock_interview": {
      const job = (state.userCtx.jobs || []).find((j) => j.id === args.job_id);
      if (!job) return { error: "job_id not in saved jobs" };
      const pack = await db.loadActivePack(state.userCtx.profile.id, args.job_id);
      const seedQs = pack?.interview_prep?.likely_questions?.slice(0, 8) || [
        "Tell me about yourself.",
        "Why this role at " + (job.company || "this company") + "?",
        "What's your biggest strength relevant to this role?",
        "Walk me through a recent project you're proud of.",
      ];
      const sessionId = await db.createMockSession({
        callId: state.callRow.id,
        userId: state.userCtx.profile.id,
        jobId: args.job_id,
        questions: seedQs,
      });
      state.mockSessionId = sessionId;
      state.pendingMockQuestion = seedQs[0];
      state.callRow.linked_job_id = args.job_id;
      return { session_id: sessionId, first_question: seedQs[0] };
    }

    case "score_answer": {
      await db.scoreMockAnswer({
        sessionId: args.session_id,
        question: args.question,
        answer: args.answer,
        score: Math.max(0, Math.min(10, Number(args.score) || 0)),
        feedback: String(args.feedback || ""),
      });
      return { ok: true };
    }

    case "save_debrief": {
      await db.saveDebrief({
        callId: state.callRow.id,
        summary: args.summary,
        linkedJobId: args.linked_job_id || state.callRow.linked_job_id || null,
      });
      return { ok: true };
    }

    case "end_call": {
      return { ok: true, terminal: true, farewell: args.farewell || "" };
    }

    default:
      return { error: `unknown tool: ${name}` };
  }
}
