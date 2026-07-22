/**
 * Netlify Function: Create PWA lead / sign-up in Salesforce
 *
 * POST JSON body:
 * {
 *   firstName, lastName, email?, phone, profile, message?, company?,
 *   interestedProjectName?, interestedPhaseId?, interestedUnitId?,
 *   rentalProjectId?, rentalBudget?, numberOfRooms?, rentalStartDate?, rentalEndDate?,
 *   supplierAttachment?: { fileName, contentType, base64 }
 * }
 */

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
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

function buildStandardLeadPayload(body) {
  const profile = String(body.profile || '').trim()
  const message = String(body.message || '').trim()
  const lines = [profile ? `Profile: ${profile}` : null, message || null].filter(Boolean)

  const payload = {
    FirstName: String(body.firstName || '').trim() || 'PWA',
    LastName: String(body.lastName || '').trim() || 'Lead',
    Phone: String(body.phone || '').trim(),
    Company: String(body.company || 'Faisal Bin Saedan PWA').trim(),
    LeadSource: 'PWA',
    Description: lines.join('\n\n'),
  }

  const email = String(body.email || '').trim()
  if (email) payload.Email = email

  const company = String(body.company || '').trim()
  if (company) payload.Company = company

  return payload
}

function buildSalesInterestFields(body) {
  const fields = {}

  const projectField = process.env.SALESFORCE_LEAD_PROJECT_FIELD || 'Interested_Projects__c'
  if (body.interestedProjectName && projectField) fields[projectField] = body.interestedProjectName

  const unitField = process.env.SALESFORCE_LEAD_UNIT_FIELD || 'Interested_Unit__c'
  if (body.interestedUnitId && unitField) fields[unitField] = body.interestedUnitId

  const phaseField = process.env.SALESFORCE_LEAD_PHASE_FIELD || 'Interested_Phase__c'
  if (body.interestedPhaseId && phaseField) fields[phaseField] = body.interestedPhaseId

  return fields
}

function buildRentalLeadFields(body) {
  const fields = {}
  const rentalProjectField = process.env.SALESFORCE_LEAD_RENTAL_PROJECT_FIELD || 'Project__c'
  const rentalBudgetField = process.env.SALESFORCE_LEAD_RENTAL_BUDGET_FIELD || 'Rental_Budget__c'
  const numberOfRoomsField = process.env.SALESFORCE_LEAD_NUMBER_OF_ROOMS_FIELD || 'Number_of_Rooms__c'
  const rentalStartField = process.env.SALESFORCE_LEAD_RENTAL_START_FIELD || 'Rental_Start_Date__c'
  const rentalEndField = process.env.SALESFORCE_LEAD_RENTAL_END_FIELD || 'Rental_End_Date__c'

  if (body.rentalProjectId) fields[rentalProjectField] = body.rentalProjectId
  if (body.rentalBudget != null && body.rentalBudget !== '' && !Number.isNaN(Number(body.rentalBudget))) {
    fields[rentalBudgetField] = Number(body.rentalBudget)
  }
  if (body.numberOfRooms != null && body.numberOfRooms !== '' && !Number.isNaN(Number(body.numberOfRooms))) {
    fields[numberOfRoomsField] = Number(body.numberOfRooms)
  }
  if (body.rentalStartDate) fields[rentalStartField] = body.rentalStartDate
  if (body.rentalEndDate) fields[rentalEndField] = body.rentalEndDate

  return fields
}

/** @deprecated Use buildStandardLeadPayload + patch helpers */
function buildLeadPayload(body) {
  return {
    ...buildStandardLeadPayload(body),
    ...buildSalesInterestFields(body),
    ...buildRentalLeadFields(body),
  }
}

async function createLeadRecord(instanceUrl, accessToken, payload) {
  const objectName = process.env.SALESFORCE_LEAD_OBJECT || 'Lead'
  const createUrl = `${instanceUrl}/services/data/v59.0/sobjects/${objectName}`

  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!createResponse.ok) {
    const errorText = await createResponse.text()
    throw new Error(`Lead create failed (${createResponse.status}): ${errorText}`)
  }

  const createData = await createResponse.json()
  return createData.id
}

