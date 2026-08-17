import { Unit, Lead, Case, AuthUser, UnitFilters, ApiResponse } from '../types'
import {
  extractProjectModelFiles,
  findProjectModelFile,
  isModelAttachmentTitle,
} from '../projectMedia'
import type { ProjectModelFile, ProjectNearbyLocation } from '../types'
import { salesforceQuery, salesforceFetchUnits, salesforceFetchNewsArticles, salesforceFetchNewsArticleDetail, SalesforceUnitDTO } from '../salesforce/client'
import {
  buildHomePageContent,
  HOME_PAGE_FALLBACKS,
  type HomePageContent,
} from '../home-page-content'
import {
  buildAboutPageContent,
  ABOUT_PAGE_FALLBACKS,
  type AboutPageContent,
} from '../about-page-content'
import {
  buildAchievementsPageContent,
  ACHIEVEMENTS_PAGE_FALLBACKS,
  type AchievementsPageContent,
} from '../achievements-page-content'
import { buildSiteContent, SITE_CONTENT_FALLBACKS, type SiteContent } from '../site-content'
import {
  filterMapEligibleProjects,
  filterMapEligibleUnits,
  normalizeUnitStatusGroup,
  parseMapGeometryJson,
  resolveProjectShowOnMap,
} from '../projectMap'
import type { ProjectMapUnit } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || ''

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include',
      ...options,
    })

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      // If not JSON, return error response
      return {
        success: false,
        error: 'API endpoint not available',
      }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error)
    return {
      success: false,
      error: 'Network error or endpoint not available',
    }
  }
}

/**
 * Detect aspect ratio from native video metadata
 * Priority 2: If Aspect_Ratio__c is not available, detect from video element
 * @param videoUrl - URL to the video file (.mp4, .m3u8, etc.)
 * @param videoElement - Optional existing video element to use
 * @returns Promise resolving to aspect ratio (width/height) or null if detection fails
 */
export async function detectVideoAspectRatio(
  videoUrl: string,
  videoElement?: HTMLVideoElement
): Promise<number | null> {
  // Only detect for native video URLs
  const isNativeVideo = /\.(mp4|webm|ogg|m3u8|mov|avi)(\?|$)/i.test(videoUrl) ||
    videoUrl.startsWith('blob:') ||
    videoUrl.startsWith('data:video/')

  if (!isNativeVideo) {
    console.log('[Video Detection] Not a native video URL, skipping detection:', videoUrl)
    return null
  }

  return new Promise((resolve) => {
    const video = videoElement || document.createElement('video')
    let resolved = false

    const cleanup = () => {
      if (!videoElement && video.parentNode) {
        video.parentNode.removeChild(video)
      } else if (!videoElement) {
        video.src = ''
        video.load()
      }
    }

    const finish = (value: number | null) => {
      if (resolved) return
      resolved = true
      clearTimeout(timeout)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('error', handleError)
      cleanup()
      resolve(value)
    }

    const handleLoadedMetadata = () => {
      if (resolved) return

      const width = video.videoWidth
      const height = video.videoHeight

      if (width && height) {
        const aspectRatio = width / height
        console.log('[Video Detection] ✅ Detected aspect ratio:', {
          width,
          height,
          aspectRatio,
        })
        finish(aspectRatio)
      } else {
        console.warn('[Video Detection] ⚠️ Could not get video dimensions')
        finish(null)
      }
    }

    const handleError = () => {
      if (resolved) return
      console.warn('[Video Detection] ⚠️ Error loading video metadata:', videoUrl)
      finish(null)
    }

    // Set timeout to avoid hanging
    const timeout = setTimeout(() => {
      if (resolved) return
      console.warn('[Video Detection] ⚠️ Timeout detecting video aspect ratio')
      finish(null)
    }, 5000)

    video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
    video.addEventListener('error', handleError, { once: true })

    // Set video source
    if (!videoElement) {
      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true
      video.style.position = 'absolute'
      video.style.visibility = 'hidden'
      video.style.width = '1px'
      video.style.height = '1px'
      document.body.appendChild(video)
    }

    video.src = videoUrl
    video.load()
  })
}

