import { useMemo, useState } from 'react'
import {
  daysSince,
  getApplicationHealth,
  getLastActivityIso,
  normalizeTrackerApp,
} from '../utils/applicationHealth'
import './Dashboard.css'

const STATUS_LABEL = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  rejected: 'Rejected',
  offer: 'Offer',
}

const PACK_PREVIEW = 'Cover letter · CV notes · Interview prep'

const HEALTH_CLASS = {
  Active: 'dash-health--active',
  'Apply soon': 'dash-health--apply-soon',
  Stale: 'dash-health--stale',
  'No answer': 'dash-health--no-answer',
  'Follow up': 'dash-health--follow-up',
  Closed: 'dash-health--closed',
}

function formatShortDate(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
    }).format(new Date(iso))
  } catch {
    return '—'
  }
}

function buildHeroSubtitle(summary, withHealth) {
  const need = summary.needsAction
  const intN = summary.interviews
  const savedPacks = withHealth.filter((a) => a.status === 'saved').length
  const parts = []
  if (need > 0) {
    parts.push(
      `${need} application${need === 1 ? '' : 's'} need attention`,
    )
  }
  if (intN > 0) {
    parts.push(`${intN} interview${intN === 1 ? '' : 's'} to prep`)
  }
  if (savedPacks > 0) {
    parts.push(
      `${savedPacks} saved pack${savedPacks === 1 ? '' : 's'} ready to send`,
    )
  }
  if (parts.length === 0) {
    return 'Add an application to generate your first pack — then manage attention and status from here.'
  }
  return parts.join(' · ')
}

function priorityReason(app) {
  if (app.status === 'interview') {
    return 'Interview stage — prep questions and stories'
  }
  if (app.health === 'Follow up') {
    return 'Follow-up soon — re-engage the thread'
  }
  if (app.status === 'saved') {
    if (app.health === 'Apply soon') {
      return 'Saved pack ready to send'
    }
    return 'Saved pack — finish and send'
  }
  if (app.health === 'No answer') {
    return 'No answer after 60 days'
  }
  if (app.health === 'Stale') {
    return 'Stale — no activity in 30+ days'
  }
  if (app.status === 'applied' && app.health === 'Active') {
    return 'In flight — check for updates'
  }
  return 'Needs a quick check-in'
}

/** Lower score sorts first. null = not shown in Today’s focus. */
function priorityEntry(app) {
  if (app.status === 'rejected') return null
  if (app.status === 'offer') return null
  const h = app.health
  let score
  if (app.status === 'interview') score = 0
  else if (h === 'Follow up') score = 1
  else if (app.status === 'saved') score = 2
  else if (h === 'No answer') score = 3
  else if (h === 'Stale') score = 4
  else if (app.status === 'applied' && h === 'Active') score = 10
  else return null
  const last = getLastActivityIso(app)
  const quiet = daysSince(last)
  return {
    app,
    score,
    reason: priorityReason(app),
    tie: -quiet,
    updated: new Date(app.updatedAt || app.createdAt).getTime(),
  }
}

function packMatchesPipelineFilter(app, filter) {
  if (!filter) return true
  switch (filter) {
    case 'needsAction':
      return ['Apply soon', 'Stale', 'No answer', 'Follow up'].includes(
        app.health,
      )
    case 'followUpSoon':
      return app.health === 'Follow up'
    case 'noAnswer':
      return app.health === 'No answer'
    case 'stale':
      return app.health === 'Stale'
    case 'interviews':
      return app.status === 'interview'
    case 'offers':
      return app.status === 'offer'
    default:
      return true
  }
}