async function patchLeadRecord(instanceUrl, accessToken, leadId, fields) {
  const objectName = process.env.SALESFORCE_LEAD_OBJECT || 'Lead'
  const patchUrl = `${instanceUrl}/services/data/v59.0/sobjects/${objectName}/${leadId}`

  const patchResponse = await fetch(patchUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fields),
  })

  if (!patchResponse.ok) {
    const errorText = await patchResponse.text()
    throw new Error(`Lead patch failed (${patchResponse.status}): ${errorText}`)
  }
}

async function patchLeadFields(instanceUrl, accessToken, leadId, fields, label) {
  if (!fields || Object.keys(fields).length === 0) return
  try {
    await patchLeadRecord(instanceUrl, accessToken, leadId, fields)
    console.log(`[Leads] Patched ${label} fields on lead ${leadId}:`, Object.keys(fields).join(', '))
  } catch (error) {
    console.error(`[Leads] Failed to patch ${label} fields on lead ${leadId}:`, error.message)
    throw error
  }
}

async function uploadSupplierPdf(instanceUrl, accessToken, leadId, attachment) {
  const fileName = String(attachment.fileName || 'supplier-document.pdf').trim()
  const contentType = String(attachment.contentType || 'application/pdf').trim()
  const base64 = String(attachment.base64 || '').trim()

  if (!base64) {
    throw new Error('Supplier PDF payload is empty')
  }

  if (contentType !== 'application/pdf' && !fileName.toLowerCase().endsWith('.pdf')) {
    throw new Error('Only PDF attachments are allowed for suppliers')
  }

  const versionPayload = {
    Title: fileName.replace(/\.pdf$/i, '') || 'Supplier Registration',
    PathOnClient: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
    VersionData: base64,
    FirstPublishLocationId: leadId,
  }

  const versionUrl = `${instanceUrl}/services/data/v59.0/sobjects/ContentVersion`
  const versionResponse = await fetch(versionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(versionPayload),
  })

  if (!versionResponse.ok) {
    const errorText = await versionResponse.text()
    throw new Error(`Supplier PDF upload failed (${versionResponse.status}): ${errorText}`)
  }

  return versionResponse.json()
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, error: 'Method not allowed' })
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const profile = String(body.profile || '').trim()

    if (!['Investor', 'Customer', 'Supplier'].includes(profile)) {
      return json(400, { success: false, error: 'Invalid profile type' })
    }

    if (!body.phone || String(body.phone).trim().length < 9) {
      return json(400, { success: false, error: 'Phone is required' })
    }

    if (profile === 'Supplier') {
      const attachment = body.supplierAttachment
      if (!attachment?.base64) {
        return json(400, { success: false, error: 'Supplier registration requires a PDF attachment' })
      }
      const approxBytes = Math.floor((String(attachment.base64).length * 3) / 4)
      if (approxBytes > 5 * 1024 * 1024) {
        return json(400, { success: false, error: 'PDF must be 5 MB or smaller' })
      }
    }

    const { accessToken, instanceUrl } = await getSalesforceAccessToken()
    const standardPayload = buildStandardLeadPayload(body)
    const salesFields = buildSalesInterestFields(body)
    const rentalFields = buildRentalLeadFields(body)

    const leadId = await createLeadRecord(instanceUrl, accessToken, standardPayload)

    const patchWarnings = []
    try {
      await patchLeadFields(instanceUrl, accessToken, leadId, rentalFields, 'rental')
    } catch (error) {
      patchWarnings.push(error.message)
    }

    try {
      await patchLeadFields(instanceUrl, accessToken, leadId, salesFields, 'sales interest')
    } catch (error) {
      patchWarnings.push(error.message)
    }

    if (patchWarnings.length > 0) {
      console.warn('[Leads] Lead created but some custom fields were not saved:', patchWarnings.join(' | '))
    }

    if (profile === 'Supplier' && body.supplierAttachment) {
      await uploadSupplierPdf(instanceUrl, accessToken, leadId, body.supplierAttachment)
    }

    return json(200, {
      success: true,
      data: {
        id: leadId,
        profile,
        source: 'PWA',
        firstName: standardPayload.FirstName,
        lastName: standardPayload.LastName,
        email: standardPayload.Email || '',
        phone: standardPayload.Phone,
        message: body.message || '',
        createdAt: new Date().toISOString(),
        ...(patchWarnings.length > 0 ? { warnings: patchWarnings } : {}),
      },
    })
  } catch (error) {
    console.error('[Leads] Error:', error)
    return json(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create lead',
    })
  }
}