interface PWAContent {
  Id: string
  Name: string
  Content_URL__c: string
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

interface SalesforceProjectRecord {
  Id: string
  Name: string
  City__c?: string
  Province_Region__c?: string
  District__c?: string
  Project_Type__c?: string
  Hero_Image_URL__c?: string
  Logo_URL__c?: string
  Available_Units__c?: number
  Map_Centroid_Lat__c?: number
  Map_Centroid_Lng__c?: number
  Map_Geometry_JSON__c?: string
  Map_Show_On_Map__c?: boolean
  Office_Location__c?: string
  Project_Location__c?: string
  Project_Summary_English__c?: string
  Project_Summary_Arabic__c?: string
  Total_Area__c?: number
  Leasable_Area__c?: number
  Completion_Year__c?: number
  Project_Value__c?: number
}

interface SalesforceNearbyLocationRecord {
  Id: string
  Name_English__c?: string
  Name_Arabic__c?: string
  Category__c?: string
  Minutes__c?: number
  Sort_Order__c?: number
  Is_Active__c?: boolean
}

const SALESFORCE_ID_PATTERN = /^[a-zA-Z0-9]{15,18}$/

function isValidSalesforceId(id: string): boolean {
  return SALESFORCE_ID_PATTERN.test(id)
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function mapProjectSummaries(p: SalesforceProjectRecord) {
  const description = (p.Project_Summary_English__c || '').trim() || undefined
  const descriptionAr = (p.Project_Summary_Arabic__c || '').trim() || undefined
  return { description, descriptionAr }
}

function mapProjectDisplayName(p: SalesforceProjectRecord) {
  return {
    name: p.Name,
    nameAr: p.Name,
  }
}

interface SalesforceContentDocumentLinkRecord {
  ContentDocumentId: string
  LinkedEntityId: string
}

interface SalesforceContentVersionRecord {
  Id: string
  Title: string
  FileExtension?: string
  FileType?: string
  ContentDocumentId: string
  CreatedDate: string
}

function extractSalesforceIdFromAnchor(value?: string): string {
  if (!value) return ''
  const m = value.match(/href=["']\/([a-zA-Z0-9]{15,18})["']/i)
  return m?.[1] || ''
}

async function getProjectNotesAndAttachments(projectId: string) {
  // Files & enhanced notes are both exposed via ContentDocumentLink/ContentVersion.
  const linksQuery = `SELECT ContentDocumentId
                      FROM ContentDocumentLink
                      WHERE LinkedEntityId = '${projectId}'`
  const linksResult = await salesforceQuery<SalesforceContentDocumentLinkRecord>(linksQuery)
  const documentIds = (linksResult.records || []).map((r) => r.ContentDocumentId).filter(Boolean)

  if (documentIds.length === 0) {
    return { notes: [], attachments: [] }
  }

  const idsSoql = documentIds.map((id) => `'${id}'`).join(',')
  const versionsQuery = `SELECT Id, Title, FileExtension, FileType, ContentDocumentId, CreatedDate
                         FROM ContentVersion
                         WHERE IsLatest = true
                         AND ContentDocumentId IN (${idsSoql})
                         ORDER BY CreatedDate DESC`
  const versionsResult = await salesforceQuery<SalesforceContentVersionRecord>(versionsQuery)
  const versions = versionsResult.records || []

  const isNote = (v: SalesforceContentVersionRecord) => {
    const ext = (v.FileExtension || '').toLowerCase()
    const type = (v.FileType || '').toUpperCase()
    return ext === 'snote' || type === 'SNOTE'
  }

  const toUrl = (versionId: string) => `/api/salesforce-file?versionId=${encodeURIComponent(versionId)}`

  const notes = versions
    .filter(isNote)
    .map((v) => ({
      id: v.Id,
      title: v.Title,
      url: toUrl(v.Id),
    }))

  const attachments = versions
    .filter((v) => !isNote(v))
    .map((v) => ({
      id: v.Id,
      title: v.Title,
      fileExtension: v.FileExtension,
      fileType: v.FileType,
      url: toUrl(v.Id),
    }))

  return { notes, attachments }
}

function isSalesforceNoteVersion(v: SalesforceContentVersionRecord): boolean {
  const ext = (v.FileExtension || '').toLowerCase()
  const type = (v.FileType || '').toUpperCase()
  return ext === 'snote' || type === 'SNOTE'
}

function salesforceFileProxyUrl(versionId: string): string {
  return `/api/salesforce-file?versionId=${encodeURIComponent(versionId)}`
}

async function getProjectNearbyLocations(projectId: string): Promise<ProjectNearbyLocation[]> {
  if (!isValidSalesforceId(projectId)) return []

  const mapRecords = (records: SalesforceNearbyLocationRecord[]): ProjectNearbyLocation[] =>
    (records || [])
      .map((r) => {
        const name = (r.Name_English__c || '').trim()
        const nameAr = (r.Name_Arabic__c || '').trim() || name
        if (!name && !nameAr) return null
        const minutesRaw = r.Minutes__c
        const minutes = typeof minutesRaw === 'number' ? minutesRaw : Number(minutesRaw)
        return {
          id: r.Id,
          name: name || nameAr,
          nameAr,
          category: (r.Category__c || '').trim() || 'Mall',
          ...(Number.isFinite(minutes) ? { estimatedMinutes: Math.round(minutes) } : {}),
        } satisfies ProjectNearbyLocation
      })
      .filter((item): item is ProjectNearbyLocation => item !== null)

  // Query tiers — use the richest shape the org supports (Sort_Order__c / Is_Active__c optional).
  type NearbyQueryMode = 'full' | 'withMinutes' | 'base'
  const cacheKey = 'nearby_location_soql_mode_v4'
  const modes: Record<NearbyQueryMode, string> = {
    withMinutes: `SELECT Id, Name_English__c, Name_Arabic__c, Category__c, Minutes__c, CreatedDate
                  FROM Nearby_Location__c
                  WHERE Project__c = '${projectId}'
                  ORDER BY CreatedDate ASC`,
    full: `SELECT Id, Name_English__c, Name_Arabic__c, Category__c, Minutes__c, Sort_Order__c
           FROM Nearby_Location__c
           WHERE Project__c = '${projectId}' AND Is_Active__c = true
           ORDER BY Sort_Order__c ASC NULLS LAST, CreatedDate ASC`,
    base: `SELECT Id, Name_English__c, Name_Arabic__c, Category__c, CreatedDate
           FROM Nearby_Location__c
           WHERE Project__c = '${projectId}'
           ORDER BY CreatedDate ASC`,
  }

  const tier: Record<NearbyQueryMode, number> = { base: 0, withMinutes: 1, full: 2 }
  const cached = sessionStorage.getItem(cacheKey) as NearbyQueryMode | null

  // Prefer withMinutes first — prod may not have Sort_Order__c / Is_Active__c yet.
  const allModes: NearbyQueryMode[] = ['withMinutes', 'full', 'base']
  const order: NearbyQueryMode[] = cached
    ? [...allModes.filter((m) => tier[m] >= tier[cached]), ...allModes.filter((m) => tier[m] < tier[cached])]
    : allModes

  for (const mode of order) {
    try {
      const result = await salesforceQuery<SalesforceNearbyLocationRecord>(modes[mode])
      sessionStorage.setItem(cacheKey, mode)
      return mapRecords(result.records || [])
    } catch {
      if (cached === mode) sessionStorage.removeItem(cacheKey)
    }
  }

  console.warn('[Project] Nearby locations query failed — check Nearby_Location__c in Salesforce')
  return []
}

function resolveProjectLogoUrl(
  media: { logoUrl?: string } | undefined,
  salesforceLogoUrl?: string | null
): string {
  return media?.logoUrl || salesforceLogoUrl?.trim() || ''
}

async function getProjectsMedia(projectIds: string[]) {
  type ProjectMedia = ReturnType<typeof pickMediaFromAttachments>
  if (projectIds.length === 0) return new Map<string, ProjectMedia>()

  const idsSoql = projectIds.map((id) => `'${id}'`).join(',')
  const linksQuery = `SELECT ContentDocumentId, LinkedEntityId
                      FROM ContentDocumentLink
                      WHERE LinkedEntityId IN (${idsSoql})`
  const linksResult = await salesforceQuery<SalesforceContentDocumentLinkRecord>(linksQuery)
  const links = linksResult.records || []

  const contentDocumentIds = Array.from(new Set(links.map((l) => l.ContentDocumentId).filter(Boolean)))
  if (contentDocumentIds.length === 0) return new Map<string, ProjectMedia>()

  const docIdsSoql = contentDocumentIds.map((id) => `'${id}'`).join(',')
  const versionsQuery = `SELECT Id, Title, FileExtension, FileType, ContentDocumentId, CreatedDate
                         FROM ContentVersion
                         WHERE IsLatest = true
                         AND ContentDocumentId IN (${docIdsSoql})
                         ORDER BY CreatedDate DESC`
  const versionsResult = await salesforceQuery<SalesforceContentVersionRecord>(versionsQuery)
  const versions = versionsResult.records || []

  const versionByDocId = new Map<string, SalesforceContentVersionRecord>()
  for (const v of versions) {
    if (!versionByDocId.has(v.ContentDocumentId)) versionByDocId.set(v.ContentDocumentId, v)
  }

  const versionsByProjectId = new Map<string, SalesforceContentVersionRecord[]>()
  for (const link of links) {
    const v = versionByDocId.get(link.ContentDocumentId)
    if (!v || isSalesforceNoteVersion(v)) continue

    const projectId = link.LinkedEntityId
    const bucket = versionsByProjectId.get(projectId) || []
    bucket.push(v)
    versionsByProjectId.set(projectId, bucket)
  }

  const mediaByProjectId = new Map<string, ProjectMedia>()
  for (const [projectId, projectVersions] of versionsByProjectId) {
    projectVersions.sort(
      (a, b) => Date.parse(b.CreatedDate || '') - Date.parse(a.CreatedDate || '')
    )
    const attachments = projectVersions.map((v) => ({
      title: v.Title || '',
      fileExtension: v.FileExtension,
      url: salesforceFileProxyUrl(v.Id),
    }))
    mediaByProjectId.set(projectId, pickMediaFromAttachments(attachments))
  }

  return mediaByProjectId
}

function pickMediaFromAttachments(attachments: Array<{ title: string; fileExtension?: string; url: string }>) {
  const isMedia = (ext?: string) => {
    const e = (ext || '').toLowerCase()
    return e === 'png' || e === 'jpg' || e === 'jpeg' || e === 'webp' || e === 'mp4' || e === 'webm' || e === 'mov' || e === 'pdf'
  }
  
  const media: { 
    heroUrl?: string; 
    logoUrl?: string; 
    defaultUrl?: string; 
    videoUrl?: string; 
    topPlanUrl?: string; 
    brochureUrl?: string;
    gallery: Array<{ url: string; tagEn: string; tagAr: string; }>;
  } = { gallery: [] }
  
  for (const a of attachments) {
    if (isMedia(a.fileExtension)) {
      const title = (a.title || '').toLowerCase()
      if (isModelAttachmentTitle(a.title)) {
        continue
      }
      if (title.includes('project-logo') || title.includes('project logo')) {
        if (!media.logoUrl) media.logoUrl = a.url;
      } else if (title.includes('project-hero') || title.includes('project hero')) {
        if (!media.heroUrl) media.heroUrl = a.url;
      } else if (title.includes('project-video-advert') || title.includes('video advert')) {
        if (!media.videoUrl) media.videoUrl = a.url;
      } else if (title.includes('project-top-plan') || title.includes('project top plan')) {
        if (!media.topPlanUrl) media.topPlanUrl = a.url;
      } else if (title.includes('project-brochure') || title.includes('project brochure')) {
        if (!media.brochureUrl) media.brochureUrl = a.url;
      } else if (title.includes('project-gallery') || title.includes('project gallery')) {
        let tagEn = 'Inspiring Interiors';
        let tagAr = 'مساحات داخلية تلهمك';
        
        if (title.includes('exterior')) {
          tagEn = 'Amazing Exteriors';
          tagAr = 'واجهات تأسر الأبصار';
        } else if (title.includes('kitchen')) {
          tagEn = 'A Kitchen that Feels Like Home';
          tagAr = 'مطبخ ينبض بالدفء والسكينة';
        } else if (title.includes('reception')) {
          tagEn = 'Welcoming Elegance';
          tagAr = 'فخامة الاستقبال وحفاوة اللقاء';
        } else if (title.includes('bedroom')) {
          tagEn = 'Serene Sanctuaries';
          tagAr = 'ملاذ السكينة والهدوء';
        }
        
        media.gallery.push({ url: a.url, tagEn, tagAr });
      } else {
        if (!media.defaultUrl) media.defaultUrl = a.url;
      }
    }
  }
  
  return media;
}

// Projects
const DEFAULT_PROJECTS_PAGE_SIZE = 4

export async function getProjects(options?: {
  projectType?: string
  page?: number
  pageSize?: number
  /** Load all map-eligible projects (centroid/geometry + visible on map). No pagination. */
  forMap?: boolean
}) {
  const projectType = options?.projectType?.trim()
  const forMap = options?.forMap === true
  const page = options?.page
  const pageSize = options?.pageSize ?? DEFAULT_PROJECTS_PAGE_SIZE
  const isPaginated = !forMap && typeof page === 'number' && page > 0

  const CACHE_KEY = forMap
    ? `binsaedan_projects_map_v1_${projectType?.toLowerCase() || 'all'}`
    : isPaginated
      ? `binsaedan_projects_cache_v9_${projectType?.toLowerCase() || 'all'}_p${page}_s${pageSize}`
      : projectType
        ? `binsaedan_projects_cache_v9_${projectType.toLowerCase()}`
        : 'binsaedan_projects_cache_v9'
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  // Check cache
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      const { timestamp, data, totalCount, pagination } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log('[Projects] Returning cached data')
        return { success: true, data, totalCount, pagination }
      }
    }
  } catch (e) {
    console.warn('[Projects] Cache parse error', e)
    sessionStorage.removeItem(CACHE_KEY)
  }

  try {
    // Try to fetch from Salesforce first
    console.log('[Projects] Fetching projects from Salesforce...')

    // 1. Fetch Projects
    const whereClause = projectType
      ? ` WHERE Project_Type__c = '${projectType.replace(/'/g, "\\'")}'`
      : ''

    let totalCount: number | undefined
    if (isPaginated) {
      const countResult = await salesforceQuery<Record<string, unknown>>(
        `SELECT COUNT() FROM Project__c${whereClause}`
      )
      totalCount = countResult.totalSize ?? 0
    }

    const offset = isPaginated ? (page - 1) * pageSize : 0
    const limitClause = isPaginated ? ` LIMIT ${pageSize} OFFSET ${offset}` : ''
    const projectsQuery = `SELECT Id, Name, City__c, Province_Region__c, District__c, Project_Type__c,
                          Hero_Image_URL__c, Logo_URL__c, Available_Units__c,
                          Map_Centroid_Lat__c, Map_Centroid_Lng__c, Map_Geometry_JSON__c,
                          Map_Show_On_Map__c,
                          Project_Summary_English__c, Project_Summary_Arabic__c
                          FROM Project__c${whereClause}
                          ORDER BY CreatedDate DESC${limitClause}`

    const projectsResult = await salesforceQuery<SalesforceProjectRecord>(projectsQuery)

    const sfProjects = projectsResult.records || []

    if (sfProjects.length === 0) {
      const emptyPagination = isPaginated
        ? {
            page,
            pageSize,
            totalCount: totalCount ?? 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: page > 1,
          }
        : undefined

      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          data: [],
          totalCount: totalCount ?? 0,
          pagination: emptyPagination,
        })
      )
      return {
        success: true,
        data: [],
        totalCount: totalCount ?? 0,
        pagination: emptyPagination,
      }
    }

    const projectIds = sfProjects.map((p) => p.Id)
    const [mediaByProjectId, availableUnitsByProjectId] = await Promise.all([
      getProjectsMedia(projectIds),
      getAvailableUnitsCountsForProjects(projectIds).catch((error) => {
        console.warn('[Projects] Live unit counts failed, using rollup fallback:', error)
        return new Map<string, number>()
      }),
    ])

    // Transform to application format
    const mappedProjects = sfProjects.map((p) => {
      const availableUnitsCount = resolveAvailableUnitsCount(
        availableUnitsByProjectId.get(p.Id),
        p.Available_Units__c
      )
      const mapGeometryJson = parseMapGeometryJson(p.Map_Geometry_JSON__c)
      const showOnMap = resolveProjectShowOnMap(p)
      const { description, descriptionAr } = mapProjectSummaries(p)
      const names = mapProjectDisplayName(p)

      const media = mediaByProjectId.get(p.Id) || {}

      return {
        id: p.Id,
        name: names.name,
        nameAr: names.nameAr,
        provinceRegion: p.Province_Region__c?.trim() || undefined,
        city: p.City__c?.trim() || undefined,
        projectType: p.Project_Type__c?.trim() || undefined,
        location: [p.District__c, p.City__c, p.Province_Region__c]
          .map((v) => (typeof v === 'string' ? v.trim() : v))
          .filter((v) => Boolean(v))
          .join(', '),
        locationAr: [p.District__c, p.City__c, p.Province_Region__c]
          .map((v) => (typeof v === 'string' ? v.trim() : v))
          .filter((v) => Boolean(v))
          .join(', '),
        coverImageUrl: media.heroUrl || media.defaultUrl || p.Hero_Image_URL__c || p.Logo_URL__c || '',
        featuredVideoUrl: media.videoUrl || '',
        status: 'Active',
        mapCentroidLat: typeof p.Map_Centroid_Lat__c === 'number' ? p.Map_Centroid_Lat__c : undefined,
        mapCentroidLng: typeof p.Map_Centroid_Lng__c === 'number' ? p.Map_Centroid_Lng__c : undefined,
        mapGeometryJson,
        showOnMap,
        description,
        descriptionAr,
        logoUrl: resolveProjectLogoUrl(media, p.Logo_URL__c),
        topPlanUrl: media.topPlanUrl,
        gallery: media.gallery || [],
        phases: [],
        // UI Helpers (kept for compatibility)
        hasAvailability: availableUnitsCount > 0,
        availablePhasesCount: availableUnitsCount,
        // Compatibility with older UI fields
        nameEn: p.Name,
        locationEn: [p.District__c, p.City__c, p.Province_Region__c]
          .map((v) => (typeof v === 'string' ? v.trim() : v))
          .filter((v) => Boolean(v))
          .join(', '),
      }
    })

    const resultProjects = forMap ? filterMapEligibleProjects(mappedProjects) : mappedProjects

    console.log('[Projects] ✅ Loaded from Salesforce:', resultProjects.length)

    const pagination = isPaginated
      ? {
          page,
          pageSize,
          totalCount: totalCount ?? resultProjects.length,
          totalPages: Math.ceil((totalCount ?? resultProjects.length) / pageSize),
          hasNextPage: page * pageSize < (totalCount ?? resultProjects.length),
          hasPreviousPage: page > 1,
        }
      : undefined

    // Cache success result
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data: resultProjects,
        totalCount: forMap ? resultProjects.length : totalCount,
        pagination,
      })
    )

    return {
      success: true,
      data: resultProjects,
      totalCount: forMap ? resultProjects.length : totalCount,
      pagination,
    }
  } catch (error) {
    console.error('[Projects] ❌ Failed to load from Salesforce:', error)
    return {
      success: false,
      error: 'Failed to load projects from Salesforce',
    }
  }
}

