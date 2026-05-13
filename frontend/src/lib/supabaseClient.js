import { createClient } from '@supabase/supabase-js'

/**
 * Vite exposes `VITE_*` by default. We also allow `NEXT_PUBLIC_*` (see `envPrefix` in vite.config.js).
 */
const url =
  import.meta.env.VITE_SUPABASE_URL?.trim() ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

export const isSupabaseConfigured = Boolean(url && anonKey)

const notConfigured = () =>
  Promise.resolve({
    data: null,
    error: new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env (see .env.example), then restart `npm run dev`.',
    ),
  })

function noopTable() {
  const afterSelect = {
    eq: () => ({
      maybeSingle: notConfigured,
      single: notConfigured,
    }),
  }
  return {
    select: () => afterSelect,
    insert: () => ({
      select: () => ({
        single: notConfigured,
      }),
    }),
    upsert: () => ({
      select: () => ({
        single: notConfigured,
      }),
    }),
  }
}

function noopAuth() {
  return {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe() {} } },
    }),
    signInWithPassword: async () => ({
      data: { user: null, session: null },
      error: new Error(
        'Supabase is not configured. Add your URL and anon key to frontend/.env.',
      ),
    }),
    signUp: async () => ({
      data: { user: null, session: null },
      error: new Error(
        'Supabase is not configured. Add your URL and anon key to frontend/.env.',
      ),
    }),
    signOut: async () => ({ error: null }),
  }
}

const noopClient = {
  auth: noopAuth(),
  from: () => noopTable(),
}

/** @type {import('@supabase/supabase-js').SupabaseClient} */
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : /** @type {import('@supabase/supabase-js').SupabaseClient} */ (noopClient)
