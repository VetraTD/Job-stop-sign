import { useMemo, useState } from 'react'
import { useClockTick } from '../hooks/useClockTick'
import {
  daysSince,
  getApplicationHealth,
  getLastActivityIso,
  normalizeTrackerApp,
} from '../utils/applicationHealth'
import './Tracker.css'

const STATUS_ORDER = [
  'saved',
  'applied',
  'interview',
  'offer',
  'rejected',
]

const STATUS_LABEL = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  rejected: 'Rejected',
  offer: 'Offer',
}

const HEALTH_CLASS = {
  Active: 'tracker-health--active',
  'Apply soon': 'tracker-health--apply-soon',
  Stale: 'tracker-health--stale',
  'No answer': 'tracker-health--no-answer',
  'Follow up': 'tracker-health--follow-up',
  Closed: 'tracker-health--closed',
}

function formatDaysAgo(iso) {
  const d = daysSince(iso)
  if (d <= 0) return 'Today'
  if (d === 1) return '1 day ago'
  return `${d} days ago`
}

function formatDateMedium(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
    }).format(new Date(iso))
  } catch {
    return '—'
  }
}

function shortUrl(url) {
  if (!url || !url.trim()) return '—'
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url.slice(0, 28) + (url.length > 28 ? '…' : '')
  }
}

function locationPillClass(loc) {
  const s = (loc || '').toLowerCase()
  if (s.includes('remote')) return 'tracker-pill--loc-remote'
  if (s.includes('hybrid')) return 'tracker-pill--loc-hybrid'
  if (s.includes('on-site') || s.includes('onsite')) return 'tracker-pill--loc-onsite'
  return 'tracker-pill--loc-default'
}

function sourcePillClass(src) {
  const s = (src || '').toLowerCase()
  if (s.includes('linkedin')) return 'tracker-pill--src-linkedin'
  if (s.includes('indeed')) return 'tracker-pill--src-indeed'
  if (s.includes('company') || s.includes('site')) return 'tracker-pill--src-company'
  if (s.includes('referral')) return 'tracker-pill--src-referral'
  return 'tracker-pill--src-default'
}

function statusPillClass(status) {
  return `tracker-pill--status-${status}`
}

