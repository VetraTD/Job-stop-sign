/** Whole local calendar days from `iso` (date of that instant) to today. */
export function daysSince(iso) {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 0
  const start = new Date(t)
  const now = new Date()
  const startUtc = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  )
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.floor((nowUtc - startUtc) / 86400000)
  return Math.max(0, diff)
}

/** Latest activity timestamp from updates and communications. */
export function getLastActivityIso(app) {
  const updated = new Date(app.updatedAt || app.createdAt).getTime()
  const comm = app.lastCommunicationDate
    ? new Date(app.lastCommunicationDate).getTime()
    : 0
  const t = Math.max(updated, comm)
  return new Date(t).toISOString()
}

/** Tuned like a simple CRM: quiet nudges + long-applied “no answer”. */
export const HEALTH_THRESHOLDS = {
  savedQuietDays: 3,
  appliedStaleDays: 30,
  appliedNoAnswerDays: 60,
  interviewQuietDays: 5,
}

/**
 * @returns {'Apply soon' | 'Stale' | 'No answer' | 'Follow up' | 'Closed' | 'Active'}
 */
export function getApplicationHealth(app) {
  if (app.status === 'rejected' || app.status === 'offer') {
    return 'Closed'
  }

  const last = getLastActivityIso(app)
  const quietDays = daysSince(last)

  const appliedAt = app.applicationDate || app.createdAt
  const daysSinceApplied = daysSince(appliedAt)

  if (app.status === 'saved' && quietDays >= HEALTH_THRESHOLDS.savedQuietDays) {
    return 'Apply soon'
  }

  if (app.status === 'applied') {
    if (daysSinceApplied >= HEALTH_THRESHOLDS.appliedNoAnswerDays) {
      return 'No answer'
    }
    if (quietDays >= HEALTH_THRESHOLDS.appliedStaleDays) {
      return 'Stale'
    }
  }

  if (
    app.status === 'interview' &&
    quietDays >= HEALTH_THRESHOLDS.interviewQuietDays
  ) {
    return 'Follow up'
  }

  return 'Active'
}

export function normalizeTrackerApp(app) {
  return {
    ...app,
    jobUrl: app.jobUrl ?? '',
    location: app.location ?? '—',
    linkSource: app.linkSource ?? '—',
    applicationDate: app.applicationDate ?? app.createdAt,
    lastCommunicationDate: app.lastCommunicationDate ?? null,
    notes: app.notes ?? '',
    updatedAt: app.updatedAt ?? app.createdAt,
  }
}
