import { pickId } from '../lib/sf-pick-id.cjs'

/**
 * Netlify Function: My Opportunities + related Units (SPA)
 *
 * Reads the logged-in contact from `fbs_session` cookie (signed JWT),
 * then queries Salesforce for Opportunities linked to that Contact and Units linked to those Opportunities.
 *
 * Relationship assumption:
 * - Contact ↔ Opportunity via OpportunityContactRole (ContactId) (or fallbacks)
 * - Opportunity has a lookup to Unit__c via Opportunity.Unit__c (and Unit__r)
 *
 * Env:
 * - SALESFORCE_CLIENT_ID / SALESFORCE_CLIENT_SECRET / SALESFORCE_TOKEN_URL / SALESFORCE_INSTANCE_URL
 * - SESSION_JWT_SECRET
 */

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

function parseCookies(cookieHeader) {
  const out = {}
  if (!cookieHeader) return out
  const parts = String(cookieHeader).split(';')
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=')
    if (!k) continue
    out[k] = rest.join('=')
  }
  return out
}

async function getSalesforceAccessToken() {
  const clientId = process.env.SALESFORCE_CLIENT_ID
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET
  const tokenUrl = process.env.SALESFORCE_TOKEN_URL
  const instanceUrl = process.env.SALESFORCE_INSTANCE_URL

  if (!clientId || !clientSecret || !tokenUrl) {
    throw new Error('Salesforce credentials not configured')
  }

  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    throw new Error(`Salesforce token request failed (${tokenResponse.status}): ${errorText}`)
  }

  const tokenData = await tokenResponse.json()
  const accessToken = tokenData.access_token
  const tokenInstanceUrl = tokenData.instance_url || instanceUrl

  if (!accessToken || !tokenInstanceUrl) {
    throw new Error('Invalid token response from Salesforce')
  }

  return { accessToken, instanceUrl: tokenInstanceUrl }
}

