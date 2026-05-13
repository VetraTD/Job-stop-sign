export function Landing({ onLogin, onSignup }) {
  return (
    <div className="page landing">
      <header className="landing-header">
        <div className="brand-inline">
          <span className="brand-mark lg" aria-hidden />
          <span className="brand-text">Job Stop Sign</span>
        </div>
        <div className="landing-actions">
          <button type="button" className="btn btn-ghost" onClick={onLogin}>
            Log in
          </button>
          <button type="button" className="btn btn-primary" onClick={onSignup}>
            Sign up
          </button>
        </div>
      </header>

      <section className="landing-hero" aria-labelledby="landing-headline">
        <div className="landing-hero-inner hero-block">
          <p className="eyebrow">Job search, upgraded</p>
          <h1 id="landing-headline" className="hero-title">
            Apply to better jobs faster
          </h1>
          <p className="hero-lead">
            Paste your CV and a job description. Get a tailored application
            pack, interview prep, follow-up email, and access to your AI career
            coach.
          </p>
          <div className="hero-ctas">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={onSignup}
            >
              Create my first application pack
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={onLogin}
            >
              Log in
            </button>
            <p className="hero-ctas-note">
              Free to try in this demo — sign up, then generate packs from your
              dashboard.
            </p>
          </div>
          <div className="landing-trust">
            <p>Built for serious job seekers</p>
            <div className="landing-trust-tags" aria-hidden>
              <span>Application packs</span>
              <span>Interview prep</span>
              <span>Pipeline tracker</span>
            </div>
          </div>
        </div>
      </section>

      <p className="landing-section-title" id="features-heading">
        Everything in one workflow
      </p>
      <section
        className="feature-grid"
        aria-labelledby="features-heading"
      >
        <article className="feature-card">
          <div className="feature-icon" aria-hidden>
            ✦
          </div>
          <h2>Tailored application pack</h2>
          <p>
            CV notes, a role-aligned summary, cover letter, strengths to
            mention, interview questions, and a ready-to-send follow-up.
          </p>
        </article>
        <article className="feature-card">
          <div className="feature-icon" aria-hidden>
            ◎
          </div>
          <h2>Command-centre dashboard</h2>
          <p>
            See totals and stage counts at a glance, then jump into recent
            applications without losing momentum.
          </p>
        </article>
        <article className="feature-card">
          <div className="feature-icon" aria-hidden>
            ☎
          </div>
          <h2>AI career coach hotline</h2>
          <p>
            Mock interviews, CV feedback, cover letter polish, and follow-up
            strategy — whenever you need a second brain.
          </p>
        </article>
      </section>
    </div>
  )
}
