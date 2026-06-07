export interface LocalizedText {
  en: string
  ar: string
}

export interface HeroVideoContent {
  projectId: string
  projectName: string
  projectNameAr: string
  videoUrl: string
  coverImageUrl: string
  aspectRatio?: number
}

export interface HomeStatConfig {
  id: string
  value: number
  label: LocalizedText
  suffix?: string
  href?: string
  dynamic?: 'units' | 'projects'
}

export interface HomeFieldCardConfig {
  id: string
  imageUrl: string
  title: LocalizedText
  description: LocalizedText
  link: string
}

export interface HomePageContent {
  hero: {
    titleLine1: LocalizedText
    titleLine2: LocalizedText
    description: LocalizedText
    video: HeroVideoContent | null
    fallbackVideoUrl: string
  }
  inspiringSpaces: {
    title: LocalizedText
    description: LocalizedText
    imageUrl: string
  }
  stats: {
    title: LocalizedText
    description: LocalizedText
    staticStats: HomeStatConfig[]
  }
  ourFields: {
    title: LocalizedText
    readMoreLabel: LocalizedText
    cards: HomeFieldCardConfig[]
  }
  aboutProjects: {
    title: LocalizedText
  }
  cma: {
    imageUrl: string
    description: LocalizedText
    teaser: LocalizedText
    ctaLabel: LocalizedText
    ctaLink: string
  }
  cta: {
    title: LocalizedText
    description: LocalizedText
    buttonLabel: LocalizedText
  }
}

/**
 * PWA_Content__c — plain-text fields for CMS (no JSON in Meta_keywords__c).
 * Add these custom fields in Salesforce (see docs/homepage-pwa-content-fields.md).
 */
export interface PWAContentRecord {
  Id: string
  Name: string
  Content_URL__c?: string
  Type__c: string
  Location__c: string
  Meta_keywords__c?: string
  Aspect_Ratio__c?: string
  Title_English__c?: string
  Title_Arabic__c?: string
  Subtitle_English__c?: string
  Subtitle_Arabic__c?: string
  Body_English__c?: string
  Body_Arabic__c?: string
  Link_URL__c?: string
  Value_Number__c?: number
  Suffix__c?: string
}
