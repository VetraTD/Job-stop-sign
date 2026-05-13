import { useEffect, useState } from 'react'
import './WorkspaceSidebar.css'

function pad2(n) {
  return String(n).padStart(2, '0')
}

function TimeRow({ value }) {
  const chars = value.split('')
  return (
    <div className="sidebar-clock__row" aria-hidden>
      {chars.map((ch, i) => {
        if (ch === ':') {
          return (
            <span key={`c-${i}`} className="sidebar-clock__sep">
              <span className="sidebar-clock__colon">:</span>
            </span>
          )
        }
        const slot = value.slice(0, i).replace(/:/g, '').length
        return (
          <span key={`d-${slot}-${ch}`} className="sidebar-clock__tile">
            {ch}
          </span>
        )
      })}
    </div>
  )
}

export function SidebarClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const timeStr = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`
  const dateLine = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(now)
  const datePretty = dateLine.replace(/^([^,]+),\s*/, '$1 | ')

  return (
    <section className="sidebar-clock" aria-label="Current time">
      <div className="sidebar-clock__inner">
        <div className="sidebar-clock__sheen" aria-hidden />
        <div className="sidebar-clock__topbar">
          <span className="sidebar-clock__hint">Local time</span>
        </div>
        <time dateTime={now.toISOString()} className="sidebar-clock__time">
          <span className="sidebar-clock__sr">{timeStr}</span>
          <TimeRow value={timeStr} />
        </time>
        <p className="sidebar-clock__date">{datePretty}</p>
      </div>
    </section>
  )
}

const JOB_LINKS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/jobs/',
    hint: 'www.linkedin.com',
  },
  {
    label: 'Indeed',
    href: 'https://www.indeed.com/',
    hint: 'Indeed Job Search | Indeed',
  },
  {
    label: 'Monster',
    href: 'https://www.monster.com/',
    hint: 'www.monster.com',
  },
]

function LinkGlyph() {
  return (
    <svg
      className="sidebar-jobsearch__glyph"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function DocIcon() {
  return (
    <svg
      className="sidebar-jobsearch__doc"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  )
}

const PORTFOLIO_LINKS = [
  {
    label: 'Behance',
    href: 'https://www.behance.net/',
    hint: 'www.behance.net',
  },
  {
    label: 'Dribbble',
    href: 'https://dribbble.com/',
    hint: 'dribbble.com',
  },
  {
    label: 'Adobe Portfolio',
    href: 'https://portfolio.adobe.com/',
    hint: 'portfolio.adobe.com',
  },
]

export function JobSearchPanel() {
  return (
    <section className="sidebar-jobsearch" aria-label="Job search sites">
      <div className="sidebar-jobsearch__head">
        <DocIcon />
        <h2 className="sidebar-jobsearch__title">Job Search</h2>
      </div>
      <ul className="sidebar-jobsearch__list">
        {JOB_LINKS.map((item) => (
          <li key={item.href}>
            <a
              className="sidebar-jobsearch__link"
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkGlyph />
              <span className="sidebar-jobsearch__link-text">
                <span className="sidebar-jobsearch__name">{item.label}</span>
                <span className="sidebar-jobsearch__hint">{item.hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function PortfolioWebsitesPanel() {
  return (
    <section
      className="sidebar-jobsearch"
      aria-label="Portfolio website resources"
    >
      <div className="sidebar-jobsearch__head">
        <DocIcon />
        <h2 className="sidebar-jobsearch__title">Portfolios websites</h2>
      </div>
      <ul className="sidebar-jobsearch__list">
        {PORTFOLIO_LINKS.map((item) => (
          <li key={item.href}>
            <a
              className="sidebar-jobsearch__link"
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkGlyph />
              <span className="sidebar-jobsearch__link-text">
                <span className="sidebar-jobsearch__name">{item.label}</span>
                <span className="sidebar-jobsearch__hint">{item.hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function WorkspaceSidebar() {
  return (
    <aside className="workspace-sidebar" aria-label="Workspace">
      <SidebarClock />
      <JobSearchPanel />
      <PortfolioWebsitesPanel />
    </aside>
  )
}
