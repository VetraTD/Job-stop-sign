import { useCallback, useId, useRef, useState } from 'react'

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'formal', label: 'Formal' },
  { value: 'warm', label: 'Warm' },
  { value: 'bold', label: 'Bold' },
]

const CV_ACCEPT =
  'application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,.txt'

function looksPlainTextFile(file) {
  return (
    file.type === 'text/plain' ||
    /\.txt$/i.test(file.name) ||
    /\.text$/i.test(file.name)
  )
}

function readCvFile(file) {
  return new Promise((resolve, reject) => {
    const name = file.name
    if (looksPlainTextFile(file)) {
      const reader = new FileReader()
      reader.onload = () =>
        resolve({ name, text: String(reader.result ?? '').trim() })
      reader.onerror = () => reject(new Error('Could not read that file.'))
      reader.readAsText(file, 'UTF-8')
      return
    }
    resolve({ name, text: '' })
  })
}

export function NewApplication({ onGenerate, onCancel }) {
  const cvInputId = useId()
  const cvInputRef = useRef(null)
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [cvText, setCvText] = useState('')
  const [cvFileName, setCvFileName] = useState(null)
  const [cvHint, setCvHint] = useState('')
  const [cvError, setCvError] = useState('')
  const [cvReading, setCvReading] = useState(false)
  const [cvDragging, setCvDragging] = useState(false)
  const [jobDescription, setJobDescription] = useState('')
  const [tone, setTone] = useState('professional')

  const processCvFile = useCallback(async (file) => {
    setCvError('')
    setCvHint('')
    if (!file) {
      setCvFileName(null)
      setCvText('')
      return
    }
    setCvReading(true)
    try {
      const { name, text } = await readCvFile(file)
      setCvFileName(name)
      setCvText(text)
      if (!text) {
        setCvHint(
          looksPlainTextFile(file)
            ? 'File is empty or could not be read as text.'
            : 'PDF and Word files are stored for this application; full text extraction will run when the backend is connected.',
        )
      }
    } catch (err) {
      setCvFileName(null)
      setCvText('')
      setCvError(err instanceof Error ? err.message : 'Could not read file.')
    } finally {
      setCvReading(false)
    }
  }, [])

  const onCvFileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0]
      void processCvFile(file ?? null)
    },
    [processCvFile],
  )

  const onCvDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setCvDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) void processCvFile(file)
      if (cvInputRef.current) cvInputRef.current.value = ''
    },
    [processCvFile],
  )

  function clearCv() {
    setCvFileName(null)
    setCvText('')
    setCvHint('')
    setCvError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!cvFileName) return
    onGenerate({
      company: company.trim() || 'Company',
      jobTitle: jobTitle.trim() || 'Role',
      cvText,
      cvFileName,
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
            Upload your CV and paste the job description. We will produce a
            tailored pack (mock output for this MVP).
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
        <div className="field field--cv">
          <span className="field-label" id={`${cvInputId}-label`}>
            CV
          </span>
          <input
            ref={cvInputRef}
            id={cvInputId}
            className="cv-upload__native"
            type="file"
            accept={CV_ACCEPT}
            onChange={onCvFileChange}
            aria-labelledby={`${cvInputId}-label`}
            aria-busy={cvReading}
          />
          <label
            htmlFor={cvInputId}
            className={`cv-upload__box input${cvDragging ? ' cv-upload__box--drag' : ''}`}
            onDragEnter={(e) => {
              e.preventDefault()
              setCvDragging(true)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget)) return
              setCvDragging(false)
            }}
            onDrop={onCvDrop}
          >
            {cvReading ? (
              <span className="cv-upload__prompt">Reading file…</span>
            ) : cvFileName ? (
              <span className="cv-upload__file">
                <span className="cv-upload__name">{cvFileName}</span>
                <span className="cv-upload__meta">
                  {cvText
                    ? `${cvText.length.toLocaleString()} characters from file`
                    : 'Attached'}
                </span>
              </span>
            ) : (
              <span className="cv-upload__prompt">
                <strong className="cv-upload__action">Choose file</strong>
                <span className="cv-upload__or"> or drop it here</span>
                <span className="cv-upload__types">
                  PDF, Word, or plain text (.txt)
                </span>
              </span>
            )}
          </label>
          {cvFileName ? (
            <div className="cv-upload__toolbar">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  clearCv()
                  if (cvInputRef.current) cvInputRef.current.value = ''
                }}
              >
                Remove file
              </button>
            </div>
          ) : null}
          {cvHint ? (
            <p className="cv-upload__hint" role="status">
              {cvHint}
            </p>
          ) : null}
          {cvError ? (
            <p className="cv-upload__error" role="alert">
              {cvError}
            </p>
          ) : null}
        </div>
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
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={!cvFileName || cvReading}
          >
            Generate application pack
          </button>
        </div>
      </form>
    </div>
  )
}