interface SalesforceUnitMapRecord {
  Id: string
  Name: string
  Status__c?: string
  Price__c?: number
  Final_Price__c?: number
  Eligible_for_Subsidies__c?: string
  Subsidies__c?: number
  Number_of_Bedrooms__c?: number
  Number_of_Bathrooms__c?: number
  BUA__c?: number
  Map_Centroid_Lat__c?: number
  Map_Centroid_Lng__c?: number
  Map_Geometry_JSON__c?: string
  Map_Show_On_Map__c?: boolean
  Building__r?: {
    Name?: string
    Block__r?: {
      Phase__r?: {
        Name?: string
      }
    }
  }
}

/** Load unit polygons/centroids for the interactive project map. */
export async function getProjectMapUnits(projectId: string) {
  if (!isValidSalesforceId(projectId)) {
    return { success: false as const, error: 'Invalid project id' }
  }

  const CACHE_KEY = `binsaedan_project_map_units_v4_${projectId}`
  const CACHE_TTL = 5 * 60 * 1000

  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      const { timestamp, data } = JSON.parse(cached) as { timestamp: number; data: ProjectMapUnit[] }
      if (Date.now() - timestamp < CACHE_TTL) {
        return { success: true as const, data }
      }
    }
  } catch {
    sessionStorage.removeItem(CACHE_KEY)
  }

  try {
    const soql = `SELECT Id, Name, Status__c, Price__c, Final_Price__c, Eligible_for_Subsidies__c, Subsidies__c,
                  Number_of_Bedrooms__c, Number_of_Bathrooms__c, BUA__c,
                  Map_Centroid_Lat__c, Map_Centroid_Lng__c, Map_Geometry_JSON__c, Map_Show_On_Map__c,
                  Building__r.Name, Building__r.Block__r.Phase__r.Name
                  FROM Unit__c
                  WHERE Building__r.Block__r.Phase__r.Project__c = '${projectId}'
                  ORDER BY Name`

    const result = await salesforceQuery<SalesforceUnitMapRecord>(soql)
    const mapped = (result.records || []).map((u) => ({
      id: u.Id,
      name: u.Name,
      status: (u.Status__c || '').trim() || 'Unknown',
      statusGroup: normalizeUnitStatusGroup(u.Status__c),
      price: typeof u.Price__c === 'number' ? u.Price__c : undefined,
      finalPrice: typeof u.Final_Price__c === 'number' ? u.Final_Price__c : undefined,
      eligibleForSubsidies: parseEligibleForSubsidies(u.Eligible_for_Subsidies__c),
      subsidies: u.Subsidies__c != null ? String(u.Subsidies__c) : undefined,
      bedrooms: typeof u.Number_of_Bedrooms__c === 'number' ? u.Number_of_Bedrooms__c : undefined,
      bathrooms: typeof u.Number_of_Bathrooms__c === 'number' ? u.Number_of_Bathrooms__c : undefined,
      bua: typeof u.BUA__c === 'number' ? u.BUA__c : undefined,
      buildingName: u.Building__r?.Name?.trim() || undefined,
      phaseName: u.Building__r?.Block__r?.Phase__r?.Name?.trim() || undefined,
      mapCentroidLat: typeof u.Map_Centroid_Lat__c === 'number' ? u.Map_Centroid_Lat__c : undefined,
      mapCentroidLng: typeof u.Map_Centroid_Lng__c === 'number' ? u.Map_Centroid_Lng__c : undefined,
      mapGeometryJson: parseMapGeometryJson(u.Map_Geometry_JSON__c),
      showOnMap: u.Map_Show_On_Map__c !== false,
    }))

    const data = filterMapEligibleUnits(mapped)
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }))
    return { success: true as const, data }
  } catch (error) {
    console.error('[ProjectMapUnits] Failed to load:', error)
    return { success: false as const, error: 'Failed to load project map units' }
  }
}

