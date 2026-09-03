import { pickId, pickSfLookup } from '../lib/sf-pick-id.cjs'

/**
 * Netlify Function: Owner support requests (Salesforce Case)
 *
 * GET  — list cases for the logged-in Contact (fbs_session cookie)
 * POST — create a case linked to Contact + optional Unit__c
 *
 * Env:
 * - SALESFORCE_* credentials, SESSION_JWT_SECRET
 * - SALESFORCE_CASE_UNIT_FIELD (default Unit__c)
 * - SALESFORCE_CASE_CATEGORY_FIELD (default Type)
 * - SALESFORCE_CASE_MOBILE_FIELD (default Mobile_Number__c)
 * - SALESFORCE_CONTACT_MOBILE_FIELD (optional Contact field to prefer)
 * - SALESFORCE_CASE_ORIGIN (default PWA)
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
  for (const part of String(cookieHeader).split(';')) {
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
    throw err
  }
  return body
}

async function sfCreate(instanceUrl, accessToken, objectName, payload) {
  const createUrl = `${instanceUrl}/services/data/v59.0/sobjects/${objectName}`
  const res = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  let body
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  if (!res.ok) {
    const message = body?.[0]?.message || body?.message || text || 'Salesforce create failed'
    const err = new Error(message)
    err.statusCode = res.status
    err.details = body || text
    throw err
  }
  return body
}

async function verifySession(event) {
  const sessionSecret = process.env.SESSION_JWT_SECRET
  if (!sessionSecret) {
    const err = new Error('SESSION_JWT_SECRET not configured')
    err.statusCode = 500
    throw err
  }

  const cookieHeader = event.headers?.cookie || event.headers?.Cookie || ''
  const cookies = parseCookies(cookieHeader)
  const raw = cookies.fbs_session
  if (!raw) {
    const err = new Error('Unauthorized')
    err.statusCode = 401
    throw err
  }

  const cookieJwt = decodeURIComponent(raw)
  const { jwtVerify } = await import('jose')
  const secretKey = new TextEncoder().encode(sessionSecret)
  const verified = await jwtVerify(cookieJwt, secretKey, { algorithms: ['HS256'] })
  const contactId = pickId(verified.payload?.sub)
  if (!contactId) {
    const err = new Error('Unauthorized')
    err.statusCode = 401
    throw err
  }

  return contactId
}

async function getContactAccountOwner(instanceUrl, accessToken, contactId) {
  const soql = `SELECT AccountId, Account.OwnerId FROM Contact WHERE Id = '${contactId}' LIMIT 1`
  const res = await sfQuery(instanceUrl, accessToken, soql)
  const record = (res.records || [])[0]
  if (!record) return { accountId: '', ownerId: '' }
  return {
    accountId: pickId(record.AccountId),
    ownerId: pickId(record.Account?.OwnerId),
  }
}

async function getContactMobile(instanceUrl, accessToken, contactId) {
  const preferred = process.env.SALESFORCE_CONTACT_MOBILE_FIELD
  const fieldSets = [
    preferred ? [preferred, 'MobilePhone', 'Phone'] : null,
    ['MobilePhone', 'Phone', 'Mobile_Number__c'],
    ['MobilePhone', 'Phone'],
  ].filter(Boolean)

  for (const fields of fieldSets) {
    const unique = [...new Set(fields)]
    try {
      const soql = `SELECT ${unique.join(', ')} FROM Contact WHERE Id = '${contactId}' LIMIT 1`
      const res = await sfQuery(instanceUrl, accessToken, soql)
      const record = (res.records || [])[0]
      if (!record) return ''
      for (const field of unique) {
        const value = String(record[field] || '').trim()
        if (value) return value
      }
      return ''
    } catch {
      // Field may not exist in org — try next set
    }
  }

  return ''
}

function mapStatus(sfStatus) {
  const s = String(sfStatus || '').toLowerCase()
  if (s === 'new') return 'New'
  if (s.includes('progress') || s === 'working' || s === 'escalated' || s === 'on hold') {
    return 'InProgress'
  }
  if (s === 'closed') return 'Closed'
  if (s.includes('resolved') || s.includes('complete')) return 'Resolved'
  return 'New'
}

function mapCategory(record, categoryField) {
  const raw = record[categoryField] || record.Type || record.Reason || ''
  const allowed = ['Maintenance', 'Inquiry', 'Complaint', 'Documentation', 'Other']
  return allowed.includes(raw) ? raw : 'Other'
}

function mapCaseRecord(record, categoryField, unitField) {
  return {
    id: record.Id,
    contactId: record.ContactId,
    unitId: record[unitField] || undefined,
    subject: record.Subject || '',
    category: mapCategory(record, categoryField),
    description: record.Description || '',
    status: mapStatus(record.Status),
    createdAt: record.CreatedDate,
    updatedAt: record.LastModifiedDate || record.CreatedDate,
  }
}

function registerOwnerUnit(unitIds, unitToProject, unitId, projectRef) {
  if (!unitId) return
  unitIds.add(unitId)
  if (!projectRef) return
  const name = typeof projectRef === 'string' ? projectRef : projectRef.name
  const id = typeof projectRef === 'string' ? '' : projectRef.id
  if ((name || id) && !unitToProject.has(unitId)) {
    unitToProject.set(unitId, { id, name: name || '' })
  }
}

async function getOwnerUnitsContext(instanceUrl, accessToken, contactId) {
  const unitIds = new Set()
  const unitToProject = new Map()

  const ingestOpportunities = (records) => {
    for (const o of records || []) {
      const projectName =
        (o.Project__r && o.Project__r.Name) || pickSfLookup(o.Project__c).name
      registerOwnerUnit(unitIds, unitToProject, pickId(o.Unit__c), {
        id: pickId(o.Project__c),
        name: projectName,
      })
    }
  }

  const ocrSoql = `SELECT OpportunityId FROM OpportunityContactRole WHERE ContactId = '${contactId}' LIMIT 200`
  const ocr = await sfQuery(instanceUrl, accessToken, ocrSoql)
  const oppIds = (ocr.records || []).map((r) => pickId(r.OpportunityId)).filter(Boolean)

  if (oppIds.length > 0) {
    const ids = oppIds.map((id) => `'${id}'`).join(',')
    try {
      const oppSoql = `SELECT Id, Unit__c, Project__c, Project__r.Name FROM Opportunity WHERE Id IN (${ids}) AND Unit__c != null`
      const oppRes = await sfQuery(instanceUrl, accessToken, oppSoql)
      ingestOpportunities(oppRes.records)
    } catch {
      const oppSoql = `SELECT Id, Unit__c FROM Opportunity WHERE Id IN (${ids}) AND Unit__c != null`
      const oppRes = await sfQuery(instanceUrl, accessToken, oppSoql)
      ingestOpportunities(oppRes.records)
    }
  }

  if (unitIds.size === 0) {
    const contactSoql = `SELECT AccountId FROM Contact WHERE Id = '${contactId}' LIMIT 1`
    const contactRes = await sfQuery(instanceUrl, accessToken, contactSoql)
    const accountId = pickId((contactRes.records || [])[0]?.AccountId)
    if (accountId) {
      try {
        const oppSoql = `SELECT Unit__c, Project__c, Project__r.Name FROM Opportunity WHERE AccountId = '${accountId}' AND Unit__c != null LIMIT 200`
        const oppRes = await sfQuery(instanceUrl, accessToken, oppSoql)
        ingestOpportunities(oppRes.records)
      } catch {
        const oppSoql = `SELECT Unit__c FROM Opportunity WHERE AccountId = '${accountId}' AND Unit__c != null LIMIT 200`
        const oppRes = await sfQuery(instanceUrl, accessToken, oppSoql)
        ingestOpportunities(oppRes.records)
      }
    }
  }

  if (unitIds.size === 0) {
    try {
      const oppSoql = `SELECT Unit__c, Project__c, Project__r.Name FROM Opportunity WHERE ContactId = '${contactId}' AND Unit__c != null LIMIT 200`
      const oppRes = await sfQuery(instanceUrl, accessToken, oppSoql)
      ingestOpportunities(oppRes.records)
    } catch {
      // ContactId on Opportunity may not exist in org
    }
  }

  return { unitIds, unitToProject }
}

async function fetchProjectNameById(instanceUrl, accessToken, projectId) {
  if (!projectId) return ''
  const objectName = process.env.SALESFORCE_PROJECT_OBJECT || 'Project__c'
  try {
    const soql = `SELECT Name FROM ${objectName} WHERE Id = '${projectId}' LIMIT 1`
    const res = await sfQuery(instanceUrl, accessToken, soql)
    return String((res.records || [])[0]?.Name || '').trim()
  } catch {
    return ''
  }
}

async function resolveProjectForUnit(instanceUrl, accessToken, unitId, unitToProject) {
  const cached = unitToProject.get(unitId)
  if (cached?.name) return cached
  if (cached?.id && !cached.name) {
    const name = await fetchProjectNameById(instanceUrl, accessToken, cached.id)
    if (name) return { id: cached.id, name }
  }

  try {
    const unitSoql = `SELECT Project__c, Project__r.Name FROM Unit__c WHERE Id = '${unitId}' LIMIT 1`
    const unitRes = await sfQuery(instanceUrl, accessToken, unitSoql)
    const row = (unitRes.records || [])[0]
    if (row) {
      const ref = pickSfLookup(row.Project__c)
      const name =
        String((row.Project__r && row.Project__r.Name) || '').trim() ||
        ref.name ||
        (await fetchProjectNameById(instanceUrl, accessToken, ref.id))
      if (name || ref.id) return { id: ref.id, name: name || ref.id }
    }
  } catch {
    try {
      const unitSoql = `SELECT Project__c FROM Unit__c WHERE Id = '${unitId}' LIMIT 1`
      const unitRes = await sfQuery(instanceUrl, accessToken, unitSoql)
      const ref = pickSfLookup((unitRes.records || [])[0]?.Project__c)
      const name = ref.name || (await fetchProjectNameById(instanceUrl, accessToken, ref.id))
      if (name || ref.id) return { id: ref.id, name: name || ref.id }
    } catch {
      // continue to opportunity fallback
    }
  }

  try {
    const oppSoql = `SELECT Project__c, Project__r.Name FROM Opportunity WHERE Unit__c = '${unitId}' AND Project__c != null LIMIT 1`
    const oppRes = await sfQuery(instanceUrl, accessToken, oppSoql)
    const row = (oppRes.records || [])[0]
    if (row) {
      const ref = pickSfLookup(row.Project__c)
      const name =
        String((row.Project__r && row.Project__r.Name) || '').trim() ||
        ref.name ||
        (await fetchProjectNameById(instanceUrl, accessToken, ref.id))
      if (name || ref.id) return { id: ref.id, name: name || ref.id }
    }
  } catch {
    // optional relationship fields may be unavailable
  }

  return cached || null
}

async function listCases(instanceUrl, accessToken, contactId) {
  const unitField = process.env.SALESFORCE_CASE_UNIT_FIELD || 'Unit__c'
  const categoryField = process.env.SALESFORCE_CASE_CATEGORY_FIELD || 'Type'

  const selectFields = [
    'Id',
    'ContactId',
    'Subject',
    'Description',
    'Status',
    'CreatedDate',
    'LastModifiedDate',
    categoryField,
    unitField,
  ].filter((f, i, arr) => arr.indexOf(f) === i)

  const soql = `SELECT ${selectFields.join(', ')}
    FROM Case
    WHERE ContactId = '${contactId}'
    ORDER BY CreatedDate DESC
    LIMIT 100`

  try {
    const result = await sfQuery(instanceUrl, accessToken, soql)
    return (result.records || []).map((r) => mapCaseRecord(r, categoryField, unitField))
  } catch (error) {
    // Fallback without custom unit field
    const fallbackSoql = `SELECT Id, ContactId, Subject, Description, Status, Type, CreatedDate, LastModifiedDate
      FROM Case
      WHERE ContactId = '${contactId}'
      ORDER BY CreatedDate DESC
      LIMIT 100`
    const result = await sfQuery(instanceUrl, accessToken, fallbackSoql)
    return (result.records || []).map((r) => mapCaseRecord(r, 'Type', 'Unit__c'))
  }
}

async function createCaseRecord(instanceUrl, accessToken, contactId, body) {
  const subject = String(body.subject || '').trim()
  const description = String(body.description || '').trim()
  const category = String(body.category || 'Inquiry').trim()
  const unitId = pickId(body.unitId)

  if (subject.length < 5) {
    const err = new Error('Subject is required')
    err.statusCode = 400
    throw err
  }
  if (description.length < 10) {
    const err = new Error('Description is required')
    err.statusCode = 400
    throw err
  }

  const allowedCategories = ['Maintenance', 'Inquiry', 'Complaint', 'Documentation', 'Other']
  if (!allowedCategories.includes(category)) {
    const err = new Error('Invalid request category')
    err.statusCode = 400
    throw err
  }

  const unitField = process.env.SALESFORCE_CASE_UNIT_FIELD || 'Unit__c'
  const projectField = process.env.SALESFORCE_CASE_PROJECT_FIELD || 'Project__c'
  const categoryField = process.env.SALESFORCE_CASE_CATEGORY_FIELD || 'Type'
  const mobileField = process.env.SALESFORCE_CASE_MOBILE_FIELD || 'Mobile_Number__c'
  const origin = process.env.SALESFORCE_CASE_ORIGIN || 'PWA'

  const [{ accountId, ownerId: accountOwnerId }, mobileNumber] = await Promise.all([
    getContactAccountOwner(instanceUrl, accessToken, contactId),
    getContactMobile(instanceUrl, accessToken, contactId),
  ])
  if (!mobileNumber) {
    const err = new Error(
      'Your account has no mobile number on file. Please contact support to update your profile.'
    )
    err.statusCode = 400
    throw err
  }

  const { unitIds, unitToProject } = await getOwnerUnitsContext(instanceUrl, accessToken, contactId)

  if (unitIds.size > 0 && !unitId) {
    const err = new Error('Please select a unit for this request')
    err.statusCode = 400
    throw err
  }

  if (unitId && unitIds.size > 0 && !unitIds.has(unitId)) {
    const err = new Error('Selected unit is not linked to your account')
    err.statusCode = 403
    throw err
  }

  let project = null
  if (unitId) {
    project = await resolveProjectForUnit(instanceUrl, accessToken, unitId, unitToProject)
  }

  const projectName =
    String(body.projectName || '').trim() || project?.name || ''

  if (!projectName) {
    const err = new Error('Could not resolve project for the selected unit. Please contact support.')
    err.statusCode = 400
    throw err
  }

  const fullDescription = `[Project: ${projectName}]\n[Category: ${category}]\n\n${description}`

  const payload = {
    ContactId: contactId,
    Subject: subject,
    Description: fullDescription,
    Status: 'New',
    Origin: origin,
    [projectField]: projectName,
    [mobileField]: mobileNumber,
  }

  if (accountId) payload.AccountId = accountId
  if (accountOwnerId) payload.OwnerId = accountOwnerId
  if (unitId) payload[unitField] = unitId
  if (categoryField) payload[categoryField] = category

  const objectName = process.env.SALESFORCE_CASE_OBJECT || 'Case'

  let createResult
  try {
    createResult = await sfCreate(instanceUrl, accessToken, objectName, payload)
  } catch (firstError) {
    console.error('[cases] Error creating case:', firstError)
    const fallback = {
      ContactId: contactId,
      Subject: subject,
      Description: fullDescription,
      Status: 'New',
      Origin: origin,
      [projectField]: projectName,
      [mobileField]: mobileNumber,
    }
    if (accountId) fallback.AccountId = accountId
    if (accountOwnerId) fallback.OwnerId = accountOwnerId
    if (unitId) fallback[unitField] = unitId
    console.warn('[cases] Retrying with core fields:', firstError.message)
    createResult = await sfCreate(instanceUrl, accessToken, objectName, fallback)
  }

  const caseId = pickId(createResult.id)
  if (!caseId) {
    throw new Error('Case created but no id returned')
  }

  const fetchSoql = `SELECT Id, ContactId, Subject, Description, Status, Type, CreatedDate, LastModifiedDate
    FROM Case WHERE Id = '${caseId}' LIMIT 1`
  const fetched = await sfQuery(instanceUrl, accessToken, fetchSoql)
  const record = (fetched.records || [])[0]

  if (record) {
    return mapCaseRecord(
      { ...record, [unitField]: unitId || record[unitField], [categoryField]: category },
      categoryField,
      unitField
    )
  }

  return {
    id: caseId,
    contactId,
    unitId: unitId || undefined,
    subject,
    category,
    description,
    status: 'New',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export const handler = async (event) => {
  try {
    const contactId = await verifySession(event)
    const { accessToken, instanceUrl } = await getSalesforceAccessToken()

    if (event.httpMethod === 'GET') {
      const cases = await listCases(instanceUrl, accessToken, contactId)
      return json(200, { success: true, data: cases })
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const created = await createCaseRecord(instanceUrl, accessToken, contactId, body)
      return json(200, { success: true, data: created })
    }

    return json(405, { success: false, error: 'Method not allowed' })
  } catch (error) {
    const statusCode = error.statusCode || 500
    if (statusCode >= 500) {
      console.error('[cases] error:', error)
    }
    return json(statusCode, {
      success: false,
      error: error instanceof Error ? error.message : 'Request failed',
    })
  }
}