async function sfQuery(instanceUrl, accessToken, soql) {
  console.log('Salesforce SOQL:', soql)
  const url = `${instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  const text = await res.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  if (!res.ok) {
    const message = body?.[0]?.message || body?.message || text || 'Salesforce query failed'
    const err = new Error(message)
    err.statusCode = res.status
    err.details = body || text
    throw err
  }
  return body
}

function mapUnitRecord(r) {
  return {
    id: r.Id,
    projectId: r.Project__c || '',
    phaseId: r.Phase__c || '',
    unitNumber: r.Name,
    externalId: r.External_ID__c,
    price: Number(r.Price__c || 0),
    finalPrice: r.Final_Price__c ?? undefined,
    status: (r.Status__c || 'Available'),
    bedrooms: Number(r.Number_of_Bedrooms__c || 0),
    bathrooms: r.Number_of_Bathrooms__c ?? undefined,
    area: Number(r.Total_Area__c || 0),
    bua: r.BUA__c ?? undefined,
    floor: r.Floor__c ?? undefined,
    finishing: r.Finishing__c ?? undefined,
    usageType: r.Usage_Type__c ?? undefined,
    view: r.View__c ?? undefined,
    hasGarden: !!r.Has_Garden__c,
    hasLand: !!r.Has_Land__c,
    hasRoof: !!r.Has_Roof__c,
    hasOutdoor: !!r.Has_Outdoor__c,
    gardenArea: r.Garden_Area__c ?? undefined,
    landArea: r.Land_Area__c ?? undefined,
    roofArea: r.Roof_Area__c ?? undefined,
    outdoorArea: r.Outdoor_Area__c ?? undefined,
    eligibleForSubsidies: !!r.Eligible_for_Subsidies__c,
    subsidies: r.Subsidies__c ?? undefined,
    deliveryDate: undefined,
    images: r.Unit_Image__c ? [r.Unit_Image__c] : [],
    unitImage: r.Unit_Image__c ?? undefined,
    notes: undefined,
    paymentProgress: undefined,
    paymentStatus: undefined,
    // optional labels if present (when unit comes from Opportunity.Unit__r)
    projectName: r.Project__r?.Name ?? undefined,
    projectNameAr: r.Project__r?.Name ?? undefined,
    projectHeroImage: r.Project__r?.Hero_Image_URL__c ?? undefined,
    phaseName: undefined,
    phaseNameAr: undefined,
    buildingName: undefined,
    blockName: undefined,
  }
}

function unitFromOpportunity(opp) {
  const u = opp?.Unit__r
  if (!u || !u.Id) return null
  return mapUnitRecord(u)
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { success: false, error: 'Method not allowed' })
  }

  try {
    const sessionSecret = process.env.SESSION_JWT_SECRET
    if (!sessionSecret) return json(500, { success: false, error: 'SESSION_JWT_SECRET not configured' })

    const cookieHeader = event.headers?.cookie || event.headers?.Cookie || ''
    const cookies = parseCookies(cookieHeader)
    const raw = cookies.fbs_session
    if (!raw) return json(401, { success: false, error: 'Unauthorized' })

    const cookieJwt = decodeURIComponent(raw)
    const { jwtVerify } = await import('jose')
    const secretKey = new TextEncoder().encode(sessionSecret)
    const verified = await jwtVerify(cookieJwt, secretKey, { algorithms: ['HS256'] })
    const contactId = pickId(verified.payload?.sub)
    if (!contactId) return json(401, { success: false, error: 'Unauthorized' })

    const { accessToken, instanceUrl } = await getSalesforceAccessToken()

    // 1) Get AccountId related to Contact
    const contactSoql = `SELECT Id, AccountId FROM Contact WHERE Id = '${contactId}' LIMIT 1`
    const contactRes = await sfQuery(instanceUrl, accessToken, contactSoql)
    const accountId = pickId((contactRes.records || [])[0]?.AccountId)
    if (!accountId) {
      console.log('[my-opportunities] No AccountId found for contact, returning empty units.')
      return json(200, { success: true, data: [] })
    }

    // 2) Query Contract__c records connected to this person account (AccountId) via Account__c lookup
    const contractFields = [
      'Id',
      'Name',
      'Project__c',
      'Project__r.Name',
      'Project__r.Hero_Image_URL__c',
      'Unit__c',
      'Unit__r.Id',
      'Unit__r.Name',
      'Unit__r.Number_of_Bedrooms__c',
      'Unit__r.Number_of_Bathrooms__c',
      'Unit__r.Total_Area__c',
      'Unit__r.BUA__c',
      'Unit__r.Floor__c',
      'Unit__r.Finishing__c',
      'Unit__r.Usage_Type__c',
      'Unit__r.View__c',
      'Unit__r.Unit_Image__c',
      'Unit_Price__c',
      'Unit_Final_Price__c',
      'Unit_Usage_Type__c',
      'Unit_Cumulative_Progress_Percentage__c',
      'Building__c',
      'Block__c',
      'Phase__c',
      'Payment_Method__c',
    ].join(', ')

    const contractSoql = `SELECT ${contractFields}
      FROM Contract__c
      WHERE Account__c = '${accountId}'
      ORDER BY CreatedDate DESC
      LIMIT 50`

    console.log('[my-opportunities] Fetching units via Contract__c query...')
    const contractRes = await sfQuery(instanceUrl, accessToken, contractSoql)
    const contracts = contractRes.records || []
    console.log(`[my-opportunities] Found ${contracts.length} contracts for account ${accountId}`)

    // 3) Map Contract__c to standard Opportunity/Unit structures expected by the frontend
    const mappedOpportunities = contracts.map((c) => {
      const u = c.Unit__r || {}
      
      const mappedUnit = {
        id: u.Id || c.Unit__c || c.Id,
        projectId: c.Project__c || '',
        phaseId: '',
        unitNumber: u.Name || c.Unit__c || 'N/A',
        externalId: c.Name,
        price: Number(c.Unit_Price__c || u.Price__c || 0),
        finalPrice: c.Unit_Final_Price__c ? Number(c.Unit_Final_Price__c) : (u.Final_Price__c ?? undefined),
        status: 'Contracted', // active purchase
        bedrooms: Number(u.Number_of_Bedrooms__c || 0),
        bathrooms: u.Number_of_Bathrooms__c ?? undefined,
        area: Number(u.Total_Area__c || 0),
        bua: u.BUA__c ?? undefined,
        floor: u.Floor__c ?? undefined,
        finishing: u.Finishing__c ?? undefined,
        usageType: c.Unit_Usage_Type__c ?? u.Usage_Type__c ?? undefined,
        view: u.View__c ?? undefined,
        eligibleForSubsidies: !!u.Eligible_for_Subsidies__c,
        subsidies: u.Subsidies__c ?? undefined,
        deliveryDate: undefined,
        images: u.Unit_Image__c ? [u.Unit_Image__c] : [],
        unitImage: u.Unit_Image__c ?? undefined,
        projectHeroImage: c.Project__r?.Hero_Image_URL__c ?? undefined,
        paymentProgress: Number(c.Unit_Cumulative_Progress_Percentage__c || 0), // maps actual cumulative progress!
        paymentStatus: c.Payment_Method__c ?? undefined,
        projectName: c.Project__r?.Name ?? undefined,
        projectNameAr: c.Project__r?.Name ?? undefined,
        phaseName: c.Phase__c ?? undefined,
        phaseNameAr: c.Phase__c ?? undefined,
        buildingName: c.Building__c ?? undefined,
        blockName: c.Block__c ?? undefined,
      }

      return {
        id: c.Id,
        name: c.Project__r?.Name || 'Unit Contract',
        stageName: `${c.Name}`, // contract number (as displayed in screenshot)
        closeDate: null,
        amount: Number(c.Unit_Final_Price__c || c.Unit_Price__c || 0),
        units: [mappedUnit],
      }
    })

    return json(200, { success: true, data: mappedOpportunities })
  } catch (error) {
    console.error('[my-opportunities] error:', error)
    return json(500, { success: false, error: 'Internal server error' })
  }
}

