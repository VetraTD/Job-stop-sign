import { useState } from 'react'

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'formal', label: 'Formal' },
  { value: 'warm', label: 'Warm' },
  { value: 'bold', label: 'Bold' },
]

export function NewApplication({ onGenerate, onCancel }) {
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [cvText, setCvText] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [tone, setTone] = useState('professional')

  function handleSubmit(e) {
    e.preventDefault()
    onGenerate({
      company: company.trim() || 'Company',
      jobTitle: jobTitle.trim() || 'Role',
      cvText,
      jobDescription,
      tone,
    })
  }

  return (
    <div className="page new-app">
      <div className="page-head">
        <div>
          <h1 className="page-title">New application</h1>
          <p className="page-subtitle">
            Paste your CV and the job description. We will produce a tailored
            pack (mock output for this MVP).
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <form className="form form-wide panel-inner" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">
            <span className="field-label">Company name</span>
            <input
              className="input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Acme Corp"
              required
            />
          </label>
          <label className="field">
            <span className="field-label">Job title</span>
            <input
              className="input"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Product Designer"
              required
            />
          </label>
        </div>
        <label className="field">
          <span className="field-label">CV text</span>
          <textarea
            className="input textarea"
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            placeholder="Paste your CV or résumé…"
            rows={8}
            required
          />
        </label>
        <label className="field">
          <span className="field-label">Job description</span>
          <textarea
            className="input textarea"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description…"
            rows={10}
            required
          />
        </label>
        <fieldset className="field tone-field">
          <legend className="field-label">Tone preference</legend>
          <div className="tone-options">
            {TONES.map((t) => (
              <label key={t.value} className="tone-option">
                <input
                  type="radio"
                  name="tone"
                  value={t.value}
                  checked={tone === t.value}
                  onChange={() => setTone(t.value)}
                />
                <span>{t.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary btn-lg">
            Generate application pack
          </button>
        </div>
      </form>
    </div>
  )
}
