// Create a test user (or reuse if exists) and print a fresh access token.
//
// Usage:
//   node scripts/mint-test-user.js                       # defaults
//   node scripts/mint-test-user.js test@vetrapply.dev    # custom email
//   node scripts/mint-test-user.js test@vetrapply.dev MyPassw0rd!
//
// Requires SUPABASE_URL + SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY in apps/api/.env.

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in apps/api/.env");
  process.exit(1);
}

const email = process.argv[2] || "test@vetrapply.dev";
const password = process.argv[3] || "VetrTest!2026";

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureUser() {
  // Try create (email_confirm so we can sign in without confirmation link).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createErr) {
    const msg = String(createErr.message || "").toLowerCase();
    const exists = msg.includes("already") || msg.includes("registered") || msg.includes("exists");
    if (!exists) {
      console.error("createUser failed:", createErr.message);
      process.exit(1);
    }
    console.log(`[mint] user ${email} already exists — reusing`);
    return;
  }
  console.log(`[mint] created user ${email} (id ${created.user.id})`);
}

async function signIn() {
  const anon = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("signIn failed:", error.message);
    process.exit(1);
  }
  return data.session;
}

await ensureUser();
const session = await signIn();

console.log("");
console.log("================ TEST USER ================");
console.log("email           :", email);
console.log("password        :", password);
console.log("user_id         :", session.user.id);
console.log("access_token    :", session.access_token);
console.log("expires_in      :", session.expires_in, "seconds");
console.log("===========================================");
console.log("");
console.log("Quick test (PowerShell):");
console.log(`  Invoke-RestMethod http://localhost:8080/auth/me -Headers @{Authorization='Bearer ${session.access_token}'}`);
console.log("");
console.log("Quick test (curl):");
console.log(`  curl -H "Authorization: Bearer ${session.access_token}" http://localhost:8080/auth/me`);
