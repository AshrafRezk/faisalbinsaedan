import { pickId, pickLabel, pickSfLookup } from '../lib/sf-pick-id.cjs'

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

async function fetchProjectsByIds(instanceUrl, accessToken, projectIds) {
  const unique = [...new Set(projectIds.filter(Boolean))]
  if (unique.length === 0) return new Map()

  const objectName = process.env.SALESFORCE_PROJECT_OBJECT || 'Project__c'
  const idList = unique.map((id) => `'${id}'`).join(', ')
  const soql = `SELECT Id, Name, Hero_Image_URL__c FROM ${objectName} WHERE Id IN (${idList})`
  const res = await sfQuery(instanceUrl, accessToken, soql)
  const map = new Map()
  for (const row of res.records || []) {
    map.set(row.Id, {
      name: String(row.Name || '').trim(),
      heroImageUrl: row.Hero_Image_URL__c || undefined,
    })
  }
  return map
}

async function fetchUnitsByIds(instanceUrl, accessToken, unitIds) {
  const unique = [...new Set(unitIds.filter(Boolean))]
  if (unique.length === 0) return new Map()

  const objectName = process.env.SALESFORCE_UNIT_OBJECT || 'Unit__c'
  const idList = unique.map((id) => `'${id}'`).join(', ')
  const soql = `SELECT Id, Name,
    Price__c, Final_Price__c,
    Number_of_Bedrooms__c, Number_of_Bathrooms__c, Total_Area__c, BUA__c, Floor__c,
    Finishing__c, Usage_Type__c, View__c,
    Eligible_for_Subsidies__c, Subsidies__c,
    Unit_Image__c,
    Building__r.Block__r.Phase__r.Project__c,
    Building__r.Block__r.Phase__r.Project__r.Name
    FROM ${objectName} WHERE Id IN (${idList})`
  const res = await sfQuery(instanceUrl, accessToken, soql)
  const map = new Map()
  for (const row of res.records || []) {
    map.set(row.Id, row)
  }
  return map
}

/** Latest Files (ContentVersion) linked to Contract__c records. */
async function fetchAttachmentsByContractIds(instanceUrl, accessToken, contractIds) {
  const unique = [...new Set(contractIds.filter(Boolean))]
  const byContract = new Map()
  for (const id of unique) byContract.set(id, [])
  if (unique.length === 0) return byContract

  const idList = unique.map((id) => `'${id}'`).join(', ')
  try {
    const linksSoql = `SELECT ContentDocumentId, LinkedEntityId
      FROM ContentDocumentLink
      WHERE LinkedEntityId IN (${idList})`
    const linksRes = await sfQuery(instanceUrl, accessToken, linksSoql)
    const links = linksRes.records || []
    if (links.length === 0) return byContract

    const docIds = [...new Set(links.map((l) => pickId(l.ContentDocumentId)).filter(Boolean))]
    if (docIds.length === 0) return byContract

    const docList = docIds.map((id) => `'${id}'`).join(', ')
    const versionsSoql = `SELECT Id, Title, FileExtension, FileType, ContentDocumentId, ContentSize, CreatedDate
      FROM ContentVersion
      WHERE IsLatest = true AND ContentDocumentId IN (${docList})
      ORDER BY CreatedDate DESC`
    const versionsRes = await sfQuery(instanceUrl, accessToken, versionsSoql)
    const versionByDoc = new Map()
    for (const v of versionsRes.records || []) {
      const docId = pickId(v.ContentDocumentId)
      if (docId && !versionByDoc.has(docId)) versionByDoc.set(docId, v)
    }

    for (const link of links) {
      const contractId = pickId(link.LinkedEntityId)
      const docId = pickId(link.ContentDocumentId)
      const version = docId ? versionByDoc.get(docId) : null
      if (!contractId || !version) continue
      const versionId = pickId(version.Id)
      if (!versionId) continue
      const title = String(version.Title || 'Contract').trim() || 'Contract'
      const ext = String(version.FileExtension || '').trim().toLowerCase()
      const filename = ext && !title.toLowerCase().endsWith(`.${ext}`) ? `${title}.${ext}` : title
      const list = byContract.get(contractId) || []
      list.push({
        id: versionId,
        contentDocumentId: docId,
        title,
        fileExtension: ext || null,
        fileType: version.FileType || null,
        size: version.ContentSize != null ? Number(version.ContentSize) : null,
        filename,
        url: `/api/salesforce-file?versionId=${encodeURIComponent(versionId)}&filename=${encodeURIComponent(filename)}`,
      })
      byContract.set(contractId, list)
    }
  } catch (error) {
    console.error('[my-opportunities] Contract attachments query failed:', error)
  }

  return byContract
}

