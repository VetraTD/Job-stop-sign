export function Hotline() {
  return (
    <div className="page hotline-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">AI Career Coach</h1>
          <p className="page-subtitle">
            Book-style guidance for interviews, CV tightening, and follow-ups.
            This preview uses a placeholder number only.
          </p>
        </div>
      </div>

      <div className="hotline-layout">
        <article className="hotline-card">
          <div className="hotline-card-inner">
            <p className="eyebrow hotline-eyebrow">Support</p>
            <h2 className="hotline-title">Call the coach line</h2>
            <p className="hotline-lead">
              Practice interviews, tighten your CV, polish a cover letter, or
              plan a follow-up — structured sessions that respect your time and
              your goals.
            </p>
            <a className="hotline-number" href="tel:+15550000000">
              +1 (555) 000-0000
            </a>
            <p className="hotline-note">
              Placeholder number for this MVP — no calls are connected yet.
            </p>
            <ul className="hotline-usecases">
              <li>Mock interview practice</li>
              <li>CV feedback</li>
              <li>Cover letter help</li>
              <li>Follow-up advice</li>
            </ul>
          </div>
        </article>

        <aside className="hotline-aside" aria-label="What the coach helps with">
          <h2>Designed for depth</h2>
          <ul>
            <li>Structured prompts so you never start from a blank page.</li>
            <li>Feedback tuned to role seniority and industry norms.</li>
            <li>Follow-up plans that feel human, not robotic.</li>
            <li>Same brand experience as your application packs.</li>
          </ul>
        </aside>
      </div>
    </div>
  )
}
