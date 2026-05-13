import { env } from "./config/env.js";
import express from "express";
import twilio from "twilio";
import { log, createRequestId } from "@vetrapply/phone-core/logger";
import "@vetrapply/phone-core/sentry";

import * as state from "./lib/callState.js";
import * as db from "./lib/supabase.js";
import { buildSystemPrompt, coachTurn, continueWithToolResults } from "./services/gemini.js";
import { runTool } from "./services/toolRunner.js";
import {
  twimlGatherDtmf,
  twimlGatherSpeech,
  twimlSayAndContinue,
  twimlSayAndHangup,
  twimlHangup,
} from "./lib/twiml.js";

const app = express();
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: false }));

function buildUrl(path) {
  return `${env.BASE_URL.replace(/\/$/, "")}${path}`;
}

function twilioSignatureValidator(req, res, next) {
  if (!env.TWILIO_VALIDATE_SIGNATURE || !env.TWILIO_AUTH_TOKEN) return next();
  const signature = req.header("X-Twilio-Signature");
  const url = buildUrl(req.originalUrl);
  const valid = twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, req.body);
  if (!valid) {
    log.warn("twilio_signature_invalid", { url });
    return res.status(403).send("invalid signature");
  }
  return next();
}

// ============================================================
// /health
// ============================================================
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "vetrapply-phone",
    version: "0.1.0",
    uptime_s: Math.round(process.uptime()),
  });
});

// ============================================================
// /twilio/voice — entry: ask for PIN
// ============================================================
app.post("/twilio/voice", twilioSignatureValidator, (req, res) => {
  const callSid = req.body.CallSid;
  const reqId = createRequestId();
  log.info("call_started", { callSid, reqId });

  const s = state.getOrCreate(callSid);
  s.step = state.STEPS.PIN_ENTRY;

  res.type("text/xml").send(
    twimlGatherDtmf({
      prompt:
        "Welcome to VetrApply Hotline. Please enter your six digit pin on the keypad to identify your account.",
      actionUrl: buildUrl("/twilio/voice/pin"),
      numDigits: 6,
      timeoutSec: 15,
    })
  );
});

// ============================================================
// /twilio/voice/pin — validate PIN, load context, start coaching
// ============================================================
app.post("/twilio/voice/pin", twilioSignatureValidator, async (req, res) => {
  const callSid = req.body.CallSid;
  const digits = (req.body.Digits || "").trim();
  const s = state.getOrCreate(callSid);

  if (!digits || digits.length !== 6) {
    return res
      .type("text/xml")
      .send(twimlSayAndHangup("I didn't get a valid pin. Please request a new one from the app and call back. Goodbye."));
  }

  const session = await db.findSessionByPin(digits);
  if (!session) {
    log.warn("pin_invalid", { callSid, digits_len: digits.length });
    return res
      .type("text/xml")
      .send(twimlSayAndHangup("That pin isn't valid or has expired. Please request a fresh one from the app. Goodbye."));
  }

  await db.bindCallToSession({ callId: session.id, twilioCallSid: callSid });
  const ctx = await db.loadUserContext(session.user_id);

  s.pin = digits;
  s.callRow = { id: session.id, user_id: session.user_id, mode: session.mode, linked_job_id: session.linked_job_id };
  s.userCtx = ctx;
  s.step = state.STEPS.COACHING;
  s.conversation = [];

  const name = ctx.profile?.display_name?.trim() || "there";
  const modeLine = session.mode
    ? `Let's get into your ${session.mode.replace(/_/g, " ")}.`
    : "What would you like to focus on — mock interview, pep talk, pipeline review, or debrief?";
  const greeting = `Hi ${name}. ${modeLine}`;

  await db.appendTranscript({ callId: session.id, role: "assistant", content: greeting });

  return res
    .type("text/xml")
    .send(
      twimlGatherSpeech({
        prompt: greeting,
        actionUrl: buildUrl("/twilio/voice/turn"),
        timeoutSec: 8,
      })
    );
});

