import { useState } from 'react'

export function AuthSignup({ onBack, onSuccess, onLogin }) {
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
        <h1 className="page-title">Create account</h1>
        <p className="page-subtitle">
          No backend yet — this stores your session in memory for the demo.
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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block">
            Sign up
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
