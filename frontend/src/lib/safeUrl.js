/**
 * Normalize user-provided URLs for links / window.open.
 * Only http: and https: are allowed (blocks javascript:, data:, etc.).
 * @param {unknown} raw
 * @returns {string | null}
 */
export function getSafeExternalUrl(raw) {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  let candidate = trimmed
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`
  }

  try {
    const u = new URL(candidate)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.href
  } catch {
    return null
  }
}
