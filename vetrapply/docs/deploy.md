# Deploy to Railway

VetrApply ships as **two Railway services in one project**, both reading from this monorepo.

| Service | Source path | Start cmd | Domain |
|---|---|---|---|
| `vetrapply-api` | `vetrapply/apps/api` | `npm run start -w apps/api` | `api.vetrapply.com` |
| `vetrapply-phone` | `vetrapply/apps/phone` | `npm run start -w apps/phone` | `hotline.vetrapply.com` |

## One-time setup

1. **Push the branch**

```powershell
cd C:\Users\nithi\VetraTD\Job-stop-sign
git push -u origin feature/backend
```

2. **Create the Railway project**

   - Go to https://railway.com → **New Project** → **Deploy from GitHub repo**
   - Pick `VetraTD/Job-stop-sign`
   - Railway will offer to create a first service; let it.

3. **Configure the `vetrapply-api` service**

   In the service → **Settings**:

   - **Source Repo**: `VetraTD/Job-stop-sign`
   - **Branch**: `feature/backend` (until merged to main)
   - **Root Directory**: `vetrapply`
   - **Watch Paths** (optional, to skip rebuilds when only phone changes): `vetrapply/apps/api/**` and `vetrapply/packages/**` and `vetrapply/package*.json`
   - **Config-as-Code**: point to `apps/api/railway.json`
   - **Custom Start Command**: leave blank (railway.json sets it)

   In **Variables** add everything from `apps/api/.env.example` with real values:

   ```
   NODE_ENV=production
   PORT=8080
   LOG_LEVEL=info
   SUPABASE_URL=...
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   SUPABASE_STORAGE_BUCKET=cvs
   GOOGLE_GENAI_API_KEY=...
   GEMINI_PACK_MODEL=gemini-2.5-pro
   GEMINI_PARSER_MODEL=gemini-2.5-pro
   SENTRY_DSN=
   CORS_ORIGINS=https://app.vetrapply.com,http://localhost:5173
   RATE_LIMIT_GLOBAL_PER_MIN=120
   RATE_LIMIT_PACKS_PER_HOUR=20
   ```

   Also add `NODE_OPTIONS=--use-system-ca` only if Railway build host has TLS-intercepting CAs (it usually does not — try without first; add only if Supabase calls fail with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`).

   In **Settings → Networking**:

   - Click **Generate Domain** to get a `*.up.railway.app` URL for smoke-testing
   - Add custom domain `api.vetrapply.com` (point CNAME in your DNS provider to the Railway target it gives you)

4. **Add the `vetrapply-phone` service**

   In the same project → **+ New** → **GitHub Repo** → pick the same repo.

   In **Settings**:
   - **Root Directory**: `vetrapply`
   - **Config-as-Code**: `apps/phone/railway.json`
   - **Watch Paths**: `vetrapply/apps/phone/**` and `vetrapply/packages/**` and `vetrapply/package*.json`

   In **Variables** add everything from `apps/phone/.env.example`. `BASE_URL` should be the Railway-generated phone domain (or `https://hotline.vetrapply.com` once custom domain is set).

   In **Networking**:
   - Generate domain
   - Add custom domain `hotline.vetrapply.com`
   - Twilio webhook → set the phone number's voice URL to `https://hotline.vetrapply.com/twilio/voice` (will be wired in M5).

## Verify deploy

```bash
# API
curl https://api.vetrapply.com/health
curl https://<railway-generated-domain>/health

# Phone scaffold
curl https://hotline.vetrapply.com/health
```

## Common deploy issues

- **`UNABLE_TO_VERIFY_LEAF_SIGNATURE` against Supabase** — set `NODE_OPTIONS=--use-system-ca`. Only needed if Railway's build host has TLS-intercepting CAs.
- **`pdf-parse` fails reading `./test/data/05-versions-space.pdf`** — we import from `pdf-parse/lib/pdf-parse.js` to avoid the auto-test. Do not change that import.
- **CORS error from frontend** — add the friend's deployed origin to `CORS_ORIGINS` env var, comma-separated.
- **Health check timing out** — increase `healthcheckTimeout` in railway.json. Server should boot in <5s; if not, env validation is probably failing — check service logs.
- **Out-of-memory on build** — set `NIXPACKS_NO_CACHE=1` or upgrade plan.

## Promoting feature/backend to main

Once the deploy is stable:

```powershell
git checkout main
git merge feature/backend --no-ff
git push
```

Then in each Railway service → Settings → Branch → switch to `main`.