function parseSalesforceAggregateCount(record: Record<string, unknown> | undefined): number {
  if (!record) return 0
  for (const [key, val] of Object.entries(record)) {
    if (key === 'attributes') continue
    if (typeof val === 'number' && Number.isFinite(val)) return val
    if (typeof val === 'string' && val.trim() !== '' && !Number.isNaN(Number(val))) {
      return Number(val)
    }
  }
  return 0
}

function resolveAvailableUnitsCount(
  liveCount: number | undefined,
  rollupCount: number | undefined | null
): number {
  const live = liveCount ?? 0
  const rollup = Number(rollupCount || 0)
  return live > 0 ? live : rollup
}

function projectIdPrefixForUnitMatch(projectId: string): string {
  return projectId.substring(0, 15).toLowerCase()
}

function resolveProjectIdFromUnitProjectField(
  value: string | undefined,
  prefixToProjectId: Map<string, string>
): string | undefined {
  const extracted = extractSalesforceIdFromAnchor(value) || value || ''
  if (!extracted) return undefined
  return prefixToProjectId.get(extracted.substring(0, 15).toLowerCase())
}

async function getAvailableUnitsCountForProject(
  projectId: string,
  rollupCount?: number | null
): Promise<number> {
  if (!isValidSalesforceId(projectId)) return 0

  const projectPrefix = projectIdPrefixForUnitMatch(projectId)

  try {
    // Unit__c.Project__c is an HTML link field, not a lookup — match the embedded project id.
    const result = await salesforceQuery<Record<string, unknown>>(
      `SELECT COUNT(Id) unitCount FROM Unit__c WHERE Project__c LIKE '%${projectPrefix}%' AND Status__c = 'Available'`
    )
    return resolveAvailableUnitsCount(
      parseSalesforceAggregateCount(result.records?.[0]),
      rollupCount
    )
  } catch (e) {
    console.warn(`[Units] Failed to count available units for project ${projectId}:`, e)
    return Number(rollupCount || 0)
  }
}

async function getAvailableUnitsCountsForProjects(projectIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  const validIds = projectIds.filter(isValidSalesforceId)
  if (validIds.length === 0) return counts

  const prefixToProjectId = new Map<string, string>()
  for (const projectId of validIds) {
    counts.set(projectId, 0)
    prefixToProjectId.set(projectIdPrefixForUnitMatch(projectId), projectId)
  }

  const pageSize = 2000
  let offset = 0

  while (true) {
    const result = await salesforceQuery<{ Project__c?: string }>(
      `SELECT Project__c FROM Unit__c WHERE Status__c = 'Available' ORDER BY Id LIMIT ${pageSize} OFFSET ${offset}`
    )
    const records = result.records || []
    if (records.length === 0) break

    for (const record of records) {
      const projectId = resolveProjectIdFromUnitProjectField(record.Project__c, prefixToProjectId)
      if (!projectId) continue
      counts.set(projectId, (counts.get(projectId) ?? 0) + 1)
    }

    if (records.length < pageSize) break
    offset += pageSize
  }

  return counts
}

export async function getHomePageStats() {
  const CACHE_KEY = 'binsaedan_home_stats_cache_v3'
  const CACHE_TTL = 5 * 60 * 1000

  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      const { timestamp, data } = JSON.parse(cached) as {
        timestamp: number
        data: { unitsCount: number; projectsCount: number }
      }
      if (Date.now() - timestamp < CACHE_TTL) {
        return { success: true, data }
      }
    }
  } catch (e) {
    console.warn('[Home Stats] Cache parse error', e)
    sessionStorage.removeItem(CACHE_KEY)
  }

  try {
    const [projectsRes, unitsFetchResult] = await Promise.all([
      getProjects(),
      salesforceFetchUnits({ page: 1, pageSize: 1, status: 'Available' }),
    ])

    let projectsCount =
      projectsRes.success && projectsRes.data ? projectsRes.data.length : 0
    let unitsCount = 0
    if (unitsFetchResult.success && unitsFetchResult.data) {
      unitsCount =
        unitsFetchResult.data.pagination?.totalCount ??
        unitsFetchResult.data.units?.length ??
        0
    }

    // SOQL COUNT fallback when list/search APIs return empty (e.g. permissions differ per endpoint)
    if (projectsCount === 0) {
      try {
        const projectsCountResult = await salesforceQuery<Record<string, unknown>>(
          'SELECT COUNT(Id) projectCount FROM Project__c'
        )
        projectsCount = parseSalesforceAggregateCount(projectsCountResult.records?.[0])
      } catch (e) {
        console.warn('[Home Stats] Project COUNT fallback failed:', e)
      }
    }

    if (unitsCount === 0) {
      try {
        const unitsCountResult = await salesforceQuery<Record<string, unknown>>(
          "SELECT COUNT(Id) unitCount FROM Unit__c WHERE Status__c = 'Available'"
        )
        unitsCount = parseSalesforceAggregateCount(unitsCountResult.records?.[0])
      } catch (e) {
        console.warn('[Home Stats] Unit COUNT fallback failed:', e)
      }
    }

    const data = { unitsCount, projectsCount }

    console.log('[Home Stats] Loaded counts:', data)

    // Avoid caching stale zeros from a partial/failed load
    if (projectsRes.success || unitsFetchResult.success) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data }))
    }

    return { success: true, data }
  } catch (error) {
    console.error('[Home Stats] Failed to load counts from Salesforce:', error)
    return {
      success: false,
      error: 'Failed to load home page stats from Salesforce',
    }
  }
}

