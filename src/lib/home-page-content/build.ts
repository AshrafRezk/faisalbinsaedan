import { HOME_PAGE_FALLBACKS } from './fallbacks'
import { processHeroVideoFromRecord } from './hero-video'
import {
  getRecord,
  indexPwaRecords,
  localizedFromRecord,
  mediaUrl,
  parseStatValue,
  plainText,
} from './parse'
import type {
  HomeFieldCardConfig,
  HomePageContent,
  HomeStatConfig,
  PWAContentRecord,
} from './types'

/** Salesforce Location__c values for homepage PWA_Content__c records. */
export const HOME_PWA_LOCATIONS = {
  HERO: 'Homepage Hero Section',
  INSPIRING: 'Homepage Inspiring Spaces',
  STATS_HEADER: 'Homepage Stats Header',
  STATS: 'Homepage Stats',
  OUR_FIELDS: 'Homepage Our Fields',
  ABOUT: 'Homepage About Projects',
  CMA: 'Homepage CMA',
  CTA: 'Homepage CTA',
} as const

function mergeFieldCard(
  map: Map<string, PWAContentRecord>,
  fallback: HomeFieldCardConfig
): HomeFieldCardConfig {
  const record = getRecord(map, HOME_PWA_LOCATIONS.OUR_FIELDS, 'card', fallback.id)
  if (!record) return fallback

  const imageUrl = mediaUrl(record) || fallback.imageUrl
  const link = plainText(record.Link_URL__c) || fallback.link

  return {
    id: fallback.id,
    imageUrl,
    title: localizedFromRecord(record, fallback.title, 'title'),
    description: localizedFromRecord(record, fallback.description, 'body'),
    link,
  }
}

function mergeAboutTitle(
  record: PWAContentRecord | undefined,
  fallback: { en: string; ar: string }
): { en: string; ar: string } {
  if (!record) return fallback

  const line1 = localizedFromRecord(record, fallback, 'title')
  const line2En = plainText(record.Subtitle_English__c)
  const line2Ar = plainText(record.Subtitle_Arabic__c)

  return {
    en: line2En ? `${line1.en}\n${line2En}` : line1.en,
    ar: line2Ar ? `${line1.ar}\n${line2Ar}` : line1.ar,
  }
}

function mergeStaticStat(
  map: Map<string, PWAContentRecord>,
  fallback: HomeStatConfig
): HomeStatConfig {
  const record = getRecord(map, HOME_PWA_LOCATIONS.STATS, 'stat', fallback.id)
  if (!record) return fallback

  const value = parseStatValue(record) ?? fallback.value

  return {
    ...fallback,
    value,
    suffix: plainText(record.Suffix__c) || fallback.suffix,
    href: plainText(record.Link_URL__c) || fallback.href,
    label: localizedFromRecord(record, fallback.label, 'title'),
  }
}

export function buildHomePageContent(records: PWAContentRecord[]): HomePageContent {
  const fallbacks = HOME_PAGE_FALLBACKS
  const map = indexPwaRecords(records)

  const heroVideoRecord = getRecord(map, HOME_PWA_LOCATIONS.HERO, 'video')
  const heroCopyRecord =
    getRecord(map, HOME_PWA_LOCATIONS.HERO, 'section') ||
    getRecord(map, HOME_PWA_LOCATIONS.HERO, 'text')

  const inspiringRecord =
    getRecord(map, HOME_PWA_LOCATIONS.INSPIRING, 'section') ||
    getRecord(map, HOME_PWA_LOCATIONS.INSPIRING, 'image')

  const statsHeaderRecord = getRecord(map, HOME_PWA_LOCATIONS.STATS_HEADER, 'section')
  const ourFieldsSectionRecord = getRecord(map, HOME_PWA_LOCATIONS.OUR_FIELDS, 'section')
  const aboutRecord = getRecord(map, HOME_PWA_LOCATIONS.ABOUT, 'section')
  const cmaRecord = getRecord(map, HOME_PWA_LOCATIONS.CMA, 'section')
  const ctaRecord = getRecord(map, HOME_PWA_LOCATIONS.CTA, 'section')

  const heroVideo = heroVideoRecord ? processHeroVideoFromRecord(heroVideoRecord) : null

  return {
    hero: {
      titleLine1: localizedFromRecord(heroCopyRecord, fallbacks.hero.titleLine1, 'title'),
      titleLine2: localizedFromRecord(heroCopyRecord, fallbacks.hero.titleLine2, 'subtitle'),
      description: localizedFromRecord(heroCopyRecord, fallbacks.hero.description, 'body'),
      video: heroVideo,
      fallbackVideoUrl: fallbacks.hero.fallbackVideoUrl,
    },
    inspiringSpaces: {
      title: localizedFromRecord(inspiringRecord, fallbacks.inspiringSpaces.title, 'title'),
      description: localizedFromRecord(inspiringRecord, fallbacks.inspiringSpaces.description, 'body'),
      imageUrl: mediaUrl(inspiringRecord) || fallbacks.inspiringSpaces.imageUrl,
    },
    stats: {
      title: localizedFromRecord(statsHeaderRecord, fallbacks.stats.title, 'title'),
      description: localizedFromRecord(statsHeaderRecord, fallbacks.stats.description, 'body'),
      staticStats: fallbacks.stats.staticStats.map((stat) => mergeStaticStat(map, stat)),
    },
    ourFields: {
      title: localizedFromRecord(ourFieldsSectionRecord, fallbacks.ourFields.title, 'title'),
      readMoreLabel: localizedFromRecord(
        ourFieldsSectionRecord,
        fallbacks.ourFields.readMoreLabel,
        'subtitle'
      ),
      cards: fallbacks.ourFields.cards.map((card) => mergeFieldCard(map, card)),
    },
    aboutProjects: {
      title: mergeAboutTitle(aboutRecord, fallbacks.aboutProjects.title),
    },
    cma: {
      imageUrl: mediaUrl(cmaRecord) || fallbacks.cma.imageUrl,
      description: localizedFromRecord(cmaRecord, fallbacks.cma.description, 'body'),
      teaser: localizedFromRecord(cmaRecord, fallbacks.cma.teaser, 'subtitle'),
      ctaLabel: {
        en: plainText(cmaRecord?.Title_English__c) || fallbacks.cma.ctaLabel.en,
        ar: plainText(cmaRecord?.Title_Arabic__c) || fallbacks.cma.ctaLabel.ar,
      },
      ctaLink: plainText(cmaRecord?.Link_URL__c) || fallbacks.cma.ctaLink,
    },
    cta: {
      title: localizedFromRecord(ctaRecord, fallbacks.cta.title, 'title'),
      description: localizedFromRecord(ctaRecord, fallbacks.cta.description, 'body'),
      buttonLabel: localizedFromRecord(ctaRecord, fallbacks.cta.buttonLabel, 'subtitle'),
    },
  }
}
