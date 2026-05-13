import { supabase } from './supabaseClient'

/**
 * Row shape for `public.profiles` (align columns with your Supabase table).
 * @typedef {Object} ProfileRow
 * @property {string} id
 * @property {string|null} [display_name]
 * @property {string|null} [target_role]
 * @property {string|null} [location]
 * @property {string|null} [geo_market]
 * @property {string|null} [experience_level]
 * @property {string|null} [work_auth]
 */

/**
 * @param {string} userId
 * @returns {Promise<{ profile: ProfileRow | null, error: Error | null }>}
 */
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return { profile: null, error }
  }
  return { profile: data, error: null }
}

/**
 * Create an empty profile row if none exists (safe if a DB trigger already creates it).
 * @param {string} userId
 */
export async function ensureProfileRow(userId) {
  const { data: existing, error: readErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (readErr) {
    return { profile: null, error: readErr }
  }
  if (existing) {
    return { profile: existing, error: null }
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId })
    .select()
    .single()

  return { profile: data, error }
}

/**
 * @param {Omit<ProfileRow, 'id'> & { id: string }} row
 */
export async function upsertProfile(row) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single()

  return { profile: data, error }
}