/** Local calendar YYYY-MM-DD for an ISO timestamp. */
function localDateKey(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function buildCalendarCells(year, monthIndex) {
  const firstDow = new Date(year, monthIndex, 1).getDay()
  const dim = new Date(year, monthIndex + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDow; i += 1) cells.push({ kind: 'pad', key: `p-${i}` })
  for (let d = 1; d <= dim; d += 1) cells.push({ kind: 'day', d, key: `d-${d}` })
  while (cells.length % 7 !== 0) {
    cells.push({ kind: 'pad', key: `e-${cells.length}` })
  }
  return cells
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfMonthFromDate(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function Tracker({ applications, onViewPack }) {
  const [view, setView] = useState('table')
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonthFromDate(new Date()),
  )
  const dayTick = useClockTick(60_000)

  const normalized = useMemo(
    () => applications.map(normalizeTrackerApp),
    [applications],
  )

  const withHealth = useMemo(() => {
    void dayTick
    return normalized.map((app) => ({
      ...app,
      health: getApplicationHealth(app),
    }))
  }, [normalized, dayTick])

  const sorted = useMemo(
    () =>
      [...withHealth].sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime(),
      ),
    [withHealth],
  )

  const summary = useMemo(() => {
    const needsAction = withHealth.filter((a) =>
      ['Apply soon', 'Stale', 'No answer', 'Follow up'].includes(a.health),
    ).length
    const noAnswer = withHealth.filter((a) => a.health === 'No answer').length
    const stale = withHealth.filter((a) => a.health === 'Stale').length
    const followUpSoon = withHealth.filter(
      (a) => a.health === 'Follow up',
    ).length
    const interviews = withHealth.filter((a) => a.status === 'interview').length
    const offers = withHealth.filter((a) => a.status === 'offer').length
    return {
      needsAction,
      noAnswer,
      stale,
      followUpSoon,
      interviews,
      offers,
    }
  }, [withHealth])

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    items: withHealth.filter((a) => a.status === status),
  }))

  const appsByLocalDate = useMemo(() => {
    const map = new Map()
    const add = (app, iso) => {
      const k = localDateKey(iso)
      if (!k) return
      const arr = map.get(k) ?? []
      if (!arr.some((x) => x.id === app.id)) arr.push(app)
      map.set(k, arr)
    }
    for (const app of withHealth) {
      add(app, app.applicationDate)
      if (app.lastCommunicationDate) add(app, app.lastCommunicationDate)
    }
    return map
  }, [withHealth])

  const calYear = calendarMonth.getFullYear()
  const calMonth = calendarMonth.getMonth()
  const calendarCells = useMemo(
    () => buildCalendarCells(calYear, calMonth),
    [calYear, calMonth],
  )
  const calendarTitle = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: 'long',
        year: 'numeric',
      }).format(new Date(calYear, calMonth, 1)),
    [calYear, calMonth],
  )

  const goCalendarMonth = (delta) => {
    setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  const today = new Date()
  const isTodayInGrid = (day) =>
    day === today.getDate() &&
    calMonth === today.getMonth() &&
    calYear === today.getFullYear()

  const dayKey = (day) =>
    `${calYear}-${pad2(calMonth + 1)}-${pad2(day)}`

  return (
    <div className="page tracker-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Tracker</h1>
          <p className="page-subtitle">
            Health updates automatically:{' '}
            <strong>No answer</strong> after 60 days in Applied,{' '}
            <strong>Stale</strong> after 30 days without activity, plus saved /
            interview nudges.
          </p>
        </div>
      </div>

      <div className="tracker-summary" aria-label="Pipeline summary">
        <div className="tracker-summary-card">
          <span className="tracker-summary-card__value">
            {summary.needsAction}
          </span>
          <span className="tracker-summary-card__label">Needs action</span>
        </div>
        <div className="tracker-summary-card">
          <span className="tracker-summary-card__value">
            {summary.noAnswer}
          </span>
          <span className="tracker-summary-card__label">No answer</span>
        </div>
        <div className="tracker-summary-card">
          <span className="tracker-summary-card__value">{summary.stale}</span>
          <span className="tracker-summary-card__label">Stale</span>
        </div>
        <div className="tracker-summary-card">
          <span className="tracker-summary-card__value">
            {summary.followUpSoon}
          </span>
          <span className="tracker-summary-card__label">Follow-up soon</span>
        </div>
        <div className="tracker-summary-card">
          <span className="tracker-summary-card__value">
            {summary.interviews}
          </span>
          <span className="tracker-summary-card__label">Interviews</span>
        </div>
        <div className="tracker-summary-card">
          <span className="tracker-summary-card__value">{summary.offers}</span>
          <span className="tracker-summary-card__label">Offers</span>
        </div>
      </div>

      <section className="tracker-db" aria-label="Applications database">
        <div className="tracker-db-toolbar">
          <h2 className="tracker-db-title">Applications</h2>
          <div className="tracker-db-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={view === 'table'}
              className={`tracker-db-tab${view === 'table' ? ' is-active' : ''}`}
              onClick={() => setView('table')}
            >
              All
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'board'}
              className={`tracker-db-tab${view === 'board' ? ' is-active' : ''}`}
              onClick={() => setView('board')}
            >
              By stage
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === 'calendar'}
              className={`tracker-db-tab${view === 'calendar' ? ' is-active' : ''}`}
              onClick={() => setView('calendar')}
            >
              Calendar
            </button>
          </div>
        </div>

        {view === 'table' ? (
          <div className="tracker-table-scroll">
            <table className="tracker-table">
              <thead>
                <tr>
                  <th className="tracker-th">Job position</th>
                  <th className="tracker-th">Company</th>
                  <th className="tracker-th">URL</th>
                  <th className="tracker-th">Location</th>
                  <th className="tracker-th">Source</th>
                  <th className="tracker-th">Status</th>
                  <th className="tracker-th">Health</th>
                  <th className="tracker-th">Applied</th>
                  <th className="tracker-th">Last activity</th>
                  <th className="tracker-th tracker-th--actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="tracker-td tracker-td--empty">
                      No applications yet. Add one from New application.
                    </td>
                  </tr>
                ) : (
                  sorted.map((app) => {
                    const lastIso = getLastActivityIso(app)
                    const hasUrl = Boolean(
                      app.jobUrl && app.jobUrl.trim().length > 0,
                    )
                    return (
                      <tr key={app.id} className="tracker-tr">
                        <td className="tracker-td">
                          <button
                            type="button"
                            className="tracker-job-link"
                            onClick={() => onViewPack(app.id)}
                          >
                            {app.jobTitle}
                          </button>
                        </td>
                        <td className="tracker-td tracker-td--muted">
                          {app.company}
                        </td>
                        <td className="tracker-td">
                          {hasUrl ? (
                            <a
                              className="tracker-url-link"
                              href={app.jobUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {shortUrl(app.jobUrl)}
                            </a>
                          ) : (
                            <span className="tracker-td--faint">—</span>
                          )}
                        </td>
                        <td className="tracker-td">
                          <span
                            className={`tracker-pill ${locationPillClass(app.location)}`}
                          >
                            {app.location}
                          </span>
                        </td>
                        <td className="tracker-td">
                          <span
                            className={`tracker-pill ${sourcePillClass(app.linkSource)}`}
                          >
                            {app.linkSource}
                          </span>
                        </td>
                        <td className="tracker-td">
                          <span
                            className={`tracker-pill ${statusPillClass(app.status)}`}
                          >
                            {STATUS_LABEL[app.status]}
                          </span>
                        </td>
                        <td className="tracker-td">
                          <span
                            className={`tracker-pill ${HEALTH_CLASS[app.health] || HEALTH_CLASS.Active}`}
                          >
                            {app.health}
                          </span>
                        </td>
                        <td className="tracker-td tracker-td--muted">
                          {formatDateMedium(app.applicationDate)}
                        </td>
                        <td className="tracker-td tracker-td--muted">
                          {formatDaysAgo(lastIso)}
                        </td>
                        <td className="tracker-td tracker-td--actions">
                          <div className="tracker-inline-actions">
                            <button
                              type="button"
                              className="tracker-link-btn"
                              onClick={() => onViewPack(app.id)}
                            >
                              Pack
                            </button>
                            {hasUrl ? (
                              <a
                                className="tracker-link-btn"
                                href={app.jobUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Job
                              </a>
                            ) : (
                              <span className="tracker-link-btn is-disabled">
                                Job
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : view === 'board' ? (
          <div className="tracker-columns tracker-columns--notion">
            {grouped.map((col) => (
              <section key={col.status} className="tracker-column">
                <header className="tracker-column-head">
                  <h3 className="tracker-title">{col.label}</h3>
                  <span className="tracker-count">{col.items.length}</span>
                </header>
                <ul className="tracker-list">
                  {col.items.length === 0 ? (
                    <li className="tracker-empty">No applications</li>
                  ) : (
                    col.items.map((app) => {
                      const lastIso = getLastActivityIso(app)
                      const hasUrl = Boolean(
                        app.jobUrl && app.jobUrl.trim().length > 0,
                      )
                      return (
                        <li key={app.id}>
                          <div className="tracker-app-card">
                            <div className="tracker-app-card__row">
                              <button
                                type="button"
                                className="tracker-app-card__title-btn"
                                onClick={() => onViewPack(app.id)}
                              >
                                {app.jobTitle}
                              </button>
                              <span
                                className={`tracker-pill tracker-pill--sm ${statusPillClass(app.status)}`}
                              >
                                {STATUS_LABEL[app.status]}
                              </span>
                            </div>
                            <p className="tracker-app-card__co">{app.company}</p>
                            <div className="tracker-app-card__pills">
                              <span
                                className={`tracker-pill tracker-pill--sm ${locationPillClass(app.location)}`}
                              >
                                {app.location}
                              </span>
                              <span
                                className={`tracker-pill tracker-pill--sm ${sourcePillClass(app.linkSource)}`}
                              >
                                {app.linkSource}
                              </span>
                              <span
                                className={`tracker-pill tracker-pill--sm ${HEALTH_CLASS[app.health] || HEALTH_CLASS.Active}`}
                              >
                                {app.health}
                              </span>
                            </div>
                            <p className="tracker-app-card__meta">
                              Last activity · {formatDaysAgo(lastIso)}
                            </p>
                            <div className="tracker-app-actions">
                              <button
                                type="button"
                                className="tracker-btn tracker-btn--primary"
                                onClick={() => onViewPack(app.id)}
                              >
                                View pack
                              </button>
                              {hasUrl ? (
                                <a
                                  className="tracker-btn"
                                  href={app.jobUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Open job
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  className="tracker-btn"
                                  disabled
                                  title="No job URL on file"
                                >
                                  Open job
                                </button>
                              )}
                            </div>
                          </div>
                        </li>
                      )
                    })
                  )}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="tracker-calendar" aria-label="Application calendar">
            <div className="tracker-calendar-toolbar">
              <div className="tracker-calendar-nav">
                <button
                  type="button"
                  className="tracker-calendar-nav-btn"
                  aria-label="Previous month"
                  onClick={() => goCalendarMonth(-1)}
                >
                  ‹
                </button>
                <h3 className="tracker-calendar-title">{calendarTitle}</h3>
                <button
                  type="button"
                  className="tracker-calendar-nav-btn"
                  aria-label="Next month"
                  onClick={() => goCalendarMonth(1)}
                >
                  ›
                </button>
              </div>
              <button
                type="button"
                className="tracker-calendar-today-btn"
                onClick={() => setCalendarMonth(startOfMonthFromDate(new Date()))}
              >
                Today
              </button>
            </div>
            <p className="tracker-calendar-hint">
              Applications appear on <strong>application date</strong> and{' '}
              <strong>last contact</strong> (your local calendar). Click an
              entry to open the pack.
            </p>
            <div className="tracker-calendar-weekdays" role="row">
              {WEEKDAYS.map((w) => (
                <div key={w} className="tracker-calendar-weekday" role="columnheader">
                  {w}
                </div>
              ))}
            </div>
            <div className="tracker-calendar-grid" role="grid">
              {calendarCells.map((cell) =>
                cell.kind === 'pad' ? (
                  <div
                    key={cell.key}
                    className="tracker-calendar-cell tracker-calendar-cell--pad"
                    aria-hidden
                  />
                ) : (
                  <div
                    key={cell.key}
                    className={`tracker-calendar-cell tracker-calendar-cell--day${isTodayInGrid(cell.d) ? ' is-today' : ''}`}
                    role="gridcell"
                    aria-label={`${calendarTitle} ${cell.d}`}
                  >
                    <span className="tracker-calendar-daynum">{cell.d}</span>
                    <div className="tracker-calendar-events">
                      {(appsByLocalDate.get(dayKey(cell.d)) ?? []).map(
                        (app) => (
                          <button
                            key={app.id}
                            type="button"
                            className="tracker-calendar-event"
                            onClick={() => onViewPack(app.id)}
                            title={`${app.jobTitle} · ${app.company}`}
                          >
                            <span className="tracker-calendar-event-title">
                              {app.jobTitle}
                            </span>
                            <span className="tracker-calendar-event-co">
                              {app.company}
                            </span>
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
