/**
 * Minimal TwiML builders for VetrApply hotline.
 * Uses Twilio's <Gather> for input + <Say> for output. No media stream.
 */

const VOICE = "Polly.Aria-Neural";
const LANG = "en-GB";

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function ssmlSafe(text) {
  return escapeXml(text).replace(/\.{3,}/g, ".").trim();
}

export function twimlGatherDtmf({ prompt, actionUrl, numDigits, timeoutSec = 10 }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="dtmf" numDigits="${numDigits}" timeout="${timeoutSec}" action="${escapeXml(actionUrl)}" method="POST">
    <Say voice="${VOICE}" language="${LANG}">${ssmlSafe(prompt)}</Say>
  </Gather>
  <Say voice="${VOICE}" language="${LANG}">I didn't catch that. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

export function twimlGatherSpeech({ prompt, actionUrl, timeoutSec = 6, speechTimeout = "auto" }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${escapeXml(actionUrl)}" method="POST" speechTimeout="${speechTimeout}" timeout="${timeoutSec}" language="en-GB" speechModel="phone_call">
    <Say voice="${VOICE}" language="${LANG}">${ssmlSafe(prompt)}</Say>
  </Gather>
  <Say voice="${VOICE}" language="${LANG}">I'm still here whenever you're ready.</Say>
  <Redirect method="POST">${escapeXml(actionUrl)}</Redirect>
</Response>`;
}

export function twimlSayAndContinue({ text, actionUrl }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOICE}" language="${LANG}">${ssmlSafe(text)}</Say>
  <Redirect method="POST">${escapeXml(actionUrl)}</Redirect>
</Response>`;
}

export function twimlSayAndHangup(text) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOICE}" language="${LANG}">${ssmlSafe(text)}</Say>
  <Hangup/>
</Response>`;
}

export function twimlHangup() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Hangup/>
</Response>`;
}
