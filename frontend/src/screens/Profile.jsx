import { useEffect, useState } from 'react'
import { fetchProfile, upsertProfile } from '../lib/profiles'

/** `public.geo_market` */
const GEO_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'UK', label: 'UK' },
  { value: 'US', label: 'US' },
]

/** `public.experience_level` */
const EXP_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'intern', label: 'Intern' },
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'exec', label: 'Executive' },
]

/** `public.work_authorization` */
const WORK_AUTH_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'citizen', label: 'Citizen' },
  { value: 'permanent_resident', label: 'Permanent resident' },
  { value: 'visa_required', label: 'Visa required' },
  { value: 'student', label: 'Student' },
]

function emptyForm() {
  return {
    display_name: '',
    target_role: '',
    location: '',
    geo_market: '',
    experience_level: '',
    work_authorization: '',
    linkedin_url: '',
  }
}

export function Profile({ user, onSaved }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedHint, setSavedHint] = useState('')
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      const { profile, error: err } = await fetchProfile(user.id)
      if (cancelled) return
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      if (profile) {
        setForm({
          display_name: profile.display_name ?? '',
          target_role: profile.target_role ?? '',
          location: profile.location ?? '',
          geo_market: profile.geo_market ?? '',
          experience_level: profile.experience_level ?? '',
          work_authorization: profile.work_authorization ?? '',
          linkedin_url: profile.linkedin_url ?? '',
        })
      } else {
        setForm(emptyForm())
      }
      setLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [user.id])

  function patch(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setSavedHint('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSavedHint('')
    const row = {
      id: user.id,
      display_name: form.display_name.trim() || null,
      target_role: form.target_role.trim() || null,
      location: form.location.trim() || null,
      geo_market: form.geo_market || null,
      experience_level: form.experience_level || null,
      work_authorization: form.work_authorization || null,
      linkedin_url: form.linkedin_url.trim() || null,
    }
    const { profile, error: err } = await upsertProfile(row)
    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }
    if (profile) {
      setForm({
        display_name: profile.display_name ?? '',
        target_role: profile.target_role ?? '',
        location: profile.location ?? '',
        geo_market: profile.geo_market ?? '',
        experience_level: profile.experience_level ?? '',
        work_authorization: profile.work_authorization ?? '',
        linkedin_url: profile.linkedin_url ?? '',
      })
      onSaved?.(profile)
    }
    setSavedHint('Profile saved.')
  }

  return (
    <div className="page profile-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Your profile</h1>
          <p className="page-subtitle">
            Stored in Supabase <code className="profile-code">profiles</code> — one row per account (
            <span className="profile-email">{user.email}</span>).
          </p>
        </div>
      </div>

      {loading ? (
        <p className="page-subtitle">Loading profile…</p>
      ) : (
        <form className="form form-wide panel-inner" onSubmit={handleSubmit}>
          {error ? <p className="profile-banner profile-banner--error">{error}</p> : null}
          {savedHint ? (
            <p className="profile-banner profile-banner--ok">{savedHint}</p>
          ) : null}

          <div className="form-grid">
            <label className="field">
              <span className="field-label">Display name</span>
              <input
                className="input"
                value={form.display_name}
                onChange={(e) => patch('display_name', e.target.value)}
                placeholder="How you want to appear"
                autoComplete="name"
              />
            </label>
            <label className="field">
              <span className="field-label">Target role</span>
              <input
                className="input"
                value={form.target_role}
                onChange={(e) => patch('target_role', e.target.value)}
                placeholder="e.g. Product Designer"
              />
            </label>
            <label className="field">
              <span className="field-label">Location</span>
              <input
                className="input"
                value={form.location}
                onChange={(e) => patch('location', e.target.value)}
                placeholder="City or region"
              />
            </label>
            <label className="field">
              <span className="field-label">Geo market</span>
              <select
                className="input"
                value={form.geo_market}
                onChange={(e) => patch('geo_market', e.target.value)}
              >
                {GEO_OPTIONS.map((o) => (
                  <option key={`geo-${o.value || 'x'}`} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Experience level</span>
              <select
                className="input"
                value={form.experience_level}
                onChange={(e) => patch('experience_level', e.target.value)}
              >
                {EXP_OPTIONS.map((o) => (
                  <option key={`exp-${o.value || 'x'}`} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">Work authorization</span>
              <select
                className="input"
                value={form.work_authorization}
                onChange={(e) => patch('work_authorization', e.target.value)}
              >
                {WORK_AUTH_OPTIONS.map((o) => (
                  <option key={`wa-${o.value || 'x'}`} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field field-span">
              <span className="field-label">LinkedIn URL</span>
              <input
                className="input"
                type="url"
                value={form.linkedin_url}
                onChange={(e) => patch('linkedin_url', e.target.value)}
                placeholder="https://www.linkedin.com/in/…"
                autoComplete="url"
              />
            </label>
          </div>

          <div className="profile-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
