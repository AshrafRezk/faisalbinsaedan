import type { LocalizedText } from '../home-page-content'

export interface AchievementsStat {
  id: string
  value: number
  suffix: string
  label: LocalizedText
  displayOrder: number
}

export interface AchievementsCard {
  id: string
  icon: string
  title: LocalizedText
  description: LocalizedText
  imageUrl?: string
  displayOrder: number
}

export interface AchievementsPressItem {
  id: string
  quote: LocalizedText
  source: LocalizedText
  displayOrder: number
}

export interface AchievementsPageContent {
  hero: {
    badge: LocalizedText
    title: LocalizedText
    subtitle: LocalizedText
  }
  stats: AchievementsStat[]
  snapshot: {
    kicker: LocalizedText
    title: LocalizedText
    subtitle: LocalizedText
    cards: AchievementsCard[]
    highlights: AchievementsCard[]
  }
  awards: {
    kicker: LocalizedText
    title: LocalizedText
    items: AchievementsCard[]
  }
  press: {
    title: LocalizedText
    items: AchievementsPressItem[]
  }
}
