/** Normalize map URL values (missing or typo'd schemes → https). */
function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  const schemeMatch = trimmed.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)
  return schemeMatch ? `https://${trimmed.slice(schemeMatch[0].length)}` : `https://${trimmed}`
}

/**
 * iframe-safe Google Maps URL (embed or output=embed).
 */
export function toGoogleMapsEmbedUrl(
  officeLocationUrl: string | undefined,
  fallback?: { lat?: number; lng?: number; query?: string }
): string | null {
  const raw = officeLocationUrl?.trim()
  if (raw) {
    const url = normalizeUrl(raw)
    if (/google\.[^/]+\/maps\/embed/i.test(url) || /[?&]output=embed/i.test(url)) {
      return url
    }
  }

  if (typeof fallback?.lat === 'number' && typeof fallback?.lng === 'number') {
    return `https://maps.google.com/maps?q=${fallback.lat},${fallback.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`
  }

  const query = fallback?.query?.trim()
  if (query) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=13&ie=UTF8&iwloc=&output=embed`
  }

  return null
}

/**
 * Browser tab / Google Maps app URL. Embed links (maps/embed?pb=…) are not valid here.
 */
export function toGoogleMapsOpenUrl(
  officeLocationUrl: string | undefined,
  fallback?: { lat?: number; lng?: number; query?: string }
): string | null {
  const raw = officeLocationUrl?.trim()
  if (raw) {
    let url = normalizeUrl(raw)

    // https://www.google.com/maps/embed?pb=… → https://www.google.com/maps?pb=…
    url = url.replace(/\/maps\/embed(\/v1\/place)?/i, '/maps')

    // https://maps.google.com/maps?q=…&output=embed → strip output=embed
    try {
      const parsed = new URL(url)
      if (parsed.searchParams.get('output') === 'embed') {
        parsed.searchParams.delete('output')
      }
      url = parsed.toString()
    } catch {
      url = url.replace(/([?&])output=embed(&|$)/i, (_, sep, tail) => (tail === '&' ? sep : ''))
      url = url.replace(/\?&/, '?').replace(/[?&]$/, '')
    }

    if (/google\.[^/]+\/maps/i.test(url) || /maps\.app\.goo\.gl/i.test(url) || /goo\.gl\/maps/i.test(url)) {
      return url
    }

    return url
  }

  if (typeof fallback?.lat === 'number' && typeof fallback?.lng === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${fallback.lat},${fallback.lng}`
  }

  const query = fallback?.query?.trim()
  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
  }

  return null
}
