import './AuthSpinner.css'

/** Centered activity ring + optional caption (login / session check). */
export function AuthSpinner({ label }) {
  return (
    <div className="auth-spinner" role="status" aria-live="polite" aria-busy="true">
      <div className="auth-spinner__ring" aria-hidden>
        <div className="auth-spinner__orbit" />
      </div>
      {label ? <p className="auth-spinner__label">{label}</p> : null}
    </div>
  )
}
