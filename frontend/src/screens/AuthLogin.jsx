import { useState } from 'react'
import { AuthSpinner } from '../components/AuthSpinner'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'
import { ensureProfileRow } from '../lib/profiles'

export function AuthLogin({ onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!isSupabaseConfigured) {
      setError('Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.')
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }
    if (data.user) {
      const { error: pErr } = await ensureProfileRow(data.user.id)
      if (pErr) {
        setError(pErr.message)
        setLoading(false)
        return
      }
      return
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
            <AuthSpinner label="Signing you in…" />
          </div>
        ) : null}
        <h1 className="page-title">Log in</h1>
        <p className="page-subtitle">
          Sign in with your Supabase account. Session is stored in the browser.
        </p>
        {!isSupabaseConfigured ? (
          <p className="profile-banner profile-banner--error">
            Supabase env vars are missing. Copy{' '}
            <code className="profile-code">.env.example</code> to{' '}
            <code className="profile-code">.env</code> and add your project URL
            and anon key.
          </p>
        ) : null}
        <form className="form" onSubmit={handleSubmit}>
          {error ? (
            <p className="profile-banner profile-banner--error">{error}</p>
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || !isSupabaseConfigured}
          >
            {loading ? 'Signing in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}
