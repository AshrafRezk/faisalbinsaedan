import { getProjects, searchUnits } from '../api-client'
import type { Project, Unit, UnitFilters } from '../types'

export interface ChatProjectCard {
  id: string
  name: string
  nameAr: string
  location: string
  locationAr: string
  description?: string
  descriptionAr?: string
  coverImageUrl?: string
  projectType?: string
}

export interface ChatLocationOption {
  value: string
  label: string
  labelAr: string
}

let cachedProjects: Project[] | null = null
let inflight: Promise<Project[]> | null = null

function toCard(project: Project): ChatProjectCard {
  return {
    id: project.id,
    name: project.name,
    nameAr: project.nameAr || project.name,
    location: project.location || project.city || '',
    locationAr: project.locationAr || project.location || project.city || '',
    description: project.description,
    descriptionAr: project.descriptionAr,
    coverImageUrl: project.coverImageUrl || project.logoUrl,
    projectType: project.projectType,
  }
}

export async function loadChatbotProjects(): Promise<Project[]> {
  if (cachedProjects) return cachedProjects
  if (inflight) return inflight

  inflight = getProjects()
    .then((res) => {
      const list = res.success && Array.isArray(res.data) ? (res.data as Project[]) : []
      cachedProjects = list
      return list
    })
    .catch((err) => {
      console.error('[Chatbot] Failed to load projects', err)
      cachedProjects = []
      return []
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

export function projectToCard(project: Project): ChatProjectCard {
  return toCard(project)
}

export function findMatchingProjects(query: string, projects: Project[]): Project[] {
  const q = query.trim().toLowerCase()
  if (!q || projects.length === 0) return []

  const scored = projects
    .map((project) => {
      const name = (project.name || '').toLowerCase()
      const nameAr = (project.nameAr || '').toLowerCase()
      const location = [project.city, project.location, project.locationAr, project.projectType]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      let score = 0
      if (name && (name === q || q === nameAr)) score += 100
      if (name && (name.includes(q) || q.includes(name))) score += 50
      if (nameAr && (nameAr.includes(q) || q.includes(nameAr))) score += 50
      if (location && location.includes(q)) score += 10
      return { project, score }
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.map((row) => row.project)
}

export function isProjectIntent(text: string): boolean {
  return /project|projects|مشاريع|مشروع|communities|developments/i.test(text)
}

export function locationOptionsFromProjects(projects: Project[]): ChatLocationOption[] {
  const seen = new Map<string, ChatLocationOption>()
  for (const project of projects) {
    const city = (project.city || '').trim()
    const location = (project.location || '').trim()
    const value = city || location
    if (!value) continue
    const key = value.toLowerCase()
    if (seen.has(key)) continue
    seen.set(key, {
      value,
      label: city || location,
      labelAr: project.locationAr || city || location,
    })
  }
  return [...seen.values()]
}

export async function searchMatchingUnits(filters: {
  location: string
  budget: string
  bedrooms: string
}): Promise<Unit[]> {
  const query: UnitFilters = {
    status: 'Available',
    page: 1,
    pageSize: 12,
  }

  if (filters.location && filters.location !== 'any') {
    query.city = filters.location
  }

  if (filters.budget === 'under_1_5m') {
    query.maxPrice = 1_500_000
  } else if (filters.budget === 'between_1_5m_3m') {
    query.minPrice = 1_500_000
    query.maxPrice = 3_000_000
  } else if (filters.budget === 'above_3m') {
    query.minPrice = 3_000_001
  }

  if (filters.bedrooms === '2') {
    query.bedrooms = 2
  } else if (filters.bedrooms === '3') {
    query.bedrooms = 3
  } else if (filters.bedrooms === '4_plus') {
    query.minBedrooms = 4
  }

  try {
    const res = await searchUnits(query)
    let units = res.success && Array.isArray(res.data) ? res.data : []

    if (filters.bedrooms === '4_plus') {
      units = units.filter((unit) => (unit.bedrooms || 0) >= 4)
    } else if (filters.bedrooms === '2' || filters.bedrooms === '3') {
      const needed = Number(filters.bedrooms)
      units = units.filter((unit) => unit.bedrooms === needed)
    }

    if (filters.budget === 'under_1_5m') {
      units = units.filter((unit) => (unit.finalPrice ?? unit.price) < 1_500_000)
    } else if (filters.budget === 'between_1_5m_3m') {
      units = units.filter((unit) => {
        const price = unit.finalPrice ?? unit.price
        return price >= 1_500_000 && price <= 3_000_000
      })
    } else if (filters.budget === 'above_3m') {
      units = units.filter((unit) => (unit.finalPrice ?? unit.price) > 3_000_000)
    }

    if (filters.location && filters.location !== 'any') {
      const loc = filters.location.toLowerCase()
      const cityMatched = units.filter((unit) => (unit.projectCity || '').toLowerCase().includes(loc))
      if (cityMatched.length > 0) units = cityMatched
    }

    return units.slice(0, 3)
  } catch (err) {
    console.error('[Chatbot] Failed to search units', err)
    return []
  }
}
