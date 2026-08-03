/** Turn raw Salesforce / API error strings into short user-facing copy. */
export function friendlyLeadErrorMessage(
  raw: string | null | undefined,
  fallback: string
): string {
  const text = String(raw || '').trim()
  if (!text) return fallback

  const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})\s*$/)
  const candidate = jsonMatch ? jsonMatch[1] : text

  try {
    const parsed = JSON.parse(candidate) as unknown
    const items = Array.isArray(parsed) ? parsed : [parsed]
    const messages = items
      .map((item) => {
        if (item && typeof item === 'object' && 'message' in item) {
          return humanizeSalesforceMessage(String((item as { message?: string }).message || ''))
        }
        return null
      })
      .filter((m): m is string => Boolean(m))
    if (messages.length > 0) return messages.join(' ')
  } catch {
    // not JSON — continue
  }

  if (/Lead create failed|errorCode|FIELD_CUSTOM_VALIDATION/i.test(text)) {
    return humanizeSalesforceMessage(text) || fallback
  }

  return text
}

function humanizeSalesforceMessage(message: string): string | null {
  const text = message.trim()
  if (!text) return null

  const lower = text.toLowerCase()
  if (lower.includes('phone') && (lower.includes('saudi') || lower.includes('invalid number'))) {
    return 'Please enter a valid Saudi mobile number (without country code). Example: 501234567'
  }

  const cleaned = text.replace(/^[A-Za-z0-9_]+:\s*/, '').trim()
  if (/errorCode|FIELD_|EXCEPTION/i.test(cleaned)) return null
  return cleaned || text
}