export async function getProject(id: string) {
  console.log('[Project] Fetching project from Salesforce:', id)

  try {
    const baseFields = `Id, Name, City__c, Province_Region__c, District__c, Project_Type__c,
                          Hero_Image_URL__c, Logo_URL__c, Available_Units__c,
                          Map_Centroid_Lat__c, Map_Centroid_Lng__c, Map_Geometry_JSON__c,
                          Map_Show_On_Map__c,
                          Project_Summary_English__c, Project_Summary_Arabic__c,
                          Project_Location__c, Office_Location__c`
    const extraFieldSets = [
      ', Total_Area__c, Leasable_Area__c, Completion_Year__c, Project_Value__c',
      ', Total_Area__c',
      '',
    ]

    let p: SalesforceProjectRecord | undefined
    for (const extra of extraFieldSets) {
      const projectQuery = `SELECT ${baseFields}${extra}
                          FROM Project__c 
                          WHERE Id = '${id}'
                          LIMIT 1`
      try {
        const projectResult = await salesforceQuery<SalesforceProjectRecord>(projectQuery)
        p = projectResult.records?.[0]
        break
      } catch (error) {
        const lastAttempt = extra === extraFieldSets[extraFieldSets.length - 1]
        console.warn('[Project] SOQL failed, retrying without extra fields:', extra || '(base)', error)
        if (lastAttempt) throw error
      }
    }
    if (!p) {
      return { success: false, error: 'Project not found in Salesforce' }
    }

    const [{ notes, attachments: allAttachments }, availableUnitsCount, nearbyLocations] = await Promise.all([
      getProjectNotesAndAttachments(id),
      getAvailableUnitsCountForProject(id, p.Available_Units__c),
      getProjectNearbyLocations(id),
    ])
    const modelFiles = extractProjectModelFiles(allAttachments)
    const attachments = allAttachments.filter((a) => !isModelAttachmentTitle(a.title))
    const media = pickMediaFromAttachments(allAttachments)
    const mapCentroidLat = typeof p.Map_Centroid_Lat__c === 'number' ? p.Map_Centroid_Lat__c : undefined
    const mapCentroidLng = typeof p.Map_Centroid_Lng__c === 'number' ? p.Map_Centroid_Lng__c : undefined
    const mapGeometryJson = parseMapGeometryJson(p.Map_Geometry_JSON__c)
    const showOnMap = resolveProjectShowOnMap(p)
    const { description, descriptionAr } = mapProjectSummaries(p)
    const names = mapProjectDisplayName(p)

    return {
      success: true,
      data: {
        id: p.Id,
        name: names.name,
        nameAr: names.nameAr,
        projectType: p.Project_Type__c?.trim() || undefined,
        location: [p.District__c, p.City__c, p.Province_Region__c]
          .map((v) => (typeof v === 'string' ? v.trim() : v))
          .filter((v) => Boolean(v))
          .join(', '),
        locationAr: [p.District__c, p.City__c, p.Province_Region__c]
          .map((v) => (typeof v === 'string' ? v.trim() : v))
          .filter((v) => Boolean(v))
          .join(', '),
        coverImageUrl: media.heroUrl || media.defaultUrl || p.Hero_Image_URL__c || p.Logo_URL__c || '',
        featuredVideoUrl: media.videoUrl || '',
        status: 'Active',
        mapCentroidLat,
        mapCentroidLng,
        mapGeometryJson,
        showOnMap,
        description,
        descriptionAr,
        projectLocationUrl: (p.Project_Location__c || '').trim()
          ? normalizeUrl((p.Project_Location__c as string).trim())
          : undefined,
        officeLocationUrl: (p.Office_Location__c || '').trim()
          ? normalizeUrl((p.Office_Location__c as string).trim())
          : undefined,
        logoUrl: resolveProjectLogoUrl(media, p.Logo_URL__c),
        topPlanUrl: media.topPlanUrl,
        brochureUrl: media.brochureUrl,
        gallery: media.gallery,
        modelFiles,
        nearbyLocations,
        notes,
        attachments,
        landArea: toFiniteNumber(p.Total_Area__c),
        leasableArea: toFiniteNumber(p.Leasable_Area__c),
        completionYear: toFiniteNumber(p.Completion_Year__c),
        projectValue: toFiniteNumber(p.Project_Value__c),
        phases: [],
        hasAvailability: availableUnitsCount > 0,
        availablePhasesCount: availableUnitsCount,
        nameEn: p.Name,
        locationEn: [p.District__c, p.City__c, p.Province_Region__c]
          .map((v) => (typeof v === 'string' ? v.trim() : v))
          .filter((v) => Boolean(v))
          .join(', '),
      },
    }
  } catch (error) {
    console.error('[Project] ❌ Failed to load project from Salesforce:', error)
    return {
      success: false,
      error: 'Failed to load project from Salesforce',
    }
  }
}

const HOME_PAGE_PWA_FIELDS = [
  'Id',
  'Name',
  'Content_URL__c',
  'Type__c',
  'Location__c',
  'Meta_keywords__c',
  'Aspect_Ratio__c',
  'Title_English__c',
  'Title_Arabic__c',
  'Subtitle_English__c',
  'Subtitle_Arabic__c',
  'Body_English__c',
  'Body_Arabic__c',
  'Link_URL__c',
  'Value_Number__c',
  'Suffix__c',
].join(', ')

const HOME_PAGE_PWA_SOQL = `SELECT ${HOME_PAGE_PWA_FIELDS}
  FROM PWA_Content__c 
  WHERE Location__c LIKE 'Homepage%' 
  ORDER BY CreatedDate DESC`

/** Used until custom plain-text fields are added on PWA_Content__c */
const HOME_PAGE_PWA_SOQL_LEGACY = `SELECT Id, Name, Content_URL__c, Type__c, Location__c, Meta_keywords__c, Aspect_Ratio__c
  FROM PWA_Content__c 
  WHERE Location__c LIKE 'Homepage%' 
  ORDER BY CreatedDate DESC`

let homePageContentCache: { data: HomePageContent; fetchedAt: number } | null = null
const HOME_PAGE_CONTENT_CACHE_MS = 5 * 60 * 1000

async function queryHomePagePwaRecords(): Promise<PWAContent[]> {
  try {
    const result = await salesforceQuery<PWAContent>(HOME_PAGE_PWA_SOQL)
    return result.records || []
  } catch (extendedFieldError) {
    console.warn(
      '[HomePageContent] Extended fields query failed, retrying with legacy fields:',
      extendedFieldError
    )
    const legacy = await salesforceQuery<PWAContent>(HOME_PAGE_PWA_SOQL_LEGACY)
    return legacy.records || []
  }
}

export async function getHomePageContent(): Promise<HomePageContent> {
  if (
    homePageContentCache &&
    Date.now() - homePageContentCache.fetchedAt < HOME_PAGE_CONTENT_CACHE_MS
  ) {
    return homePageContentCache.data
  }

  try {
    const records = await queryHomePagePwaRecords()
    const data = buildHomePageContent(records as PWAContent[])
    homePageContentCache = { data, fetchedAt: Date.now() }
    return data
  } catch (error) {
    console.error('[HomePageContent] Failed to load from Salesforce:', error)
    return HOME_PAGE_FALLBACKS
  }
}

const ABOUT_PAGE_PWA_SOQL = `SELECT ${HOME_PAGE_PWA_FIELDS}
  FROM PWA_Content__c
  WHERE Location__c LIKE 'About%'
  ORDER BY Value_Number__c ASC, CreatedDate DESC`

const ABOUT_PAGE_PWA_SOQL_LEGACY = `SELECT Id, Name, Content_URL__c, Type__c, Location__c, Meta_keywords__c, Aspect_Ratio__c
  FROM PWA_Content__c
  WHERE Location__c LIKE 'About%'
  ORDER BY CreatedDate DESC`

let aboutPageContentCache: { data: AboutPageContent; fetchedAt: number } | null = null
const ABOUT_PAGE_CONTENT_CACHE_MS = 5 * 60 * 1000

async function queryAboutPagePwaRecords(): Promise<PWAContent[]> {
  try {
    const result = await salesforceQuery<PWAContent>(ABOUT_PAGE_PWA_SOQL)
    return result.records || []
  } catch (extendedFieldError) {
    console.warn(
      '[AboutPageContent] Extended fields query failed, retrying with legacy fields:',
      extendedFieldError
    )
    const legacy = await salesforceQuery<PWAContent>(ABOUT_PAGE_PWA_SOQL_LEGACY)
    return legacy.records || []
  }
}

export async function getAboutPageContent(): Promise<AboutPageContent> {
  if (
    aboutPageContentCache &&
    Date.now() - aboutPageContentCache.fetchedAt < ABOUT_PAGE_CONTENT_CACHE_MS
  ) {
    return aboutPageContentCache.data
  }

  try {
    const records = await queryAboutPagePwaRecords()
    const data = buildAboutPageContent(records as PWAContent[])
    aboutPageContentCache = { data, fetchedAt: Date.now() }
    return data
  } catch (error) {
    console.error('[AboutPageContent] Failed to load from Salesforce:', error)
    return ABOUT_PAGE_FALLBACKS
  }
}

