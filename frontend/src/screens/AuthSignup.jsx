import { useState } from 'react'
import { AuthSpinner } from '../components/AuthSpinner'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { ensureProfileRow } from '../lib/profiles'

export function AuthSignup({ onBack, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!isSupabaseConfigured) {
      setError('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const siteUrl = (
      import.meta.env.VITE_SITE_URL?.trim() ||
      (typeof window !== 'undefined' ? window.location.origin : '')
    ).replace(/\/$/, '')
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: siteUrl
        ? { emailRedirectTo: `${siteUrl}/` }
        : undefined,
    })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    if (data.session?.user) {
      const { error: pErr } = await ensureProfileRow(data.session.user.id)
      if (pErr) {
        setError(pErr.message)
        setLoading(false)
        return
      }
      return
    }
    if (data.user) {
      setInfo(
        'Check your email to confirm your account, then return here to log in.',
      )
    }
    setLoading(false)
  }

  return (
    <div className="page auth-page">
      <button type="button" className="link-back" onClick={onBack}>
        ← Back
      </button>
      <div className="auth-card">
        {loading ? (
          <div className="auth-card-overlay">
            <AuthSpinner label="Creating your account…" />
          </div>
        ) : null}
        <h1 className="page-title">Create account</h1>
        <p className="page-subtitle">
          Creates a Supabase Auth user and a row in <code className="profile-code">profiles</code> when you first sign in.
        </p>
        {!isSupabaseConfigured ? (
          <p className="profile-banner profile-banner--error">
            Supabase env vars are missing. See <code className="profile-code">.env.example</code>.
          </p>
        ) : null}
        <form className="form" onSubmit={handleSubmit}>
          {error ? (
            <p className="profile-banner profile-banner--error">{error}</p>
          ) : null}
          {info ? (
            <p className="profile-banner profile-banner--ok">{info}</p>
          ) : null}
          <label className="field">
            <span className="field-label">Email</span>
            <input
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input
              className="input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || !isSupabaseConfigured}
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account?{' '}
          <button type="button" className="link-inline" onClick={onLogin}>
            Log in
          </button>
        </p>
      </div>
    </div>
  )
}
