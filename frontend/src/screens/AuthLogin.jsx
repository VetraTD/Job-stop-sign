import { useState } from 'react'

export function AuthLogin({ onBack, onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onSuccess({ email: email.trim() || 'you@example.com' })
  }

  return (
    <div className="page auth-page">
      <button type="button" className="link-back" onClick={onBack}>
        ← Back
      </button>
      <div className="auth-card">
        <h1 className="page-title">Log in</h1>
        <p className="page-subtitle">
          Frontend-only demo — use any email and password.
        </p>
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
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
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block">
            Log in
          </button>
        </form>
      </div>
    </div>
  )
}