const ACHIEVEMENTS_PAGE_PWA_SOQL = `SELECT ${HOME_PAGE_PWA_FIELDS}
  FROM PWA_Content__c
  WHERE Location__c LIKE 'Achievements%'
  ORDER BY Value_Number__c ASC, CreatedDate DESC`

const ACHIEVEMENTS_PAGE_PWA_SOQL_LEGACY = `SELECT Id, Name, Content_URL__c, Type__c, Location__c, Meta_keywords__c, Aspect_Ratio__c
  FROM PWA_Content__c
  WHERE Location__c LIKE 'Achievements%'
  ORDER BY CreatedDate DESC`

let achievementsPageContentCache: { data: AchievementsPageContent; fetchedAt: number } | null = null
const ACHIEVEMENTS_PAGE_CONTENT_CACHE_MS = 5 * 60 * 1000

async function queryAchievementsPagePwaRecords(): Promise<PWAContent[]> {
  try {
    const result = await salesforceQuery<PWAContent>(ACHIEVEMENTS_PAGE_PWA_SOQL)
    return result.records || []
  } catch (extendedFieldError) {
    console.warn(
      '[AchievementsPageContent] Extended fields query failed, retrying with legacy fields:',
      extendedFieldError
    )
    const legacy = await salesforceQuery<PWAContent>(ACHIEVEMENTS_PAGE_PWA_SOQL_LEGACY)
    return legacy.records || []
  }
}

export async function getAchievementsPageContent(): Promise<AchievementsPageContent> {
  if (
    achievementsPageContentCache &&
    Date.now() - achievementsPageContentCache.fetchedAt < ACHIEVEMENTS_PAGE_CONTENT_CACHE_MS
  ) {
    return achievementsPageContentCache.data
  }

  try {
    const records = await queryAchievementsPagePwaRecords()
    const data = buildAchievementsPageContent(records as PWAContent[])
    achievementsPageContentCache = { data, fetchedAt: Date.now() }
    return data
  } catch (error) {
    console.error('[AchievementsPageContent] Failed to load from Salesforce:', error)
    return ACHIEVEMENTS_PAGE_FALLBACKS
  }
}

const SITE_PWA_SOQL = `SELECT ${HOME_PAGE_PWA_FIELDS}
  FROM PWA_Content__c
  WHERE Location__c LIKE 'Site%'
  ORDER BY Value_Number__c ASC, CreatedDate DESC`

const SITE_PWA_SOQL_LEGACY = `SELECT Id, Name, Content_URL__c, Type__c, Location__c, Meta_keywords__c, Aspect_Ratio__c
  FROM PWA_Content__c
  WHERE Location__c LIKE 'Site%'
  ORDER BY CreatedDate DESC`

let siteContentCache: { data: SiteContent; fetchedAt: number } | null = null
const SITE_CONTENT_CACHE_MS = 5 * 60 * 1000

async function querySitePwaRecords(): Promise<PWAContent[]> {
  try {
    const result = await salesforceQuery<PWAContent>(SITE_PWA_SOQL)
    return result.records || []
  } catch (extendedFieldError) {
    console.warn(
      '[SiteContent] Extended fields query failed, retrying with legacy fields:',
      extendedFieldError
    )
    const legacy = await salesforceQuery<PWAContent>(SITE_PWA_SOQL_LEGACY)
    return legacy.records || []
  }
}

export async function getSiteContent(): Promise<SiteContent> {
  if (siteContentCache && Date.now() - siteContentCache.fetchedAt < SITE_CONTENT_CACHE_MS) {
    return siteContentCache.data
  }

  try {
    const records = await querySitePwaRecords()
    const data = buildSiteContent(records as PWAContent[])
    siteContentCache = { data, fetchedAt: Date.now() }
    return data
  } catch (error) {
    console.error('[SiteContent] Failed to load from Salesforce:', error)
    return SITE_CONTENT_FALLBACKS
  }
}

export async function getFeaturedVideo() {
  try {
    const content = await getHomePageContent()
    const video = content.hero.video
    return {
      success: true,
      data: video ?? {
        projectId: '',
        projectName: '',
        projectNameAr: '',
        videoUrl: '',
        coverImageUrl: '',
        aspectRatio: undefined,
      },
    } as ApiResponse<{
      projectId: string
      projectName: string
      projectNameAr: string
      videoUrl: string
      coverImageUrl: string
      aspectRatio?: number
    }>
  } catch (error) {
    console.error('[Hero Video] ERROR:', error)
    return {
      success: true,
      data: {
        projectId: '',
        projectName: '',
        projectNameAr: '',
        videoUrl: '',
        coverImageUrl: '',
        aspectRatio: undefined,
      },
    }
  }
}

// Units
function parseEligibleForSubsidies(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const v = value.toLowerCase().trim()
    return v === 'yes' || v === 'true' || v === 'eligible' || v === '1'
  }
  return !!value
}

function mapSalesforceUnit(sfUnit: SalesforceUnitDTO & { Model__c?: string }): Unit {
  return {
    id: sfUnit.id,
    projectId: sfUnit.project?.id || '',
    phaseId: sfUnit.phase?.id || '',
    unitNumber: sfUnit.name,
    model: sfUnit.model ?? sfUnit.Model__c,
    externalId: sfUnit.externalId,
    price: sfUnit.price,
    finalPrice: sfUnit.finalPrice,
    status: sfUnit.status as Unit['status'],
    bedrooms: sfUnit.numberOfBedrooms,
    bathrooms: sfUnit.numberOfBathrooms,
    area: sfUnit.totalArea,
    bua: sfUnit.bua,
    floor: sfUnit.floor,
    finishing: sfUnit.finishing,
    usageType: sfUnit.usageType,
    unitType: sfUnit.unitType,
    view: sfUnit.view,
    hasGarden: sfUnit.hasGarden,
    hasLand: sfUnit.hasLand,
    hasRoof: sfUnit.hasRoof,
    hasOutdoor: sfUnit.hasOutdoor,
    gardenArea: sfUnit.gardenArea,
    landArea: sfUnit.landArea,
    roofArea: sfUnit.roofArea,
    outdoorArea: sfUnit.outdoorArea,
    eligibleForSubsidies: parseEligibleForSubsidies(sfUnit.eligibleForSubsidies),
    subsidies: sfUnit.subsidies,
    images: sfUnit.images,
    unitImage: sfUnit.unitImage,
    projectName: sfUnit.project?.name,
    propertyType: sfUnit.project?.projectType,
    phaseName: sfUnit.phase?.name,
    buildingName: sfUnit.building?.name,
    blockName: sfUnit.block?.name,
    notes: sfUnit.notes,
  }
}

export async function searchUnits(filters?: UnitFilters) {
  console.log('[Units] Searching units from Salesforce...', filters)

  const subsidiesFilter = filters?.eligibleForSubsidies

  const availableOnlyFilters: UnitFilters = {
    ...(filters || {}),
    status: 'Available',
    phaseId: undefined,
    projectType: undefined,
  }
  if (subsidiesFilter === true) {
    availableOnlyFilters.eligibleForSubsidies = true
  } else if (subsidiesFilter === false) {
    availableOnlyFilters.eligibleForSubsidies = false
  } else {
    delete availableOnlyFilters.eligibleForSubsidies
  }

  try {
    const result = await salesforceFetchUnits(availableOnlyFilters as Record<string, unknown>)

    if (result.success && result.data) {
      const rawUnits = result.data.units || []
      let mappedUnits = rawUnits.map(mapSalesforceUnit)
      if (subsidiesFilter === true) {
        mappedUnits = mappedUnits.filter((unit) => unit.eligibleForSubsidies === true)
      } else if (subsidiesFilter === false) {
        mappedUnits = mappedUnits.filter((unit) => unit.eligibleForSubsidies !== true)
      }
      console.log('[Units] ✅ Loaded from Salesforce:', mappedUnits.length)
      return {
        success: true,
        data: mappedUnits,
        pagination: result.data.pagination,
        totalCount: result.data.pagination?.totalCount ?? mappedUnits.length,
      }
    }
  } catch (error) {
    console.error('[Units] ❌ Failed to load from Salesforce:', error)
    return {
      success: false,
      error: 'Failed to load units from Salesforce',
    }
  }
  return {
    success: true,
    data: [],
    totalCount: 0,
  }
}

