import { ACHIEVEMENTS_PAGE_FALLBACKS } from './fallbacks'
import {
  getRecord,
  indexPwaRecords,
  localizedFromRecord,
  mediaUrl,
  parseStatValue,
  plainText,
} from '../home-page-content/parse'
import type {
  AchievementsCard,
  AchievementsPageContent,
  AchievementsPressItem,
  AchievementsStat,
} from './types'
import type { LocalizedText, PWAContentRecord } from '../home-page-content/types'

/** Salesforce Location__c values for Achievements page PWA_Content__c records. */
export const ACHIEVEMENTS_PWA_LOCATIONS = {
  HERO: 'Achievements Hero',
  STATS: 'Achievements Stats',
  SNAPSHOT_HEADER: 'Achievements Snapshot Header',
  SNAPSHOT_CARDS: 'Achievements Snapshot Cards',
  HIGHLIGHTS: 'Achievements Highlights',
  AWARDS_HEADER: 'Achievements Awards Header',
  AWARDS: 'Achievements Awards',
  PRESS_HEADER: 'Achievements Press Header',
  PRESS: 'Achievements Press',
} as const

function displayOrder(record: PWAContentRecord | undefined, fallback: number): number {
  if (typeof record?.Value_Number__c === 'number' && !Number.isNaN(record.Value_Number__c)) {
    return record.Value_Number__c
  }
  return fallback
}

function isInactive(record?: PWAContentRecord): boolean {
  return plainText(record?.Meta_keywords__c).toLowerCase() === 'inactive'
}

function mergeCard(
  record: PWAContentRecord | undefined,
  fallback: AchievementsCard
): AchievementsCard | null {
  if (record && isInactive(record)) return null

  const iconOverride = plainText(record?.Suffix__c)

  return {
    id: fallback.id,
    icon: iconOverride || fallback.icon,
    title: localizedFromRecord(record, fallback.title, 'title'),
    description: localizedFromRecord(record, fallback.description, 'body'),
    imageUrl: mediaUrl(record) || fallback.imageUrl,
    displayOrder: displayOrder(record, fallback.displayOrder),
  }
}

function mergeStat(
  record: PWAContentRecord | undefined,
  fallback: AchievementsStat
): AchievementsStat {
  const value = parseStatValue(record) ?? fallback.value

  return {
    id: fallback.id,
    value,
    suffix: plainText(record?.Suffix__c) || fallback.suffix,
    label: localizedFromRecord(record, fallback.label, 'title'),
    displayOrder: displayOrder(record, fallback.displayOrder),
  }
}

function mergePressItem(
  record: PWAContentRecord | undefined,
  fallback: AchievementsPressItem
): AchievementsPressItem | null {
  if (record && isInactive(record)) return null

  return {
    id: fallback.id,
    quote: localizedFromRecord(record, fallback.quote, 'body'),
    source: localizedFromRecord(record, fallback.source, 'title'),
    displayOrder: displayOrder(record, fallback.displayOrder),
  }
}

function mergeCardList(
  map: Map<string, PWAContentRecord>,
  location: string,
  fallbacks: AchievementsCard[]
): AchievementsCard[] {
  return fallbacks
    .map((card) => mergeCard(getRecord(map, location, 'card', card.id), card))
    .filter((card): card is AchievementsCard => card !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder)
}

function mergePressList(
  map: Map<string, PWAContentRecord>,
  location: string,
  fallbacks: AchievementsPressItem[]
): AchievementsPressItem[] {
  return fallbacks
    .map((item) => mergePressItem(getRecord(map, location, 'card', item.id), item))
    .filter((item): item is AchievementsPressItem => item !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder)
}

function sectionCopy(
  record: PWAContentRecord | undefined,
  fallbacks: { kicker?: LocalizedText; title: LocalizedText; subtitle?: LocalizedText }
): { kicker?: LocalizedText; title: LocalizedText; subtitle?: LocalizedText } {
  return {
    kicker: fallbacks.kicker
      ? localizedFromRecord(record, fallbacks.kicker, 'subtitle')
      : undefined,
    title: localizedFromRecord(record, fallbacks.title, 'title'),
    subtitle: fallbacks.subtitle
      ? localizedFromRecord(record, fallbacks.subtitle, 'body')
      : undefined,
  }
}

export function buildAchievementsPageContent(records: PWAContentRecord[]): AchievementsPageContent {
  const fallbacks = ACHIEVEMENTS_PAGE_FALLBACKS
  const map = indexPwaRecords(records)

  const heroRecord = getRecord(map, ACHIEVEMENTS_PWA_LOCATIONS.HERO, 'section')
  const snapshotHeaderRecord = getRecord(map, ACHIEVEMENTS_PWA_LOCATIONS.SNAPSHOT_HEADER, 'section')
  const awardsHeaderRecord = getRecord(map, ACHIEVEMENTS_PWA_LOCATIONS.AWARDS_HEADER, 'section')
  const pressHeaderRecord =
    getRecord(map, ACHIEVEMENTS_PWA_LOCATIONS.PRESS_HEADER, 'section') ||
    getRecord(map, ACHIEVEMENTS_PWA_LOCATIONS.PRESS, 'section')

  const heroBadge = localizedFromRecord(heroRecord, fallbacks.hero.badge, 'subtitle')
  const snapshotHeader = sectionCopy(snapshotHeaderRecord, {
    kicker: fallbacks.snapshot.kicker,
    title: fallbacks.snapshot.title,
    subtitle: fallbacks.snapshot.subtitle,
  })
  const awardsHeader = sectionCopy(awardsHeaderRecord, {
    kicker: fallbacks.awards.kicker,
    title: fallbacks.awards.title,
  })
  const pressHeader = sectionCopy(pressHeaderRecord, {
    title: fallbacks.press.title,
  })

  const stats = fallbacks.stats
    .map((stat) => mergeStat(getRecord(map, ACHIEVEMENTS_PWA_LOCATIONS.STATS, 'stat', stat.id), stat))
    .sort((a, b) => a.displayOrder - b.displayOrder)

  return {
    hero: {
      badge: heroBadge,
      title: localizedFromRecord(heroRecord, fallbacks.hero.title, 'title'),
      subtitle: localizedFromRecord(heroRecord, fallbacks.hero.subtitle, 'body'),
    },
    stats,
    snapshot: {
      kicker: snapshotHeader.kicker || fallbacks.snapshot.kicker,
      title: snapshotHeader.title,
      subtitle: snapshotHeader.subtitle || fallbacks.snapshot.subtitle,
      cards: mergeCardList(map, ACHIEVEMENTS_PWA_LOCATIONS.SNAPSHOT_CARDS, fallbacks.snapshot.cards),
      highlights: mergeCardList(map, ACHIEVEMENTS_PWA_LOCATIONS.HIGHLIGHTS, fallbacks.snapshot.highlights),
    },
    awards: {
      kicker: awardsHeader.kicker || fallbacks.awards.kicker,
      title: awardsHeader.title,
      items: mergeCardList(map, ACHIEVEMENTS_PWA_LOCATIONS.AWARDS, fallbacks.awards.items),
    },
    press: {
      title: pressHeader.title,
      items: mergePressList(map, ACHIEVEMENTS_PWA_LOCATIONS.PRESS, fallbacks.press.items),
    },
  }
}