export function Dashboard({
  applications,
  onNewApplication,
  onOpenApplication,
  onTracker,
  onHotline,
}) {
  const [pipelineFilter, setPipelineFilter] = useState(null)

  const normalized = useMemo(
    () => applications.map(normalizeTrackerApp),
    [applications],
  )

  const withHealth = useMemo(
    () =>
      normalized.map((app) => ({
        ...app,
        health: getApplicationHealth(app),
      })),
    [normalized],
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

  const heroSubtitle = useMemo(
    () => buildHeroSubtitle(summary, withHealth),
    [summary, withHealth],
  )

  const todaysFocus = useMemo(() => {
    const entries = []
    for (const app of withHealth) {
      const e = priorityEntry(app)
      if (e) entries.push(e)
    }
    entries.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score
      if (a.tie !== b.tie) return a.tie - b.tie
      return b.updated - a.updated
    })
    return entries.slice(0, 4).map((e) => e.app)
  }, [withHealth])

  const applicationPacks = useMemo(() => {
    const sorted = [...withHealth].sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    )
    return sorted.filter((app) => packMatchesPipelineFilter(app, pipelineFilter))
  }, [withHealth, pipelineFilter])

  const openJob = (url) => {
    if (!url || !url.trim()) return
    const href = url.startsWith('http') ? url : `https://${url}`
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  const pipelineKeys = [
    { id: 'needsAction', label: 'Needs action', value: summary.needsAction },
    { id: 'followUpSoon', label: 'Follow-up soon', value: summary.followUpSoon },
    { id: 'noAnswer', label: 'No answer', value: summary.noAnswer },
    { id: 'stale', label: 'Stale', value: summary.stale },
    { id: 'interviews', label: 'Interviews', value: summary.interviews },
    { id: 'offers', label: 'Offers', value: summary.offers },
  ]

  return (
    <div className="page dashboard-page">
      <header className="dashboard-hero">
        <div className="dashboard-hero-text">
          <h1 className="page-title">Job search dashboard</h1>
          <p className="page-subtitle dashboard-hero-subtitle">{heroSubtitle}</p>
        </div>
        <div className="dashboard-hero-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNewApplication}
          >
            New application
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        <div className="dashboard-main">
          <section
            className="dash-section"
            aria-labelledby="dash-focus-title"
          >
            <header className="dash-section-head">
              <h2 id="dash-focus-title" className="dash-section-title">
                {"Today's focus"}
              </h2>
              <p className="dash-section-lead">
                Highest-impact items — tap a row to open the pack (posting link
                lives in Application packs below).
              </p>
            </header>
            <div className="dash-focus-list">
              {todaysFocus.length === 0 ? (
                <p className="dash-empty">
                  Nothing urgent in the pipeline. When you add roles or packs,
                  the highest-impact items will surface here.
                </p>
              ) : (
                todaysFocus.map((app) => {
                  const healthClass =
                    HEALTH_CLASS[app.health] || HEALTH_CLASS.Active
                  return (
                    <button
                      key={app.id}
                      type="button"
                      className="dash-focus-card"
                      onClick={() => onOpenApplication(app.id)}
                    >
                      <div className="dash-focus-top">
                        <div className="dash-focus-main">
                          <div className="dash-focus-role">{app.jobTitle}</div>
                          <p className="dash-focus-co">{app.company}</p>
                        </div>
                        <div className="dash-focus-badges">
                          <span className={`badge badge-${app.status}`}>
                            {STATUS_LABEL[app.status]}
                          </span>
                          <span className={`dash-health ${healthClass}`}>
                            {app.health}
                          </span>
                        </div>
                      </div>
                      <p className="dash-focus-reason">{priorityReason(app)}</p>
                      <span className="dash-focus-cta">Open pack →</span>
                    </button>
                  )
                })
              )}
            </div>
          </section>

          <section
            className="dash-section"
            aria-labelledby="dash-packs-title"
          >
            <header className="dash-section-head dash-section-head--row">
              <div>
                <h2 id="dash-packs-title" className="dash-section-title">
                  Application packs
                </h2>
                <p className="dash-section-lead">
                  Every role you run through the generator gets a pack — open it
                  here or jump to the tracker for status changes.
                </p>
              </div>
              {pipelineFilter ? (
                <button
                  type="button"
                  className="dash-clear-filter"
                  onClick={() => setPipelineFilter(null)}
                >
                  Clear filter
                </button>
              ) : null}
            </header>
            {applicationPacks.length === 0 ? (
              <p className="dash-empty dash-empty--pad">
                No packs match this filter.{' '}
                <button
                  type="button"
                  className="dash-inline-link"
                  onClick={() => setPipelineFilter(null)}
                >
                  Clear filter
                </button>{' '}
                or add a new application.
              </p>
            ) : (
              <ul className="dash-pack-list">
                {applicationPacks.map((app) => {
                  const hasUrl = Boolean(app.jobUrl && app.jobUrl.trim())
                  const healthClass =
                    HEALTH_CLASS[app.health] || HEALTH_CLASS.Active
                  return (
                    <li key={app.id}>
                      <article className="dash-pack-card">
                        <div className="dash-pack-top">
                          <div className="dash-pack-main">
                            <h3 className="dash-pack-role">{app.jobTitle}</h3>
                            <p className="dash-pack-co">{app.company}</p>
                            <p className="dash-pack-meta">
                              Created {formatShortDate(app.createdAt)}
                            </p>
                          </div>
                          <div className="dash-pack-badges">
                            <span className={`badge badge-${app.status}`}>
                              {STATUS_LABEL[app.status]}
                            </span>
                            <span className={`dash-health ${healthClass}`}>
                              {app.health}
                            </span>
                          </div>
                        </div>
                        <p className="dash-pack-preview">{PACK_PREVIEW}</p>
                        <div className="dash-pack-actions">
                          <button
                            type="button"
                            className="dash-btn dash-btn--primary"
                            onClick={() => onOpenApplication(app.id)}
                          >
                            View pack
                          </button>
                          {hasUrl ? (
                            <button
                              type="button"
                              className="dash-btn dash-btn--ghost"
                              onClick={() => openJob(app.jobUrl)}
                            >
                              Open job
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="dash-btn dash-btn--ghost"
                            onClick={onTracker}
                          >
                            Update in tracker
                          </button>
                        </div>
                      </article>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section
            className="dash-section dash-section--flush"
            aria-labelledby="dash-pipeline-title"
          >
            <header className="dash-section-head">
              <h2 id="dash-pipeline-title" className="dash-section-title">
                Pipeline health
              </h2>
              <p className="dash-section-lead">
                Tap a metric to filter the Application packs list. Counts match
                your tracker rules.
              </p>
            </header>
            <div className="dash-pipeline-strip">
              {pipelineKeys.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className={`dash-pipeline-card${
                    pipelineFilter === row.id ? ' is-active' : ''
                  }`}
                  aria-pressed={pipelineFilter === row.id}
                  onClick={() =>
                    setPipelineFilter((f) => (f === row.id ? null : row.id))
                  }
                >
                  <span className="dash-pipeline-value">{row.value}</span>
                  <span className="dash-pipeline-label">{row.label}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="dashboard-aside" aria-label="Where to go next">
          <section className="dash-aside-card">
            <h2 className="dash-aside-title">Tracker</h2>
            <p className="dash-aside-text">
              Table, calendar, and status changes — the detailed view for every
              application.
            </p>
            <button
              type="button"
              className="dash-aside-btn dash-aside-btn--emphasis"
              onClick={onTracker}
            >
              Open tracker
            </button>
          </section>

          {onHotline ? (
            <section className="dash-aside-card dash-aside-card--accent">
              <h2 className="dash-aside-title">AI Career Coach</h2>
              <p className="dash-aside-text">
                Practise interviews, tighten your CV, or plan a follow-up.
              </p>
              <button
                type="button"
                className="dash-aside-btn dash-aside-btn--emphasis"
                onClick={onHotline}
              >
                Open AI Career Coach
              </button>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
