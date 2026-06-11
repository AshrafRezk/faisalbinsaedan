import {
  getRecord,
  indexPwaRecords,
  localizedFromRecord,
  mediaUrl,
  plainText,
} from '../home-page-content/parse'
import type { LocalizedText, PWAContentRecord } from '../home-page-content/types'
import type { AboutBoardMember, AboutCompanyValue } from './types'

export { getRecord, indexPwaRecords, localizedFromRecord, mediaUrl, plainText }

export function parseBulletLines(body: string): string[] {
  return body
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
}

export function parseParagraphs(body: string): string[] {
  const byBlankLine = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (byBlankLine.length > 1) return byBlankLine
  return parseBulletLines(body)
}

export function mergeLocalizedLines(
  enLines: string[],
  arLines: string[],
  fallbackLines: LocalizedText[]
): LocalizedText[] {
  const count = Math.max(enLines.length, arLines.length, fallbackLines.length)
  const merged: LocalizedText[] = []

  for (let i = 0; i < count; i += 1) {
    merged.push({
      en: enLines[i] || fallbackLines[i]?.en || '',
      ar: arLines[i] || fallbackLines[i]?.ar || '',
    })
  }

  return merged.filter((line) => line.en || line.ar)
}

export function isRecordActive(record?: PWAContentRecord): boolean {
  if (!record) return true
  return plainText(record.Meta_keywords__c).toLowerCase() !== 'inactive'
}

export function isRecordFeatured(record?: PWAContentRecord): boolean {
  return plainText(record?.Meta_keywords__c).toLowerCase() === 'featured'
}

export function parseSocialUrl(
  record: PWAContentRecord | undefined,
  field: 'linkedin' | 'twitter'
): string | undefined {
  if (!record) return undefined

  const link = plainText(record.Link_URL__c)
  const meta = plainText(record.Meta_keywords__c)

  if (field === 'linkedin') {
    if (link && /linkedin/i.test(link)) return link
    return link || undefined
  }

  if (meta && meta.toLowerCase() !== 'inactive' && meta.toLowerCase() !== 'featured') {
    if (/twitter|x\.com/i.test(meta)) return meta
  }

  return undefined
}

export function mergeBoardMember(
  record: PWAContentRecord | undefined,
  fallback: AboutBoardMember
): AboutBoardMember | null {
  if (record && !isRecordActive(record)) return null

  const displayOrder =
    typeof record?.Value_Number__c === 'number' && !Number.isNaN(record.Value_Number__c)
      ? record.Value_Number__c
      : fallback.displayOrder

  return {
    id: fallback.id,
    name: localizedFromRecord(record, fallback.name, 'title'),
    title: localizedFromRecord(record, fallback.title, 'subtitle'),
    description: localizedFromRecord(record, fallback.description, 'body'),
    imageUrl: mediaUrl(record) || fallback.imageUrl,
    displayOrder,
    department: fallback.department,
    linkedInUrl: parseSocialUrl(record, 'linkedin') || fallback.linkedInUrl,
    twitterUrl: parseSocialUrl(record, 'twitter') || fallback.twitterUrl,
    active: true,
  }
}

export function mergeCompanyValue(
  record: PWAContentRecord,
  fallback?: AboutCompanyValue
): AboutCompanyValue {
  const id = plainText(record.Name).toLowerCase() || fallback?.id || record.Id

  return {
    id,
    name: localizedFromRecord(record, fallback?.name || { en: id, ar: id }, 'title'),
    description: localizedFromRecord(
      record,
      fallback?.description || { en: '', ar: '' },
      'body'
    ),
    iconUrl: mediaUrl(record) || fallback?.iconUrl,
    displayOrder:
      typeof record.Value_Number__c === 'number' && !Number.isNaN(record.Value_Number__c)
        ? record.Value_Number__c
        : fallback?.displayOrder || 0,
    featured: isRecordFeatured(record) || fallback?.featured || false,
  }
}
