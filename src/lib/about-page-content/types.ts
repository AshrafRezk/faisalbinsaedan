import type { LocalizedText } from '../home-page-content'

export interface AboutBoardMember {
  id: string
  name: LocalizedText
  title: LocalizedText
  description: LocalizedText
  imageUrl: string
  displayOrder: number
  department?: LocalizedText
  linkedInUrl?: string
  twitterUrl?: string
  active: boolean
}

export interface AboutCompanyValue {
  id: string
  name: LocalizedText
  description: LocalizedText
  iconUrl?: string
  displayOrder: number
  featured: boolean
}

export interface AboutPageContent {
  vision: {
    title: LocalizedText
    paragraphs: LocalizedText[]
    imageUrl?: string
    displayOrder: number
  }
  mission: {
    title: LocalizedText
    items: LocalizedText[]
    imageUrl?: string
    displayOrder: number
  }
  boardMembers: AboutBoardMember[]
  companyValues: AboutCompanyValue[]
}
