import { NAV_FALLBACKS, SITE_CONTENT_FALLBACKS } from './fallbacks'
import {
  getRecord,
  indexPwaRecords,
  localizedFromRecord,
  plainText,
} from '../home-page-content/parse'
import { NAV_LABEL_KEYS, type NavLabelKey, type SiteContent } from './types'
import type { LocalizedText, PWAContentRecord } from '../home-page-content/types'

/** Salesforce Location__c values for site-wide PWA_Content__c records. */
export const SITE_PWA_LOCATIONS = {
  LATEST_RELEASES: 'Site Latest Releases',
  CONTACT: 'Site Contact',
  COMMERCIAL: 'Site Commercial Rental',
  NAVIGATION: 'Site Navigation',
} as const

function mergePageCopy(
  record: PWAContentRecord | undefined,
  fallback: { title: LocalizedText; subtitle: LocalizedText }
): { title: LocalizedText; subtitle: LocalizedText } {
  return {
    title: localizedFromRecord(record, fallback.title, 'title'),
    subtitle: localizedFromRecord(record, fallback.subtitle, 'body'),
  }
}

function mergeNavLabel(
  record: PWAContentRecord | undefined,
  key: NavLabelKey
): LocalizedText {
  return localizedFromRecord(record, NAV_FALLBACKS[key], 'title')
}

export function buildSiteContent(records: PWAContentRecord[]): SiteContent {
  const fallbacks = SITE_CONTENT_FALLBACKS
  const map = indexPwaRecords(records)

  const navigation = Object.fromEntries(
    NAV_LABEL_KEYS.map((key) => [
      key,
      mergeNavLabel(getRecord(map, SITE_PWA_LOCATIONS.NAVIGATION, 'card', key), key),
    ])
  ) as Record<NavLabelKey, LocalizedText>

  return {
    latestReleases: mergePageCopy(
      getRecord(map, SITE_PWA_LOCATIONS.LATEST_RELEASES, 'section'),
      fallbacks.latestReleases
    ),
    contact: mergePageCopy(
      getRecord(map, SITE_PWA_LOCATIONS.CONTACT, 'section'),
      fallbacks.contact
    ),
    commercial: mergePageCopy(
      getRecord(map, SITE_PWA_LOCATIONS.COMMERCIAL, 'section'),
      fallbacks.commercial
    ),
    navigation,
  }
}

export function isNavLabelKey(value: string): value is NavLabelKey {
  return (NAV_LABEL_KEYS as readonly string[]).includes(value)
}

export function navSlug(value: string): string {
  return plainText(value).toLowerCase()
}