export async function getUnit(id: string) {
  console.log('[Units] Fetching unit details from Salesforce:', id)

  try {
    // Fetch unit by Id using SOQL via salesforce-query Netlify function
    const soql = `SELECT Id, Name,
      External_ID__c, Status__c, Price__c, Final_Price__c,
      Number_of_Bedrooms__c, Number_of_Bathrooms__c, Total_Area__c, BUA__c, Floor__c,
      Finishing__c, Usage_Type__c, View__c,
      Has_Garden__c, Has_Land__c, Has_Roof__c, Has_Outdoor__c,
      Garden_Area__c, Land_Area__c, Roof_Area__c, Outdoor_Area__c,
      Eligible_for_Subsidies__c, Subsidies__c,
      Unit_Image__c, X3D_Warehouse_iframe__c, Model__c,
      Project__c,
      Phase__c,
      Block__c,
      Building__c
      FROM Unit__c WHERE Id = '${id}' LIMIT 1`

    type SalesforceUnitRecord = {
      Id: string
      Name: string
      External_ID__c?: string
      Status__c?: string
      Price__c?: number
      Final_Price__c?: number
      Number_of_Bedrooms__c?: number
      Number_of_Bathrooms__c?: number
      Total_Area__c?: number
      BUA__c?: number
      Floor__c?: number
      Finishing__c?: string
      Usage_Type__c?: string
      View__c?: string
      Has_Garden__c?: boolean
      Has_Land__c?: boolean
      Has_Roof__c?: boolean
      Has_Outdoor__c?: boolean
      Garden_Area__c?: number
      Land_Area__c?: number
      Roof_Area__c?: number
      Outdoor_Area__c?: number
      Eligible_for_Subsidies__c?: string
      Subsidies__c?: number
      Unit_Image__c?: string
      X3D_Warehouse_iframe__c?: string
      Model__c?: string
      Project__c?: string
      Phase__c?: string
      Block__c?: string
      Building__c?: string
    }

    const result = await salesforceQuery<SalesforceUnitRecord>(soql)
    const record = result.records?.[0]
    if (!record) return { success: false, error: 'Unit not found' }

    const resolvedProjectId = extractSalesforceIdFromAnchor(record.Project__c) || record.Project__c || ''

    /** Load project labels separately — avoids fragile Unit SOQL relationship subqueries */
    let projectNameFromSf: string | undefined
    let projectProvinceRegionFromSf: string | undefined
    let projectCityFromSf: string | undefined
    if (resolvedProjectId) {
      try {
        const esc = resolvedProjectId.replace(/'/g, "\\'")
        const projectSoql = `SELECT Id, Name, City__c, Province_Region__c FROM Project__c WHERE Id = '${esc}' LIMIT 1`
        type SfProjectLite = {
          Id: string
          Name?: string
          City__c?: string
          Province_Region__c?: string
        }
        const pr = await salesforceQuery<SfProjectLite>(projectSoql)
        const prow = pr.records?.[0]
        if (prow) {
          projectNameFromSf = prow.Name?.trim()
          projectCityFromSf = prow.City__c?.trim()
          projectProvinceRegionFromSf = prow.Province_Region__c?.trim()
        }
      } catch (e) {
        console.warn('[Units] Optional Project__c lookup failed (unit still returned):', e)
      }
    }

    const embed = record.X3D_Warehouse_iframe__c || ''
    const embedSrcMatch = embed.match(/src=["']([^"']+)["']/i)
    const embedSrc = embedSrcMatch?.[1]

    const eligible =
      (record.Eligible_for_Subsidies__c || '').toLowerCase() === 'yes' ||
      (record.Eligible_for_Subsidies__c || '').toLowerCase() === 'true' ||
      (record.Eligible_for_Subsidies__c || '').toLowerCase() === 'eligible'

    const unit: Unit = {
      id: record.Id,
      projectId: resolvedProjectId,
      phaseId: extractSalesforceIdFromAnchor(record.Phase__c) || record.Phase__c || '',
      unitNumber: record.Name,
      model: record.Model__c?.trim() || undefined,
      externalId: record.External_ID__c,
      price: record.Price__c || 0,
      finalPrice: record.Final_Price__c || undefined,
      status: (record.Status__c as Unit['status']) || 'Available',
      bedrooms: record.Number_of_Bedrooms__c || 0,
      bathrooms: record.Number_of_Bathrooms__c || undefined,
      area: record.Total_Area__c || 0,
      bua: record.BUA__c || undefined,
      floor: record.Floor__c || undefined,
      finishing: record.Finishing__c || undefined,
      usageType: record.Usage_Type__c || undefined,
      view: record.View__c || undefined,
      hasGarden: record.Has_Garden__c || false,
      hasLand: record.Has_Land__c || false,
      hasRoof: record.Has_Roof__c || false,
      hasOutdoor: record.Has_Outdoor__c || false,
      gardenArea: record.Garden_Area__c || undefined,
      landArea: record.Land_Area__c || undefined,
      roofArea: record.Roof_Area__c || undefined,
      outdoorArea: record.Outdoor_Area__c || undefined,
      eligibleForSubsidies: eligible,
      subsidies: record.Subsidies__c ? String(record.Subsidies__c) : undefined,
      deliveryDate: undefined,
      images: record.Unit_Image__c ? [record.Unit_Image__c] : [],
      unitImage: record.Unit_Image__c || undefined,
      floorPlan: undefined,
      sketchupEmbedUrl: embedSrc || undefined,
      amenities: undefined,
      description: undefined,
      descriptionAr: undefined,
      projectName: projectNameFromSf,
      projectNameAr: projectNameFromSf,
      projectProvinceRegion: projectProvinceRegionFromSf,
      projectCity: projectCityFromSf,
      phaseName: record.Phase__c || undefined,
      phaseNameAr: undefined,
      buildingName: undefined,
      blockName: record.Block__c || undefined,
      notes: undefined,
      paymentProgress: undefined,
      paymentStatus: undefined,
    }

    let relatedUnits: Unit[] = []
    if (unit.projectId) {
      const relatedSoql = `SELECT Id, Name, Unit_Image__c, Price__c, Final_Price__c, Eligible_for_Subsidies__c, Subsidies__c, Status__c,
        Number_of_Bedrooms__c, Number_of_Bathrooms__c, Total_Area__c, BUA__c, Floor__c
        FROM Unit__c
        WHERE Project__c = '${unit.projectId}' AND Id != '${id}'
        ORDER BY LastModifiedDate DESC
        LIMIT 4`
      const relatedResult = await salesforceQuery<{
        Id: string
        Name: string
        Unit_Image__c?: string
        Price__c?: number
        Final_Price__c?: number
        Eligible_for_Subsidies__c?: string
        Subsidies__c?: number
        Status__c?: string
        Number_of_Bedrooms__c?: number
        Number_of_Bathrooms__c?: number
        Total_Area__c?: number
        BUA__c?: number
        Floor__c?: number
      }>(relatedSoql)

      relatedUnits = (relatedResult.records || [])
        .map((r) => ({
          id: r.Id,
          projectId: unit.projectId,
          phaseId: '',
          unitNumber: r.Name,
          externalId: undefined,
          price: r.Price__c || 0,
          finalPrice: r.Final_Price__c || undefined,
          eligibleForSubsidies: parseEligibleForSubsidies(r.Eligible_for_Subsidies__c),
          subsidies: r.Subsidies__c ? String(r.Subsidies__c) : undefined,
          status: (r.Status__c as Unit['status']) || 'Available',
          bedrooms: r.Number_of_Bedrooms__c || 0,
          bathrooms: r.Number_of_Bathrooms__c || undefined,
          area: r.Total_Area__c || 0,
          bua: r.BUA__c || undefined,
          floor: r.Floor__c || undefined,
          images: r.Unit_Image__c ? [r.Unit_Image__c] : [],
          unitImage: r.Unit_Image__c || undefined,
          notes: undefined,
        }))
        .slice(0, 3)
    }

    let modelFile: ProjectModelFile | null = null
    if (resolvedProjectId && unit.model) {
      try {
        const { attachments: projectAttachments } = await getProjectNotesAndAttachments(resolvedProjectId)
        const projectModelFiles = extractProjectModelFiles(projectAttachments)
        modelFile = findProjectModelFile(projectModelFiles, unit.model)
      } catch (e) {
        console.warn('[Units] Optional project model file lookup failed:', e)
      }
    }

    return {
      success: true,
      data: {
        unit,
        relatedUnits,
        modelFile,
      },
    }
  } catch (error) {
    console.error('[Units] ❌ Failed to load unit from Salesforce:', error)
    return {
      success: false,
      error: 'Failed to load unit from Salesforce',
    }
  }

  return {
    success: false,
    error: 'Unit not found',
  }
}

export type CreateLeadOptions = {
  supplierPdf?: File
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file'))
        return
      }
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// Leads (Salesforce via Netlify Function)
export async function createLead(
  data: Omit<Lead, 'id' | 'createdAt' | 'source'>,
  options?: CreateLeadOptions
): Promise<ApiResponse<Lead>> {
  try {
    const payload: Record<string, unknown> = { ...data, source: 'PWA' }

    if (data.profile === 'Supplier' && options?.supplierPdf) {
      payload.supplierAttachment = {
        fileName: options.supplierPdf.name,
        contentType: options.supplierPdf.type || 'application/pdf',
        base64: await fileToBase64(options.supplierPdf),
      }
    }

    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return { success: false, error: 'Lead submission is unavailable' }
    }

    const result = (await response.json()) as ApiResponse<Lead>
    if (!response.ok && result.success !== true) {
      return {
        success: false,
        error: result.error || 'Failed to submit registration',
      }
    }
    return result
  } catch (error) {
    console.error('[Leads] createLead error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit registration',
    }
  }
}