function projectFromUnitRecord(unitRecord) {
  const phase = unitRecord?.Building__r?.Block__r?.Phase__r
  return {
    id: pickId(phase?.Project__c) || '',
    name: String(phase?.Project__r?.Name || '').trim(),
  }
}

function resolveProjectFromField(projectFieldValue, projectsById) {
  const ref = pickSfLookup(projectFieldValue)
  const details = ref.id ? projectsById.get(ref.id) : undefined
  return {
    id: ref.id,
    name: details?.name || ref.name || '',
    heroImageUrl: details?.heroImageUrl,
  }
}

function resolveUnitFromField(unitFieldValue, unitsById) {
  const ref = pickSfLookup(unitFieldValue)
  const record = ref.id ? unitsById.get(ref.id) : undefined
  return {
    id: ref.id,
    label: String(record?.Name || ref.name || pickLabel(unitFieldValue) || '').trim(),
    record,
  }
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
      'Status__c',
      'CreatedDate',
      'Project__c',
      'Unit__c',
      'Unit_Price__c',
      'Unit_Final_Price__c',
      'Unit_Usage_Type__c',
      'Unit_Cumulative_Progress_Percentage__c',
      'Building__c',
      'Block__c',
      'Phase__c',
      'Payment_Method__c',
      'Opportunity__c',
      'Opportunity__r.Unit__c',
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

    const contractIds = contracts.map((c) => pickId(c.Id)).filter(Boolean)
    const opportunityIds = contracts.map((c) => pickId(c.Opportunity__c)).filter(Boolean)

    // 2b) Installments for these contracts / account
    let installmentRecords = []
    if (contractIds.length > 0 || opportunityIds.length > 0) {
      const installmentFields = [
        'Id',
        'Name',
        'Installment_Type__c',
        'Installment_Status__c',
        'Installment_Amount__c',
        'Installment_Percentage__c',
        'Due_Date__c',
        'Contract__c',
        'Opportunity__c',
        'Unit__c',
        'Payment_Plan__c',
      ].join(', ')

      const installmentFilters = [`Account__c = '${accountId}'`]
      if (contractIds.length > 0) {
        installmentFilters.push(`Contract__c IN (${contractIds.map((id) => `'${id}'`).join(', ')})`)
      }
      if (opportunityIds.length > 0) {
        installmentFilters.push(`Opportunity__c IN (${opportunityIds.map((id) => `'${id}'`).join(', ')})`)
      }

      const installmentSoql = `SELECT ${installmentFields}
        FROM Installment__c
        WHERE ${installmentFilters.join(' OR ')}
        ORDER BY Due_Date__c ASC NULLS LAST, CreatedDate ASC
        LIMIT 200`

      console.log('[my-opportunities] Fetching installments...')
      try {
        const installmentRes = await sfQuery(instanceUrl, accessToken, installmentSoql)
        installmentRecords = installmentRes.records || []
        console.log(`[my-opportunities] Found ${installmentRecords.length} installments`)
      } catch (installmentError) {
        console.error('[my-opportunities] Installment query failed:', installmentError)
      }
    }

    const mapInstallment = (row) => ({
      id: pickId(row.Id),
      name: String(row.Name || '').trim(),
      type: row.Installment_Type__c || null,
      status: row.Installment_Status__c || null,
      amount: row.Installment_Amount__c != null ? Number(row.Installment_Amount__c) : null,
      percentage: row.Installment_Percentage__c != null ? Number(row.Installment_Percentage__c) : null,
      dueDate: row.Due_Date__c || null,
      contractId: pickId(row.Contract__c) || null,
      opportunityId: pickId(row.Opportunity__c) || null,
      unitLabel: pickLabel(row.Unit__c) || null,
      paymentPlan: pickLabel(row.Payment_Plan__c) || null,
    })

    const installmentsByContractId = new Map()
    const installmentsByOpportunityId = new Map()
    for (const row of installmentRecords) {
      const mapped = mapInstallment(row)
      if (mapped.contractId) {
        const list = installmentsByContractId.get(mapped.contractId) || []
        list.push(mapped)
        installmentsByContractId.set(mapped.contractId, list)
      }
      if (mapped.opportunityId) {
        const list = installmentsByOpportunityId.get(mapped.opportunityId) || []
        list.push(mapped)
        installmentsByOpportunityId.set(mapped.opportunityId, list)
      }
    }

    const unitIds = contracts
      .map((c) => pickId(c.Opportunity__r?.Unit__c) || pickId(c.Unit__c))
      .filter(Boolean)
    const unitsById = await fetchUnitsByIds(instanceUrl, accessToken, unitIds)
    const projectIds = [
      ...unitIds.map((id) => projectFromUnitRecord(unitsById.get(id)).id),
      ...contracts.map((c) => pickId(c.Project__c)),
    ].filter(Boolean)
    const projectsById = await fetchProjectsByIds(instanceUrl, accessToken, projectIds)
    const attachmentsByContractId = await fetchAttachmentsByContractIds(
      instanceUrl,
      accessToken,
      contractIds
    )

    // 3) Map Contract__c to standard Opportunity/Unit structures expected by the frontend
    const mappedOpportunities = contracts.map((c) => {
      const contractId = pickId(c.Id)
      const opportunityId = pickId(c.Opportunity__c)
      const oppUnitId = pickId(c.Opportunity__r?.Unit__c)
      const unitFieldValue = oppUnitId || c.Unit__c
      const unit = resolveUnitFromField(unitFieldValue, unitsById)
      if (!unit.id && oppUnitId) unit.id = oppUnitId
      if (!unit.label && c.Unit__c) unit.label = pickLabel(c.Unit__c)
      const u = unit.record || {}
      const unitProject = projectFromUnitRecord(u)
      const oppProjectId = unitProject.id
      const oppProjectName = unitProject.name || pickLabel(c.Project__c)
      
      const projectFromLookup = oppProjectId ? projectsById.get(oppProjectId) : undefined
      const project = projectFromLookup
        ? { id: oppProjectId, name: projectFromLookup.name || oppProjectName, heroImageUrl: projectFromLookup.heroImageUrl }
        : resolveProjectFromField(c.Project__c, projectsById)

      const fromContract = installmentsByContractId.get(contractId) || []
      const fromOpportunity = opportunityId
        ? (installmentsByOpportunityId.get(opportunityId) || []).filter(
            (inst) => !inst.contractId || inst.contractId === contractId
          )
        : []
      const seen = new Set()
      const installments = [...fromContract, ...fromOpportunity].filter((inst) => {
        if (!inst.id || seen.has(inst.id)) return false
        seen.add(inst.id)
        return true
      })

      const mappedUnit = {
        id: unit.id || c.Id,
        projectId: project.id || oppProjectId || pickId(c.Project__c) || '',
        phaseId: '',
        unitNumber: unit.label || 'N/A',
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
        eligibleForSubsidies: ['yes', 'true', 'eligible'].includes(
          String(u.Eligible_for_Subsidies__c || '').toLowerCase()
        ),
        subsidies: u.Subsidies__c ?? undefined,
        deliveryDate: undefined,
        images: u.Unit_Image__c ? [u.Unit_Image__c] : [],
        unitImage: u.Unit_Image__c ?? undefined,
        projectHeroImage: project.heroImageUrl,
        paymentProgress: Number(c.Unit_Cumulative_Progress_Percentage__c || 0), // maps actual cumulative progress!
        paymentStatus: c.Payment_Method__c ?? undefined,
        projectName: project.name || oppProjectName || undefined,
        projectNameAr: project.name || oppProjectName || undefined,
        phaseName: c.Phase__c ?? undefined,
        phaseNameAr: c.Phase__c ?? undefined,
        buildingName: c.Building__c ?? undefined,
        blockName: c.Block__c ?? undefined,
      }

      return {
        id: contractId,
        name: project.name || oppProjectName || 'Unit Contract',
        stageName: `${c.Name}`, // contract number (as displayed in screenshot)
        closeDate: c.CreatedDate || null,
        amount: Number(c.Unit_Final_Price__c || c.Unit_Price__c || 0),
        contractNumber: c.Name || null,
        contractStatus: c.Status__c || null,
        paymentMethod: c.Payment_Method__c || null,
        paymentProgress: Number(c.Unit_Cumulative_Progress_Percentage__c || 0),
        unitNumber: unit.label || pickLabel(c.Unit__c) || null,
        units: [mappedUnit],
        installments,
        attachments: attachmentsByContractId.get(contractId) || [],
      }
    })

    return json(200, { success: true, data: mappedOpportunities })
  } catch (error) {
    console.error('[my-opportunities] error:', error)
    return json(500, { success: false, error: 'Internal server error' })
  }
}

