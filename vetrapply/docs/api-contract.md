# VetrApply API Contract

Reference for the frontend (Vite + React + Tailwind).

- **Base URL (dev)**: `http://localhost:8080`
- **Base URL (prod)**: `https://api.vetrapply.com`
- **Content-Type**: `application/json` (except `POST /cv` which is `multipart/form-data`)
- **Auth**: `Authorization: Bearer <supabase_jwt>` on every endpoint except `GET /health`. Get the JWT from the Supabase client session.

```js
const { data: { session } } = await supabase.auth.getSession();
const token = session.access_token;

await fetch(`${API_BASE}/cv`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## Error shape

Every non-2xx response returns:

```json
{ "error": { "code": "STRING", "message": "human readable", "details": "optional" } }
```

Codes:

| Code | Status | Meaning |
|---|---|---|
| `AUTH_REQUIRED` | 401 | Missing `Authorization` header |
| `AUTH_INVALID` | 401 | Token expired or malformed |
| `FORBIDDEN` | 403 | Authenticated but not allowed |
| `NOT_FOUND` | 404 | Resource doesn't exist (or belongs to another user) |
| `VALIDATION` | 400 | Bad request body / params |
| `UNPARSEABLE_JD` | 422 | JD URL fetch failed — show "paste manually" |
| `UNPARSEABLE_CV` | 422 | PDF/DOCX couldn't be extracted — show "try another file" |
| `RATE_LIMITED` | 429 | Too many requests — show retry-after message |
| `LLM_FAILED` | 502 | Gemini error — show "try again in a moment" |
| `INTERNAL` | 500 | Bug — show generic error + Sentry will catch it |

Cross-user access attempts return **404** (never 403) so existence is not leaked.

---

## Endpoints

### `GET /health`

No auth. Quick liveness check.

```json
200 { "ok": true, "service": "vetrapply-api", "version": "0.1.0", "uptime_s": 123 }
```

---

### `GET /auth/me`

Returns current user + lazy-provisioned profile.

```json
200 {
  "user": {
    "id": "uuid",
    "email": "you@example.com",
    "profile": {
      "id": "uuid",
      "display_name": null,
      "target_role": null,
      "location": null,
      "geo_market": "UK",
      "experience_level": null,
      "work_authorization": null,
      "linkedin_url": null,
      "created_at": "ISO",
      "updated_at": "ISO"
    }
  }
}
```

---

### CV

`POST /cv` — multipart form

- field `file`: PDF or DOCX, max 5MB
- field `label` (optional): string, max 200 chars

```json
201 { "cv": { "id", "user_id", "label", "file_path", "file_mime", "raw_text", "parsed": {...}, "is_active": true, "created_at" } }
```

Errors: `400 VALIDATION` (wrong mime), `413 VALIDATION` (too large), `422 UNPARSEABLE_CV`.

`GET /cv` → `{ cvs: [ { id, label, file_mime, is_active, created_at } ] }`

`GET /cv/:id` → `{ cv: {...full row}, signed_url: "https://...?token=..." }` (URL expires in 5 min)

`PATCH /cv/:id` body `{ label?, is_active? }`. Setting `is_active: true` flips other CVs to `false`. Returns updated row.

`DELETE /cv/:id` → `204`. Also removes the file from Storage.

---

### Jobs

`POST /jobs` body `{ source_url?, raw_text?, company?, title?, location? }`. At least one of `source_url` or `raw_text` required.

- If `source_url`: backend fetches via ATS adapter (Greenhouse, Lever, Workday, LinkedIn) or readability fallback. If fetch fails → 422 `UNPARSEABLE_JD`, frontend should fall back to paste.
- LLM second pass populates `parsed`.

```json
201 { "job": { "id", "user_id", "source_url", "ats_provider", "company", "title", "location", "raw_text", "parsed": {...}, "status": "saved", "created_at" } }
```

`GET /jobs?status=saved&limit=50` → `{ jobs: [...] }`

`GET /jobs/:id` → `{ job: {...} }`

`PATCH /jobs/:id` body `{ status?, company?, title?, location? }`. `status` ∈ `saved | dismissed | archived`.

`DELETE /jobs/:id` → `204`.

---

### Packs

`POST /packs` body `{ cv_id, job_id, force? }`.

- Idempotent: identical `(cv_id, job_id, cv_text, jd_text)` returns the cached pack (200) instead of regenerating (201).
- Pass `force: true` to override cache and regenerate.
- Generation takes ~30–60s.
- Rate-limited to 20 per hour per user.

```json
201 { "pack": {
  "id", "user_id", "cv_id", "job_id",
  "tailored_summary": "...",
  "cover_letter": "...",
  "bullets": ["...", "...", "...", "...", "..."],
  "application_questions": [{ "question": "...", "answer": "..." }],
  "interview_prep": {
    "likely_questions": ["..."],
    "story_bank": [{ "title", "situation", "task", "action", "result" }]
  },
  "follow_up_email": "...",
  "skills_gap": {
    "missing": ["..."],
    "adjacent": ["..."],
    "recommendations": ["..."]
  },
  "input_hash": "sha256",
  "generated_by_model": "gemini-2.5-pro",
  "generation_cost_cents": 2,
  "created_at": "ISO"
}, "cached": false }
```

`GET /packs` → `{ packs: [ { id, cv_id, job_id, generated_by_model, generation_cost_cents, created_at } ] }`
`GET /packs?job_id=...` filters by job.

`GET /packs/:id` → `{ pack: {...full} }`

`DELETE /packs/:id` → `204`.

---

### Applications (tracker)

`POST /applications` body `{ job_id, pack_id?, status?, applied_at?, interview_at?, notes? }`.

- Upserts on `(user_id, job_id)` — calling twice for same job updates the same row.
- `status` ∈ `saved | applied | interview | offer | rejected | withdrawn` (default `saved`).
- `applied_at` / `interview_at` are ISO timestamps.

```json
201 { "application": { "id", "user_id", "job_id", "pack_id", "status", "applied_at", "interview_at", "notes", "created_at", "updated_at" } }
```

`GET /applications?status=interview` → `{ applications: [...] }` (omit status to get all).

`PATCH /applications/:id` body `{ pack_id?, status?, applied_at?, interview_at?, notes? }`. Use `null` to clear a nullable field.

`DELETE /applications/:id` → `204`.

---

### Hotline (M5)

To be wired up alongside `apps/phone`. Endpoint shapes:

`POST /hotline/sessions` body `{ mode: "mock_interview"|"pep_talk"|"pipeline_review"|"debrief", job_id?: uuid }`

```json
201 { "call_id": "uuid", "dial_number": "+44...", "pin": "123456" }
```

Frontend shows the user the number to dial and the PIN. They call, enter the PIN, hotline loads their context.

`GET /hotline/calls` → list of past calls with summaries.

`GET /hotline/calls/:id` → call detail + transcript.

---

## Frontend integration tips

- Use the Supabase JS client for signup, login, password reset, session refresh. Do **not** roll your own auth.
- For CV upload, build a `FormData` instance and `fetch` with `Authorization` header — `Content-Type` will be set automatically (do not set it yourself).
- Pack generation is slow (~40s). Show a progress indicator. Optionally poll `GET /packs?job_id=X` to detect completion if you want to fire-and-forget the POST.
- For JD link ingestion, optimistically accept any URL — if backend returns 422, show "couldn't fetch, paste manually" inline.
- All timestamps from the API are ISO 8601 UTC. Use `date-fns` or `luxon` for display.
- Always pass the freshest JWT; Supabase auto-refreshes if `autoRefreshToken: true` in client config.