// Auth
export async function login(username: string, password: string) {
  // Session-based login (cookie set by Netlify Function)
  return fetcher<{ user: AuthUser }>('/api/auth-login', {
    method: 'POST',
    body: JSON.stringify({ email: username, password }),
  })
}

export async function getCurrentUser() {
  return fetcher<AuthUser | null>('/api/auth-me')
}

export async function logout() {
  return fetcher<void>('/api/auth-logout', { method: 'POST' })
}

// My Opportunities + Units (session-based)
export type MyOpportunity = {
  id: string
  name: string
  stageName?: string
  closeDate?: string | null
  amount?: number | null
  units: Unit[]
}

export async function getMyOpportunities() {
  return fetcher<MyOpportunity[]>('/api/my-opportunities')
}

// Cases (owner requests — session cookie auth via Netlify Function)
async function casesFetcher<T>(
  method: 'GET' | 'POST',
  body?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch('/api/cases', {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      return { success: false, error: 'Requests service is unavailable' }
    }

    const result = (await response.json()) as ApiResponse<T>
    if (!response.ok && result.success !== true) {
      return {
        success: false,
        error: result.error || 'Request failed',
      }
    }
    return result
  } catch (error) {
    console.error('[Cases] request error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
    }
  }
}

export async function getCases() {
  return casesFetcher<Case[]>('GET')
}

export async function createCase(data: {
  unitId?: string
  projectName?: string
  subject: string
  category: string
  description: string
}) {
  return casesFetcher<Case>('POST', data)
}

/**
 * Fetch Google Maps iframe URL from Salesforce PWA Content
 * Location: 'HQ Office'
 * Type: 'iframe element url'
 */
export async function getOfficeMapUrl(): Promise<{ mapUrl: string | null; metaKeywords?: string }> {
  console.log('[Office Map] Starting to fetch office map iframe URL via Netlify Function...')

  try {
    const soql = `SELECT Id, Name, Content_URL__c, Type__c, Location__c, Meta_keywords__c 
                  FROM PWA_Content__c 
                  WHERE Location__c = 'HQ Office' 
                  AND Type__c = 'iframe element url' 
                  ORDER BY CreatedDate DESC 
                  LIMIT 1`

    console.log('[Office Map] Querying Salesforce for office map record via Netlify Function...')
    const result = await salesforceQuery<PWAContent>(soql)

    if (result.records && result.records.length > 0) {
      const content = result.records[0]
      // Get URL exactly as stored, ensuring no double encoding
      let mapUrl = (content.Content_URL__c || '').trim()
      const metaKeywords = content.Meta_keywords__c || undefined

      // Ensure URL is properly formatted (no extra encoding)
      if (mapUrl) {
        // Decode if it's double-encoded, then use as-is
        try {
          const decoded = decodeURIComponent(mapUrl)
          // Only use decoded if it's different and still a valid URL
          if (decoded !== mapUrl && decoded.includes('google.com/maps/embed')) {
            mapUrl = decoded
          }
        } catch {
          // If decoding fails, use original URL - it's already correct
        }
      }

      if (mapUrl) {
        // Validate Google Maps embed URL
        const isGoogleMapsEmbed = mapUrl.includes('google.com/maps/embed')

        if (isGoogleMapsEmbed) {
          // Check if URL has a 'pb' parameter and if it appears complete
          const pbMatch = mapUrl.match(/[?&]pb=([^&]*)/)
          if (pbMatch) {
            const pbValue = pbMatch[1]
            // Google Maps pb parameters typically end with specific patterns
            // If it seems truncated (doesn't end properly), log a warning
            if (pbValue.length < 50 || !pbValue.includes('!')) {
              console.warn('[Office Map] ⚠️ Google Maps pb parameter appears truncated:', {
                pbLength: pbValue.length,
                urlLength: mapUrl.length,
              })
            }
          }

          // Ensure URL is properly encoded
          try {
            // Validate URL format
            new URL(mapUrl)
          } catch (urlError) {
            console.error('[Office Map] ❌ Invalid URL format:', urlError)
            return { mapUrl: null, metaKeywords }
          }
        }

        console.log('[Office Map] ✅ Found Salesforce record with map URL:', {
          id: content.Id,
          name: content.Name,
          location: content.Location__c,
          urlLength: mapUrl.length,
          isGoogleMapsEmbed,
          mapUrlPreview: mapUrl.substring(0, 150) + (mapUrl.length > 150 ? '...' : ''),
          metaKeywords,
        })
        return { mapUrl, metaKeywords }
      } else {
        console.warn('[Office Map] ⚠️ No map URL in Salesforce record')
        return { mapUrl: null, metaKeywords }
      }
    } else {
      console.warn('[Office Map] ⚠️ No records found in Salesforce query result')
      return { mapUrl: null }
    }
  } catch (error) {
    console.error('[Office Map] ❌ ERROR fetching from Salesforce:', error)
    return { mapUrl: null }
  }
}

export interface OfficeLocationRecord {
  id: string
  name: string
  url: string
  coords?: string
  dirUrl: string
}

// Office_Location__c is entered by hand in the Admin Console, so it may be
// missing a scheme ("maps.app.goo.gl/...") or have a typo'd one ("htpps://").
// Normalize any leading scheme (or none) to https:// so links render.
function normalizeUrl(raw: string): string {
  const schemeMatch = raw.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)
  return schemeMatch ? `https://${raw.slice(schemeMatch[0].length)}` : `https://${raw}`
}

/**
 * Fetch per-project office locations from Salesforce.
 * Source: Project__c.Office_Location__c (URL set in the Admin Console).
 * Coordinates come from the project map centroid when available.
 */
export async function getOfficeLocations(): Promise<OfficeLocationRecord[]> {
  try {
    // Office_Location__c is a Long Text Area (holds full Google embed URLs), which
    // can't be used in a SOQL WHERE clause — so fetch all and filter in JS below.
    const soql = `SELECT Id, Name, Office_Location__c, Map_Centroid_Lat__c, Map_Centroid_Lng__c
                  FROM Project__c
                  ORDER BY Name`
    const result = await salesforceQuery<SalesforceProjectRecord>(soql)
    if (!result.records || result.records.length === 0) return []

    return result.records
      .filter((p) => (p.Office_Location__c || '').trim().length > 0)
      .map((p) => {
        const url = normalizeUrl((p.Office_Location__c as string).trim())
        const hasCoords =
          typeof p.Map_Centroid_Lat__c === 'number' && typeof p.Map_Centroid_Lng__c === 'number'
        const coords = hasCoords ? `${p.Map_Centroid_Lat__c},${p.Map_Centroid_Lng__c}` : undefined
        return {
          id: p.Id,
          name: p.Name,
          url,
          coords,
          dirUrl: coords
            ? `https://www.google.com/maps/dir/?api=1&destination=${coords}`
            : url,
        }
      })
  } catch (error) {
    console.error('[Office Locations] Failed to fetch from Salesforce:', error)
    return []
  }
}

export async function getNewsArticles(filters: Record<string, unknown> = {}) {
  return salesforceFetchNewsArticles(filters);
}

export async function getNewsArticle(id: string) {
  return salesforceFetchNewsArticleDetail(id);
}
