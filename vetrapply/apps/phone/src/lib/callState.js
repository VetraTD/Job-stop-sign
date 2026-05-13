/**
 * Per-call in-memory state. Keyed by Twilio CallSid.
 *
 * State shape:
 *   {
 *     step: "greeting" | "pin_entry" | "coaching" | "ending",
 *     pin: string | null,
 *     callRow: { id, user_id, mode, linked_job_id } | null,
 *     userCtx: { profile, cv, jobs, applications } | null,
 *     conversation: [{ role: "user"|"assistant", text }],
 *     mockSessionId: string | null,
 *     pendingMockQuestion: string | null,
 *   }
 */
const states = new Map();
const TTL_MS = 60 * 60_000;

export const STEPS = {
  GREETING: "greeting",
  PIN_ENTRY: "pin_entry",
  COACHING: "coaching",
  ENDING: "ending",
};

export function getOrCreate(callSid) {
  let s = states.get(callSid);
  if (s) return s;
  s = {
    step: STEPS.GREETING,
    pin: null,
    callRow: null,
    userCtx: null,
    conversation: [],
    mockSessionId: null,
    pendingMockQuestion: null,
    createdAt: Date.now(),
  };
  states.set(callSid, s);
  return s;
}

export function get(callSid) {
  return states.get(callSid) || null;
}

export function clear(callSid) {
  states.delete(callSid);
}

setInterval(() => {
  const cutoff = Date.now() - TTL_MS;
  for (const [k, v] of states.entries()) {
    if (v.createdAt < cutoff) states.delete(k);
  }
}, 5 * 60_000).unref();
