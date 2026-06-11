import { ABOUT_PAGE_FALLBACKS } from './fallbacks'
import {
  getRecord,
  indexPwaRecords,
  localizedFromRecord,
  mediaUrl,
  mergeBoardMember,
  mergeCompanyValue,
  mergeLocalizedLines,
  parseBulletLines,
  parseParagraphs,
  plainText,
} from './parse'
import type { AboutPageContent } from './types'
import type { PWAContentRecord } from '../home-page-content/types'

/** Salesforce Location__c values for About page PWA_Content__c records. */
export const ABOUT_PWA_LOCATIONS = {
  VISION: 'About Vision',
  MISSION: 'About Mission',
  BOARD: 'About Board Members',
  VALUES: 'About Company Values',
} as const

export function buildAboutPageContent(records: PWAContentRecord[]): AboutPageContent {
  const fallbacks = ABOUT_PAGE_FALLBACKS
  const map = indexPwaRecords(records)

  const visionRecord = getRecord(map, ABOUT_PWA_LOCATIONS.VISION, 'section')
  const missionRecord = getRecord(map, ABOUT_PWA_LOCATIONS.MISSION, 'section')

  const visionEn = parseParagraphs(plainText(visionRecord?.Body_English__c))
  const visionAr = parseParagraphs(plainText(visionRecord?.Body_Arabic__c))
  const missionEn = parseBulletLines(plainText(missionRecord?.Body_English__c))
  const missionAr = parseBulletLines(plainText(missionRecord?.Body_Arabic__c))

  const boardMembers = fallbacks.boardMembers
    .map((member) => mergeBoardMember(getRecord(map, ABOUT_PWA_LOCATIONS.BOARD, 'card', member.id), member))
    .filter((member): member is NonNullable<typeof member> => member !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder)

  const knownValueIds = new Set(fallbacks.companyValues.map((value) => value.id))
  const companyValues = [...fallbacks.companyValues]

  for (const record of records) {
    if (record.Location__c !== ABOUT_PWA_LOCATIONS.VALUES) continue
    if (plainText(record.Type__c).toLowerCase() !== 'card') continue

    const id = plainText(record.Name).toLowerCase()
    if (!id || knownValueIds.has(id)) continue

    companyValues.push(mergeCompanyValue(record))
    knownValueIds.add(id)
  }

  for (const fallback of fallbacks.companyValues) {
    const record = getRecord(map, ABOUT_PWA_LOCATIONS.VALUES, 'card', fallback.id)
    if (!record) continue
    const index = companyValues.findIndex((value) => value.id === fallback.id)
    const merged = mergeCompanyValue(record, fallback)
    if (index >= 0) companyValues[index] = merged
    else companyValues.push(merged)
  }

  companyValues.sort((a, b) => a.displayOrder - b.displayOrder)

  return {
    vision: {
      title: localizedFromRecord(visionRecord, fallbacks.vision.title, 'title'),
      paragraphs: mergeLocalizedLines(visionEn, visionAr, fallbacks.vision.paragraphs),
      imageUrl: mediaUrl(visionRecord) || fallbacks.vision.imageUrl,
      displayOrder:
        typeof visionRecord?.Value_Number__c === 'number'
          ? visionRecord.Value_Number__c
          : fallbacks.vision.displayOrder,
    },
    mission: {
      title: localizedFromRecord(missionRecord, fallbacks.mission.title, 'title'),
      items: mergeLocalizedLines(missionEn, missionAr, fallbacks.mission.items),
      imageUrl: mediaUrl(missionRecord) || fallbacks.mission.imageUrl,
      displayOrder:
        typeof missionRecord?.Value_Number__c === 'number'
          ? missionRecord.Value_Number__c
          : fallbacks.mission.displayOrder,
    },
    boardMembers,
    companyValues,
  }
}
