import './Landing.css'

function LandingSkyline() {
  return (
    <div className="landing-skyline" aria-hidden>
      <svg
        className="landing-skyline-svg"
        viewBox="0 0 560 108"
        preserveAspectRatio="xMidYMax slice"
      >
        <rect width="560" height="108" fill="#0f172a" />

        {/* City silhouette */}
        <g className="landing-city" opacity="0.5">
          <rect x="0" y="62" width="18" height="46" rx="1" fill="#1e293b" />
          <rect x="22" y="48" width="22" height="60" rx="1" fill="#172554" />
          <rect x="48" y="55" width="16" height="53" rx="1" fill="#1e293b" />
          <rect x="68" y="38" width="28" height="70" rx="1" fill="#1e3a5f" />
          <rect x="100" y="52" width="20" height="56" rx="1" fill="#1e293b" />
          <rect x="124" y="44" width="24" height="64" rx="1" fill="#172554" />
          <rect x="152" y="58" width="14" height="50" rx="1" fill="#1e293b" />
          <rect x="170" y="32" width="32" height="76" rx="1" fill="#1e3a5f" />
          <rect x="206" y="50" width="18" height="58" rx="1" fill="#1e293b" />
          <rect x="228" y="40" width="26" height="68" rx="1" fill="#172554" />
          <rect x="258" y="54" width="20" height="54" rx="1" fill="#1e293b" />
          <rect x="282" y="36" width="30" height="72" rx="1" fill="#1e3a5f" />
          <rect x="316" y="48" width="22" height="60" rx="1" fill="#1e293b" />
          <rect x="342" y="56" width="16" height="52" rx="1" fill="#172554" />
          <rect x="362" y="42" width="26" height="66" rx="1" fill="#1e293b" />
          <rect x="392" y="50" width="20" height="58" rx="1" fill="#1e293b" />
          <rect x="416" y="34" width="34" height="74" rx="1" fill="#172554" />
          <rect x="454" y="52" width="18" height="56" rx="1" fill="#1e293b" />
          <rect x="476" y="46" width="24" height="62" rx="1" fill="#1e293b" />
          <rect x="504" y="58" width="56" height="50" rx="1" fill="#1e293b" />
        </g>

        <g className="landing-windows" opacity="0.28" fill="#93c5fd">
          <rect x="76" y="48" width="3" height="3" rx="0.5" />
          <rect x="82" y="56" width="3" height="3" rx="0.5" />
          <rect x="180" y="42" width="3" height="3" rx="0.5" />
          <rect x="188" y="54" width="3" height="3" rx="0.5" />
          <rect x="292" y="44" width="3" height="3" rx="0.5" />
          <rect x="426" y="42" width="3" height="3" rx="0.5" />
        </g>

        {/* Foreground street — figure reads in front */}
        <rect x="0" y="82" width="560" height="26" fill="#0f172a" opacity="0.94" />
        <line
          x1="0"
          y1="100"
          x2="560"
          y2="100"
          stroke="rgba(148,163,184,0.1)"
          strokeWidth="1"
        />

        {/* Commuter — walks along the street */}
        <g className="landing-commuter-track">
          <g transform="translate(0, 91)">
            <g className="landing-commuter">
              <rect x="-6" y="-14" width="12" height="14" rx="3" fill="#64748b" />
              <circle cx="0" cy="-20" r="4.5" fill="#94a3b8" />
              <rect x="-7" y="-1" width="5" height="10" rx="1" fill="#64748b" />
              <rect x="2" y="-1" width="5" height="10" rx="1" fill="#64748b" />
              <rect x="5" y="-12" width="8" height="6" rx="1" fill="#475569" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}

export function Landing({ onLogin, onSignup }) {
  return (
    <div className="page landing-page">
      <header className="landing-top">
        <div className="landing-brand">
          <span className="brand-mark lg" aria-hidden />
          <span className="brand-text">Job Stop Sign</span>
        </div>
        <div className="landing-top-actions">
          <button type="button" className="btn btn-ghost" onClick={onLogin}>
            Log in
          </button>
          <button type="button" className="btn btn-primary" onClick={onSignup}>
            Sign up
          </button>
        </div>
      </header>

      <LandingSkyline />

      <main className="landing-main">
        <section className="landing-hero" aria-labelledby="landing-headline">
          <div className="landing-hero-copy landing-reveal">
            <h1 id="landing-headline" className="landing-headline">
              Apply to better jobs faster
            </h1>
            <p className="landing-sub">
              Your CV, a job description — one tailored pack.
            </p>
            <div className="landing-cta-row">
              <button
                type="button"
                className="btn btn-primary btn-lg landing-cta-primary"
                onClick={onSignup}
              >
                Create my first pack
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-lg landing-cta-secondary"
                onClick={onLogin}
              >
                Log in
              </button>
            </div>
          </div>

          <div
            className="landing-preview-wrap landing-reveal landing-reveal--delay"
            aria-hidden
          >
            <div className="landing-preview">
              <div className="landing-preview-chrome">
                <span className="landing-preview-dot" />
                <span className="landing-preview-dot" />
                <span className="landing-preview-dot" />
                <span className="landing-preview-label">Pack</span>
              </div>
              <ul className="landing-preview-list">
                <li>
                  <span className="landing-preview-check" />
                  CV notes
                </li>
                <li>
                  <span className="landing-preview-check" />
                  Cover letter
                </li>
                <li>
                  <span className="landing-preview-check" />
                  Interview questions
                </li>
                <li>
                  <span className="landing-preview-check" />
                  Follow-up email
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div className="landing-flow" aria-label="How it works">
          <span>CV</span>
          <span className="landing-flow-sep" aria-hidden>
            →
          </span>
          <span>Role</span>
          <span className="landing-flow-sep" aria-hidden>
            →
          </span>
          <span>Pack</span>
        </div>

        <ul className="landing-strip" aria-label="Features">
          <li>Tailored packs</li>
          <li className="landing-strip-sep" aria-hidden>
            ·
          </li>
          <li>Pipeline</li>
          <li className="landing-strip-sep" aria-hidden>
            ·
          </li>
          <li>Coach</li>
        </ul>
      </main>
    </div>
  )
}
