import type { LocalizedText } from '../home-page-content'

export const NAV_LABEL_KEYS = [
  'home',
  'search',
  'aboutUs',
  'achievements',
  'community',
  'contact',
  'support',
  'latestReleases',
  'ourNews',
  'more',
  'call',
  'commercial',
] as const

export type NavLabelKey = (typeof NAV_LABEL_KEYS)[number]

export interface SitePageCopy {
  title: LocalizedText
  subtitle: LocalizedText
}

export interface SiteContent {
  latestReleases: SitePageCopy
  contact: SitePageCopy
  commercial: SitePageCopy
  navigation: Record<NavLabelKey, LocalizedText>
}
