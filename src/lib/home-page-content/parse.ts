import type { LocalizedText, PWAContentRecord } from './types'

export function resolveText(text: LocalizedText, isRtl: boolean): string {
  return isRtl ? text.ar : text.en
}

export function plainText(value?: string | null): string {
  return (value || '').trim()
}

/** Bilingual copy from dedicated SF text fields (never JSON). */
export function localizedFromRecord(
  record: PWAContentRecord | undefined,
  fallback: LocalizedText,
  field: 'title' | 'subtitle' | 'body'
): LocalizedText {
  if (!record) return fallback

  const en =
    field === 'title'
      ? plainText(record.Title_English__c)
      : field === 'subtitle'
        ? plainText(record.Subtitle_English__c)
        : plainText(record.Body_English__c) || plainText(record.Meta_keywords__c)

  const ar =
    field === 'title'
      ? plainText(record.Title_Arabic__c)
      : field === 'subtitle'
        ? plainText(record.Subtitle_Arabic__c)
        : plainText(record.Body_Arabic__c)

  return {
    en: en || fallback.en,
    ar: ar || fallback.ar,
  }
}

export function mediaUrl(record?: PWAContentRecord): string {
  return plainText(record?.Content_URL__c)
}

export function parseStatValue(record?: PWAContentRecord): number | undefined {
  const fromField = record?.Value_Number__c
  if (typeof fromField === 'number' && !Number.isNaN(fromField)) return fromField

  const fromUrl = plainText(record?.Content_URL__c)
  if (fromUrl) {
    const n = Number(fromUrl.replace(/\+$/, ''))
    if (!Number.isNaN(n)) return n
  }
  return undefined
}

export function normalizeContentType(type?: string): string {
  return (type || '').trim().toLowerCase()
}

const NAMED_SLOT_TYPES = new Set(['card', 'stat'])

/** Records are expected newest-first (CreatedDate DESC) so the first match wins. */
export function indexPwaRecords(records: PWAContentRecord[]): Map<string, PWAContentRecord> {
  const map = new Map<string, PWAContentRecord>()
  for (const record of records) {
    const location = record.Location__c || ''
    const type = normalizeContentType(record.Type__c)
    const nameKey = plainText(record.Name).toLowerCase()

    if (NAMED_SLOT_TYPES.has(type)) {
      const key = `${location}::${type}::${nameKey}`
      if (!map.has(key)) map.set(key, record)
      continue
    }

    // Section / Video / Text: one slot per location+type (Name is only the SF record label)
    const slotKey = `${location}::${type}`
    if (!map.has(slotKey)) map.set(slotKey, record)

    if (nameKey) {
      const namedKey = `${location}::${type}::${nameKey}`
      if (!map.has(namedKey)) map.set(namedKey, record)
    }
  }
  return map
}

export function getRecord(
  map: Map<string, PWAContentRecord>,
  location: string,
  type: string,
  name = ''
): PWAContentRecord | undefined {
  const normalizedType = normalizeContentType(type)
  const normalizedName = name.trim().toLowerCase()

  if (normalizedName) {
    return map.get(`${location}::${normalizedType}::${normalizedName}`)
  }

  return map.get(`${location}::${normalizedType}`)
}
