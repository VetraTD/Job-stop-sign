# VetrApply

AI job application autopilot. Upload CV, paste a JD or drop a job link, get a tailored application pack (cover letter, bullets, screener answers, interview prep, follow-up email, skills-gap radar). Companion AI career-coach hotline ties to the same data.

## Monorepo layout

```
vetrapply/
├── apps/
│   ├── api/                 Express REST backend (Supabase, Gemini)
│   └── phone/               Twilio + Deepgram + Google TTS + Gemini realtime
└── packages/
    └── phone-core/          Shared lib (twiml, logger, sentry, deepgram, googleTts, twilioNumbers)
```

## Local dev

Prereqs: Node 20+, npm 10+.

```
cd vetrapply
npm install
cp apps/api/.env.example apps/api/.env       # fill in secrets
cp apps/phone/.env.example apps/phone/.env   # fill in secrets
npm run dev:api                              # API on :8080
npm run dev:phone                            # Phone on :3000
```

## Apps

- **api** — REST backend. `apps/api/README.md` for endpoint list.
- **phone** — Twilio voice service. `apps/phone/README.md` for call flow.

## Tech stack

- Express 5
- Supabase (Auth + Postgres + Storage)
- Gemini 2.5 Pro (pack/CV/JD), Gemini 2.0 Flash (phone realtime)
- Twilio + Deepgram + Google Cloud TTS (phone)
- Vitest
- Railway (host)
