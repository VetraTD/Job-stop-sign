import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Look up a hotline session by PIN. Returns { call_id, user_id, mode, linked_job_id }
 * or null if PIN not found / already used / expired.
 */
export async function findSessionByPin(pin) {
  const { data, error } = await supabase
    .from("hotline_calls")
    .select("id, user_id, mode, linked_job_id, started_at, twilio_call_sid, metadata")
    .eq("metadata->>pin", pin)
    .is("twilio_call_sid", null)
    .gte("started_at", new Date(Date.now() - 30 * 60_000).toISOString())
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function bindCallToSession({ callId, twilioCallSid }) {
  await supabase
    .from("hotline_calls")
    .update({ twilio_call_sid: twilioCallSid })
    .eq("id", callId);
}

export async function loadUserContext(userId) {
  const [profileQ, cvsQ, jobsQ, appsQ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase
      .from("cvs")
      .select("id, label, raw_text, parsed, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("jobs")
      .select("id, company, title, location, raw_text, parsed, status")
      .eq("user_id", userId)
      .eq("status", "saved")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("applications")
      .select("id, job_id, status, applied_at, interview_at, notes")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(10),
  ]);

  return {
    profile: profileQ.data || null,
    cv: cvsQ.data?.[0] || null,
    jobs: jobsQ.data || [],
    applications: appsQ.data || [],
  };
}

export async function loadActivePack(userId, jobId) {
  const { data } = await supabase
    .from("application_packs")
    .select("*")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function appendTranscript({ callId, role, content }) {
  await supabase.from("call_transcripts").insert({
    call_id: callId,
    role,
    content: String(content || "").slice(0, 8000),
  });
}

export async function saveDebrief({ callId, summary, linkedJobId }) {
  const updates = {
    ended_at: new Date().toISOString(),
  };
  if (summary) updates.summary = String(summary).slice(0, 4000);
  if (linkedJobId) updates.linked_job_id = linkedJobId;
  await supabase.from("hotline_calls").update(updates).eq("id", callId);
}

export async function createMockSession({ callId, userId, jobId, questions }) {
  const { data } = await supabase
    .from("mock_interview_sessions")
    .insert({
      call_id: callId,
      user_id: userId,
      job_id: jobId || null,
      questions,
    })
    .select("id")
    .single();
  return data?.id;
}

export async function scoreMockAnswer({ sessionId, question, answer, score, feedback }) {
  const { data: existing } = await supabase
    .from("mock_interview_sessions")
    .select("answers, scores")
    .eq("id", sessionId)
    .maybeSingle();
  if (!existing) return;
  const answers = Array.isArray(existing.answers) ? existing.answers : [];
  const scores = existing.scores && typeof existing.scores === "object" ? existing.scores : {};
  answers.push({ question, answer, ts: new Date().toISOString() });
  scores[String(answers.length)] = { score, feedback };
  await supabase
    .from("mock_interview_sessions")
    .update({ answers, scores })
    .eq("id", sessionId);
}
