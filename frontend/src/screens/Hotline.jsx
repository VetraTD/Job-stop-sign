import { useEffect, useState } from 'react'

const PHONE_SUBTITLES = [
  'HD audio · Private session',
  'STAR stories, sharpened fast',
  'Salary talk without the awkward',
  'Follow-ups that sound human',
  'Job post → your talk track',
  'Behavioral + technical mock runs',
  'CV gaps → a clear narrative',
  'Thank-you notes that actually land',
]

function pad2(n) {
  return String(n).padStart(2, '0')
}

function HotlinePhone() {
  const [now, setNow] = useState(() => new Date())
  const [subtitleIx, setSubtitleIx] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return undefined
    const id = window.setInterval(
      () => setSubtitleIx((i) => (i + 1) % PHONE_SUBTITLES.length),
      3800,
    )
    return () => window.clearInterval(id)
  }, [])

  const timeStr = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`

  return (
    <div className="hotline-phone-wrap">
      <div className="hotline-phone" aria-hidden="true">
        <div className="hotline-phone__side hotline-phone__side--mute" />
        <div className="hotline-phone__side hotline-phone__side--vol" />
        <div className="hotline-phone__body">
          <div className="hotline-phone__inner">
            <div className="hotline-phone__island" />
            <div className="hotline-phone__screen">
              <div className="hotline-phone__scanlines" />
              <div className="hotline-phone__sheen" />
              <div className="hotline-phone__glow" />
              <div className="hotline-phone__statusbar">
                <time className="hotline-phone__time" dateTime={now.toISOString()}>
                  {timeStr}
                </time>
                <div className="hotline-phone__statusbar-mid" aria-hidden>
                  <span className="hotline-phone__carrier">Coach</span>
                </div>
                <div className="hotline-phone__status-icons" aria-hidden>
                  <span className="hotline-phone__signal">
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className="hotline-phone__battery">
                    <span className="hotline-phone__battery-level" />
                  </span>
                </div>
              </div>
              <div className="hotline-phone__call">
                <div className="hotline-phone__avatar-wrap">
                  <div className="hotline-phone__avatar-ring" />
                  <div className="hotline-phone__avatar">AI</div>
                </div>
                <p className="hotline-phone__incoming">Incoming voice line</p>
                <p className="hotline-phone__name">Career Coach</p>
                <div className="hotline-phone__subtitle-slot">
                  <p
                    key={subtitleIx}
                    className="hotline-phone__subtitle"
                  >
                    {PHONE_SUBTITLES[subtitleIx]}
                  </p>
                </div>
                <div className="hotline-phone__chips">
                  <span>Interview prep</span>
                  <span>CV polish</span>
                </div>
                <div className="hotline-phone__cta-row">
                  <span className="hotline-phone__cta-hint">Tap number on card to call</span>
                </div>
              </div>
              <div className="hotline-phone__home-bar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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

        <HotlinePhone />
      </div>
    </div>
  )
}
