const STATUS_LABEL = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  rejected: 'Rejected',
  offer: 'Offer',
}

function countBy(applications, status) {
  return applications.filter((a) => a.status === status).length
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

export function Dashboard({
  applications,
  onNewApplication,
  onOpenApplication,
  onTracker,
  onHotline,
}) {
  const total = applications.length
  const stats = [
    { key: 'total', label: 'Total', value: total },
    { key: 'saved', label: 'Saved', value: countBy(applications, 'saved') },
    {
      key: 'applied',
      label: 'Applied',
      value: countBy(applications, 'applied'),
    },
    {
      key: 'interview',
      label: 'Interview',
      value: countBy(applications, 'interview'),
    },
    {
      key: 'rejected',
      label: 'Rejected',
      value: countBy(applications, 'rejected'),
    },
    { key: 'offer', label: 'Offer', value: countBy(applications, 'offer') },
  ]

  const saved = countBy(applications, 'saved')
  const interview = countBy(applications, 'interview')
  const applied = countBy(applications, 'applied')

  const sorted = [...applications].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const recent = sorted.slice(0, 5)

  let insight =
    'Add roles from the New application flow to build your pipeline here.'
  if (total > 0) {
    const parts = []
    if (saved > 0) {
      parts.push(
        `${saved} saved draft${saved === 1 ? '' : 's'} ready to send or update`,
      )
    }
    if (interview > 0) {
      parts.push(
        `${interview} in interview—block time to prepare questions and stories`,
      )
    }
    if (applied > 0 && interview === 0) {
      parts.push(`${applied} applied; follow up where you have a warm contact`)
    }
    if (parts.length === 0) {
      parts.push('Review statuses weekly so nothing stalls without a decision.')
    }
    insight = parts.join(' · ')
  }

  return (
    <div className="page dashboard">
      <div className="page-head">
        <div>
          <h1 className="page-title">Job search dashboard</h1>
          <p className="page-subtitle">
            Track where each application sits and open packs when you are ready
            to send or prep.
          </p>
        </div>
        <div className="page-head-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onTracker}
          >
            Tracker
          </button>
          {onHotline ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onHotline}
            >
              AI Career Coach
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNewApplication}
          >
            New application
          </button>
        </div>
      </div>

      <p className="dashboard-insight" role="status">
        {insight}
      </p>

      <ul className="stat-grid" aria-label="Application stats">
        {stats.map((s) => (
          <li key={s.key} className="stat-card" data-stat={s.key}>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </li>
        ))}
      </ul>

      <section className="panel dashboard-panel" aria-labelledby="recent-title">
        <div className="panel-head">
          <h2 id="recent-title" className="panel-title">
            Recently updated
          </h2>
        </div>
        {recent.length === 0 ? (
          <p className="empty-hint">
            No applications yet. Create one to generate your first pack.
          </p>
        ) : (
          <ul className="app-list">
            {recent.map((app) => (
              <li key={app.id}>
                <button
                  type="button"
                  className="app-row"
                  onClick={() => onOpenApplication(app.id)}
                >
                  <div className="app-row-main">
                    <span className="app-title">{app.jobTitle}</span>
                    <span className="app-meta">{app.company}</span>
                  </div>
                  <span
                    className={`badge badge-${app.status}`}
                    title="Status"
                  >
                    {STATUS_LABEL[app.status]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="panel dashboard-panel dashboard-panel--table"
        aria-labelledby="all-apps-title"
      >
        <div className="panel-head">
          <h2 id="all-apps-title" className="panel-title">
            All applications
          </h2>
          <p className="panel-meta">{total} total</p>
        </div>
        {sorted.length === 0 ? (
          <p className="empty-hint">Your applications will appear in this list.</p>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">Role</th>
                  <th scope="col">Company</th>
                  <th scope="col">Status</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <button
                        type="button"
                        className="dash-table-link"
                        onClick={() => onOpenApplication(app.id)}
                      >
                        {app.jobTitle}
                      </button>
                    </td>
                    <td>{app.company}</td>
                    <td>
                      <span className={`badge badge-${app.status}`}>
                        {STATUS_LABEL[app.status]}
                      </span>
                    </td>
                    <td className="dash-table-muted">
                      {formatShortDate(app.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
