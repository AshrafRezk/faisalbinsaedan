/**
 * Salesforce API Client
 * Uses Netlify Functions for server-side authentication and API calls
 * Secrets are kept server-side and never exposed to the client
 */

interface SalesforceQueryResult<T> {
  success: boolean
  records: T[]
  totalSize?: number
  error?: string
}

function extractSalesforceIdFromAnchor(value?: string): string {
  if (!value) return ''
  // Example: <a href="/a0AOm00000IFO33" target="_blank">Phase 1</a>
  const m = value.match(/href=["']\/([a-zA-Z0-9]{15,18})["']/i)
  return m?.[1] || ''
}

interface SalesforceCreateResult {
  success: boolean
  id: string
  error?: string
}

export interface SalesforceUnitDTO {
  id: string;
  name: string;
  model?: string;
  externalId: string;
  status: string;
  price: number;
  finalPrice: number;
  currencyCode: string;
  unitImage: string;
  images: string[];
  notes: unknown[];
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  totalArea: number;
  bua: number;
  floor: number;
  finishing: string;
  usageType: string;
  view: string;
  hasGarden: boolean;
  hasLand: boolean;
  hasRoof: boolean;
  hasOutdoor: boolean;
  gardenArea: number;
  landArea: number;
  roofArea: number;
  outdoorArea: number;
  eligibleForSubsidies: boolean;
  subsidies: string;
  project?: {
    id: string;
    name: string;
    city: string;
    province: string;
    projectType?: string;
  };
  phase?: {
    id: string;
    name: string;
  };
  building?: {
    id: string;
    name: string;
  };
  block?: {
    id: string;
    name: string;
  };
}

export interface SalesforceUnitSearchResponse {
  success: boolean;
  data: {
    units: SalesforceUnitDTO[];
    pagination: {
      page: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
  message: string | null;
  errorCode?: string;
}

/**
 * Query Salesforce using SOQL via Netlify Function
 */
export async function salesforceQuery<T>(soql: string): Promise<{ records: T[]; totalSize?: number }> {
  console.log('[Salesforce Query] Executing SOQL via Netlify Function:', soql)

  try {
    const response = await fetch('/.netlify/functions/salesforce-query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ soql }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[Salesforce Query] ❌ FAILED:', response.status, errorData)
      throw new Error(`Salesforce query failed: ${errorData.error || response.statusText}`)
    }

    const result: SalesforceQueryResult<T> = await response.json()

    if (!result.success) {
      console.error('[Salesforce Query] ❌ FAILED:', result.error)
      throw new Error(result.error || 'Salesforce query failed')
    }

    console.log('[Salesforce Query] ✅ SUCCESS:', {
      recordCount: result.records?.length || 0,
    })

    return {
      records: result.records || [],
      totalSize: result.totalSize,
    }
  } catch (error) {
    console.error('[Salesforce Query] ❌ ERROR:', error)
    throw error
  }
}

/**
 * Create a record in Salesforce via Netlify Function
 */
export async function salesforceCreate(
  objectName: string,
  data: Record<string, unknown>
): Promise<{ id: string; success: boolean }> {
  console.log(`[Salesforce Create] Creating record in ${objectName} via Netlify Function:`, data)

  try {
    const response = await fetch('/.netlify/functions/salesforce-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ objectName, data }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[Salesforce Create] ❌ FAILED:', response.status, errorData)
      throw new Error(`Salesforce create failed: ${errorData.error || response.statusText}`)
    }

    const result: SalesforceCreateResult = await response.json()

    if (!result.success) {
      console.error('[Salesforce Create] ❌ FAILED:', result.error)
      throw new Error(result.error || 'Salesforce create failed')
    }

    console.log(`[Salesforce Create] ✅ SUCCESS: Record created with ID ${result.id}`)

    return {
      id: result.id,
      success: true,
    }
  } catch (error) {
    console.error(`[Salesforce Create] ❌ ERROR for ${objectName}:`, error)
    throw error
  }
}

/**
 * Update a record in Salesforce via Netlify Function
 * Note: This requires a separate function or can be added to salesforce-create
 */
export async function salesforceUpdate(
  objectName: string,
  recordId: string,
  data: Record<string, unknown>
): Promise<void> {
  console.log(`[Salesforce Update] Updating record ${recordId} in ${objectName} via Netlify Function:`, data)

  // For now, we'll use the create function pattern
  // In production, you might want to create a separate salesforce-update function
  // This is a placeholder that throws an error - implement if needed
  throw new Error('salesforceUpdate not yet implemented via Netlify Functions')
}

/**
 * Fetch units from Salesforce via Netlify Function
 */
export async function salesforceFetchUnits(filters: Record<string, unknown> = {}): Promise<SalesforceUnitSearchResponse> {
  console.log('[Salesforce Units] Fetching units with filters:', filters)

  try {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      if (value === false) return
      params.append(key, String(value))
    })

    const query = params.toString() ? `?${params.toString()}` : ''
    const response = await fetch(`/.netlify/functions/salesforce-units${query}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[Salesforce Units] ❌ FAILED:', response.status, errorData)
      throw new Error(`Salesforce units fetch failed: ${errorData.error || response.statusText}`)
    }

    const result: SalesforceUnitSearchResponse = await response.json()
    if (!result.success) {
      console.error('[Salesforce Units] ❌ FAILED:', result.errorCode, result.message)
      throw new Error(result.message || 'Salesforce units fetch failed')
    }

    return result
  } catch (error) {
    console.error('[Salesforce Units] ❌ ERROR:', error)
    throw error
  }
}

/**
 * Fetch News Articles from Salesforce via Netlify Function
 */
export async function salesforceFetchNewsArticles(filters: Record<string, unknown> = {}): Promise<any> {
  console.log('[Salesforce News] Fetching news with filters:', filters)

  try {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      params.append(key, String(value))
    })

    const query = params.toString() ? `?${params.toString()}` : ''
    const response = await fetch(`/.netlify/functions/salesforce-news${query}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[Salesforce News] ❌ FAILED:', response.status, errorData)
      throw new Error(`Salesforce news fetch failed: ${errorData.error || response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('[Salesforce News] ❌ ERROR:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch news articles' }
  }
}

/**
 * Fetch a specific News Article Detail from Salesforce via Netlify Function
 */
export async function salesforceFetchNewsArticleDetail(recordId: string): Promise<any> {
  console.log('[Salesforce News] Fetching news article:', recordId)

  try {
    const response = await fetch(`/.netlify/functions/salesforce-news?recordId=${encodeURIComponent(recordId)}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[Salesforce News] ❌ FAILED:', response.status, errorData)
      throw new Error(`Salesforce news detail fetch failed: ${errorData.error || response.statusText}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('[Salesforce News] ❌ ERROR:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch news article detail' }
  }
}
