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

        <div className="hotline-phone-wrap">
          <div className="hotline-phone" aria-hidden="true">
            <div className="hotline-phone__side hotline-phone__side--mute" />
            <div className="hotline-phone__side hotline-phone__side--vol" />
            <div className="hotline-phone__body">
              <div className="hotline-phone__inner">
                <div className="hotline-phone__island" />
                <div className="hotline-phone__screen">
                  <div className="hotline-phone__glow" />
                  <div className="hotline-phone__ui">
                    <span className="hotline-phone__label">Career Coach</span>
                    <span className="hotline-phone__sub">Voice session</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