// ============================================================
// /twilio/voice/turn — speech in, Gemini turn, speech out
// ============================================================
app.post("/twilio/voice/turn", twilioSignatureValidator, async (req, res) => {
  const callSid = req.body.CallSid;
  const speech = (req.body.SpeechResult || "").trim();
  const s = state.get(callSid);

  if (!s || !s.callRow) {
    log.warn("turn_no_state", { callSid });
    return res.type("text/xml").send(twimlSayAndHangup("Sorry, the session expired. Please call back."));
  }

  if (!speech) {
    return res
      .type("text/xml")
      .send(
        twimlGatherSpeech({
          prompt: "I didn't catch that — could you say it again?",
          actionUrl: buildUrl("/twilio/voice/turn"),
        })
      );
  }

  log.info("user_turn", { callSid, len: speech.length });
  await db.appendTranscript({ callId: s.callRow.id, role: "user", content: speech });
  s.conversation.push({ role: "user", parts: [{ text: speech }] });

  const systemPrompt = buildSystemPrompt({
    profile: s.userCtx.profile,
    cv: s.userCtx.cv,
    jobs: s.userCtx.jobs,
    applications: s.userCtx.applications,
    mode: s.callRow.mode,
  });

  let turn;
  try {
    turn = await coachTurn({
      systemPrompt,
      history: s.conversation.slice(0, -1),
      userText: speech,
    });
  } catch (err) {
    log.error("gemini_failed", { callSid, err: err.message });
    return res
      .type("text/xml")
      .send(
        twimlSayAndContinue({
          text: "Sorry, something went wrong. Let's try again.",
          actionUrl: buildUrl("/twilio/voice/turn"),
        })
      );
  }

  let finalText = turn.text;
  let terminal = false;

  if (turn.toolCalls.length > 0) {
    s.conversation.push({
      role: "model",
      parts: [
        ...(turn.text ? [{ text: turn.text }] : []),
        ...turn.toolCalls.map((t) => ({ functionCall: { name: t.name, args: t.args } })),
      ],
    });

    const toolResults = [];
    for (const t of turn.toolCalls) {
      const result = await runTool({ name: t.name, args: t.args, state: s });
      toolResults.push({ name: t.name, response: result });
      if (t.name === "end_call") {
        terminal = true;
        if (result?.farewell) finalText = (finalText || "") + " " + result.farewell;
      }
    }

    try {
      const follow = await continueWithToolResults({
        systemPrompt,
        history: s.conversation,
        toolResults,
      });
      if (follow.text) finalText = (finalText ? finalText + " " : "") + follow.text;
      s.conversation.push({
        role: "model",
        parts: [{ text: follow.text || "" }],
      });
    } catch (err) {
      log.warn("gemini_continuation_failed", { callSid, err: err.message });
    }
  } else {
    s.conversation.push({ role: "model", parts: [{ text: turn.text }] });
  }

  if (!finalText || finalText.length === 0) {
    finalText = "Got it.";
  }

  await db.appendTranscript({ callId: s.callRow.id, role: "assistant", content: finalText });

  if (terminal) {
    state.clear(callSid);
    return res.type("text/xml").send(twimlSayAndHangup(finalText));
  }

  return res
    .type("text/xml")
    .send(
      twimlGatherSpeech({
        prompt: finalText,
        actionUrl: buildUrl("/twilio/voice/turn"),
      })
    );
});

// ============================================================
// /twilio/status — call lifecycle (completed/failed)
// ============================================================
app.post("/twilio/status", twilioSignatureValidator, async (req, res) => {
  const callSid = req.body.CallSid;
  const status = req.body.CallStatus;
  log.info("status_callback", { callSid, status });

  if (status === "completed" || status === "failed" || status === "no-answer" || status === "busy") {
    const s = state.get(callSid);
    if (s?.callRow) {
      await db.saveDebrief({ callId: s.callRow.id, summary: null, linkedJobId: s.callRow.linked_job_id });
    }
    state.clear(callSid);
  }
  res.sendStatus(204);
});

// 404
app.use((_req, res) => res.status(404).json({ error: { code: "NOT_FOUND" } }));

// error
app.use((err, _req, res, _next) => {
  log.error("unhandled_error", { err: err.message, stack: err.stack });
  res.status(500).send("internal error");
});

app.listen(env.PORT, () => {
  log.info("phone_started", { port: env.PORT, env: env.NODE_ENV });
});
