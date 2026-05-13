import { useCallback, useEffect, useRef, useState } from 'react'
import './ApplicationDetail.css'

const STATUS_LABEL = {
  saved: 'Saved',
  applied: 'Applied',
  interview: 'Interview',
  rejected: 'Rejected',
  offer: 'Offer',
}

function formatPackDate(iso) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function LetterDocument({ text }) {
  const blocks = text.trim().split(/\n\s*\n/)
  return (
    <div className="app-pack-letter">
      {blocks.map((block, i) => (
        <p key={i} className="app-pack-letter__p">
          {block.split('\n').map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 ? <br /> : null}
            </span>
          ))}
        </p>
      ))}
    </div>
  )
}

function parseFollowUp(text) {
  const trimmed = text.trim()
  const subjectMatch = trimmed.match(/^Subject:\s*(.+)$/im)
  if (!subjectMatch) {
    return { subject: null, body: trimmed }
  }
  const subject = subjectMatch[1].trim()
  const rest = trimmed.slice(subjectMatch[0].length).trim()
  return { subject, body: rest }
}

function useCopyFeedback() {
  const timer = useRef(null)
  const [copied, setCopied] = useState(null)

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
  }, [])

  const flash = useCallback(
    (id) => {
      clear()
      if (id === null || id === undefined) {
        setCopied(null)
        return
      }
      setCopied(id)
      timer.current = setTimeout(() => {
        setCopied(null)
        timer.current = null
      }, 2000)
    },
    [clear],
  )

  useEffect(() => () => clear(), [clear])

  const reset = useCallback(() => {
    clear()
    setCopied(null)
  }, [clear])

  return { copied, flash, reset }
}

export function ApplicationDetail({
  application,
  onGoToDashboard,
  onGoToHotline,
  onStatusChange,
}) {
  const { copied, flash, reset } = useCopyFeedback()

  const copyCover = useCallback(async () => {
    if (!application) return
    try {
      await navigator.clipboard.writeText(application.pack.coverLetter)
      flash('cover')
    } catch {
      reset()
    }
  }, [application, flash, reset])

  const copyFollowUp = useCallback(async () => {
    if (!application) return
    try {
      await navigator.clipboard.writeText(application.pack.followUpEmail)
      flash('follow')
    } catch {
      reset()
    }
  }, [application, flash, reset])

  if (!application) {
    return (
      <div className="page app-pack-page">
        <div className="app-pack-empty">
          <p className="app-pack-empty__text">Application not found.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onGoToDashboard}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  const { pack, company, jobTitle, status, createdAt } = application
  const statuses = ['saved', 'applied', 'interview', 'rejected', 'offer']
  const followUp = parseFollowUp(pack.followUpEmail)

  return (
    <div className="page app-pack-page">
      <header className="app-pack-hero">
        <h1 className="app-pack-hero__title">Application Pack</h1>
        <p className="app-pack-hero__role">{jobTitle}</p>
        <p className="app-pack-hero__company">{company}</p>
        <div className="app-pack-hero__meta">
          <label className="app-pack-hero__field">
            <span className="app-pack-hero__field-label">Status</span>
            <select
              className="input app-pack-select"
              value={status}
              onChange={(e) => onStatusChange(application.id, e.target.value)}
              aria-label="Application status"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <div className="app-pack-hero__field app-pack-hero__field--read">
            <span className="app-pack-hero__field-label">Created</span>
            <span className="app-pack-hero__field-value">
              {formatPackDate(createdAt)}
            </span>
          </div>
        </div>
      </header>

      <div className="app-pack-layout">
        <div className="app-pack-main">
          <section className="app-pack-section">
            <h2 className="app-pack-section__title">CV improvement notes</h2>
            <ul className="app-pack-list">
              {pack.cvImprovementNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </section>

          <section className="app-pack-section">
            <h2 className="app-pack-section__title">
              Tailored professional summary
            </h2>
            <p className="app-pack-prose">{pack.tailoredSummary}</p>
          </section>

          <section className="app-pack-section">
            <h2 className="app-pack-section__title">Cover letter</h2>
            <div className="app-pack-sheet app-pack-sheet--letter">
              <LetterDocument text={pack.coverLetter} />
            </div>
          </section>

          <section className="app-pack-section">
            <h2 className="app-pack-section__title">Strengths to mention</h2>
            <ul className="app-pack-list app-pack-list--checks">
              {pack.strengthsToMention.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </section>

          <section className="app-pack-section">
            <h2 className="app-pack-section__title">Interview questions</h2>
            <ol className="app-pack-ol">
              {pack.interviewQuestions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          </section>

          <section className="app-pack-section">
            <h2 className="app-pack-section__title">Follow-up email</h2>
            <div className="app-pack-sheet app-pack-sheet--email">
              {followUp.subject ? (
                <p className="app-pack-email-subject">
                  <span className="app-pack-email-subject__k">Subject</span>
                  <span className="app-pack-email-subject__v">
                    {followUp.subject}
                  </span>
                </p>
              ) : null}
              <LetterDocument text={followUp.body || pack.followUpEmail} />
            </div>
          </section>
        </div>

        <aside className="app-pack-aside" aria-label="Pack actions">
          <div className="app-pack-aside-card app-pack-aside-card--actions">
            <p className="app-pack-aside__label">Actions</p>
            <div className="app-pack-actions">
              <button
                type="button"
                className={`btn btn-secondary app-pack-action-btn${copied === 'cover' ? ' is-copied' : ''}`}
                onClick={copyCover}
              >
                {copied === 'cover' ? 'Copied' : 'Copy cover letter'}
              </button>
              <button
                type="button"
                className={`btn btn-secondary app-pack-action-btn${copied === 'follow' ? ' is-copied' : ''}`}
                onClick={copyFollowUp}
              >
                {copied === 'follow' ? 'Copied' : 'Copy follow-up email'}
              </button>
              <button
                type="button"
                className="btn btn-primary app-pack-action-btn"
                onClick={onGoToHotline}
              >
                Start mock interview
              </button>
              <button
                type="button"
                className="btn btn-ghost app-pack-action-btn"
                onClick={onGoToDashboard}
              >
                Back to dashboard
              </button>
            </div>
          </div>

          <div className="app-pack-aside-card app-pack-aside-card--coach">
            <p className="app-pack-aside__label app-pack-aside__label--accent">
              AI Career Coach
            </p>
            <p className="app-pack-coach__title">Talk it through</p>
            <p className="app-pack-coach__text">
              Use the hotline to rehearse answers, refine your narrative, or plan
              next steps after you send this application.
            </p>
            <a className="app-pack-coach__link" href="tel:+15550000000">
              +1 (555) 000-0000
            </a>
          </div>
        </aside>
      </div>
    </div>
  )
}
