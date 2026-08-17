/**
 * Netlify Function: Create PWA lead / sign-up in Salesforce
 *
 * POST JSON body:
 * {
 *   firstName, lastName, email?, phone, countryCode?, region?, city?, unitType?,
 *   profile, message?, company?,
 *   commercialRegistrationNumber?, taxRegistrationNumber?, nationalAddress?, investmentType?,
 *   interestedProjectName?, interestedProjectId?, interestedPhaseId?, interestedUnitId?,
 *   rentalProjectId?, rentalBudget?, numberOfRooms?, rentalStartDate?, rentalEndDate?,
 *   commercialRegistrationAttachment?, vatCertificateAttachment?
 * }
 */

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

/** Build SF Phone digits from local number + country dial code (default 966). */
function normalizePhone(raw, countryCode) {
  const ccDigits = String(countryCode || '966').replace(/\D/g, '') || '966'
  let digits = String(raw || '').replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith(ccDigits) && digits.length >= ccDigits.length + 8) return digits
  if (digits.startsWith('0')) digits = digits.slice(1)
  return `${ccDigits}${digits}`
}

function humanizeSalesforceMessage(message) {
  const text = String(message || '').trim()
  if (!text) return null

  const lower = text.toLowerCase()
  if (lower.includes('phone') && (lower.includes('saudi') || lower.includes('invalid number'))) {
    return 'Please enter a valid Saudi mobile number (without country code). Example: 501234567'
  }

  return text.replace(/^[A-Za-z0-9_]+:\s*/, '') || text
}

function friendlyLeadError(error) {
  const raw = error instanceof Error ? error.message : String(error || '')
  const jsonMatch = raw.match(/(\[[\s\S]*\]|\{[\s\S]*\})\s*$/)
  const candidate = jsonMatch ? jsonMatch[1] : raw

  try {
    const parsed = JSON.parse(candidate)
    const items = Array.isArray(parsed) ? parsed : [parsed]
    const messages = items
      .map((item) => humanizeSalesforceMessage(item?.message))
      .filter(Boolean)
    if (messages.length > 0) return { message: messages.join(' '), statusCode: 400 }
  } catch {
    // fall through
  }

  if (/phone/i.test(raw) && /saudi|invalid/i.test(raw)) {
    return {
      message: 'Please enter a valid Saudi mobile number (without country code). Example: 501234567',
      statusCode: 400,
    }
  }

  return {
    message: 'We could not submit your request. Please check your details and try again.',
    statusCode: 500,
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
  const countryCode = String(body.countryCode || '+966').trim() || '+966'

  const payload = {
    FirstName: String(body.firstName || '').trim() || 'PWA',
    LastName: String(body.lastName || '').trim() || 'Lead',
    Phone: normalizePhone(body.phone, countryCode),
    Company: String(body.company || 'Faisal Bin Saedan PWA').trim(),
    LeadSource: 'PWA',
    Description: lines.join('\n\n'),
  }

  const email = String(body.email || '').trim()
  if (email) payload.Email = email

  const company = String(body.company || '').trim()
  if (company) payload.Company = company

  if (['Investor', 'Supplier', 'Individual'].includes(profile)) {
    payload.Customer_Type__c = profile
  }

  const cr = String(body.commercialRegistrationNumber || '').trim()
  if (cr) payload.Commercial_Registration_Number__c = cr.slice(0, 15)

  const tax = String(body.taxRegistrationNumber || '').trim()
  if (tax) payload.Tax_Registration_Number__c = tax.slice(0, 20)

  const companyNumber = String(body.companyNumber || '').trim()
  if (companyNumber) payload.Company_Number__c = companyNumber.slice(0, 20)

  const companyType = String(body.companyType || '').trim()
  if (companyType === 'Company' || companyType === 'Establishment') {
    payload.Company_Type__c = companyType
  }

  const title = String(body.title || body.employeePosition || '').trim()
  if (title) payload.Title = title.slice(0, 128)

  const nationalAddress = String(body.nationalAddress || '').trim()
  if (nationalAddress) {
    payload.National_Address__c = nationalAddress.slice(0, 1000)
    const compact = nationalAddress.replace(/\s+/g, '')
    if (/^[A-Za-z0-9]{8}$/.test(compact)) {
      payload.Abbreviated_National_Address_Code__c = compact.toUpperCase()
    }
  }

  const investmentType = String(body.investmentType || '').trim()
  if (investmentType) payload.Investment_Type__c = investmentType.slice(0, 255)

  // Same API names as website bot (salesforce-lead.js)
  const countryField = process.env.SALESFORCE_LEAD_COUNTRY_FIELD || 'Mobile_Country__c'
  const regionField = process.env.SALESFORCE_LEAD_REGION_FIELD || 'Region_Province__c'
  const cityField = process.env.SALESFORCE_LEAD_CITY_FIELD || 'Lead_City__c'
  const unitTypeField = process.env.SALESFORCE_LEAD_UNIT_TYPE_FIELD || 'Unit_Type__c'

  if (countryCode) payload[countryField] = countryCode

  const region = String(body.region || '').trim()
  if (region) payload[regionField] = region

  const city = String(body.city || '').trim()
  if (city) payload[cityField] = city

  const unitType = String(body.unitType || '').trim()
  if (unitType) payload[unitTypeField] = unitType

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

function buildProjectLookupFields(body) {
  const fields = {}
  const projectLookupField = process.env.SALESFORCE_LEAD_PROJECT_LOOKUP_FIELD || 'Interested_Project__c'
  if (body.interestedProjectId && projectLookupField) {
    fields[projectLookupField] = body.interestedProjectId
  }
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

async function uploadLeadPdf(instanceUrl, accessToken, leadId, attachment, fallbackTitle) {
  const fileName = String(attachment.fileName || `${fallbackTitle}.pdf`).trim()
  const contentType = String(attachment.contentType || 'application/pdf').trim()
  const base64 = String(attachment.base64 || '').trim()

  if (!base64) {
    throw new Error(`${fallbackTitle} PDF payload is empty`)
  }

  if (contentType !== 'application/pdf' && !fileName.toLowerCase().endsWith('.pdf')) {
    throw new Error('Only PDF attachments are allowed for suppliers')
  }

  const versionPayload = {
    Title: `${fallbackTitle} - ${fileName.replace(/\.pdf$/i, '')}`.slice(0, 80),
    PathOnClient: fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`,
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
    throw new Error(`${fallbackTitle} PDF upload failed (${versionResponse.status}): ${errorText}`)
  }

  return versionResponse.json()
}

function assertPdfAttachment(attachment, label) {
  if (!attachment?.base64) {
    return `${label} is required as a PDF`
  }
  const fileName = String(attachment.fileName || '')
  const contentType = String(attachment.contentType || '')
  if (contentType !== 'application/pdf' && !fileName.toLowerCase().endsWith('.pdf')) {
    return `${label} must be a PDF file`
  }
  const approxBytes = Math.floor((String(attachment.base64).length * 3) / 4)
  if (approxBytes > 5 * 1024 * 1024) {
    return `${label} must be 5 MB or smaller`
  }
  return null
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, error: 'Method not allowed' })
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const profile = String(body.profile || '').trim()

    if (!['Investor', 'Customer', 'Supplier', 'Individual'].includes(profile)) {
      return json(400, { success: false, error: 'Invalid profile type' })
    }

    const countryCode = String(body.countryCode || '+966').trim() || '+966'
    const phone = normalizePhone(body.phone, countryCode)
    if (!phone || phone.replace(/\D/g, '').length < 11) {
      return json(400, {
        success: false,
        error: 'Please enter a valid mobile number (without country code). Example: 501234567',
      })
    }
    body.phone = phone
    body.countryCode = countryCode

    if (profile === 'Supplier') {
      const cr = String(body.commercialRegistrationNumber || '').trim()
      const tax = String(body.taxRegistrationNumber || '').trim()
      const nationalAddress = String(body.nationalAddress || '').trim()
      if (!cr) {
        return json(400, { success: false, error: 'Commercial Registration Number is required' })
      }
      if (!tax) {
        return json(400, { success: false, error: 'Tax Registration Number is required' })
      }
      if (!nationalAddress) {
        return json(400, { success: false, error: 'National Address is required' })
      }
      if (!String(body.company || body.companyName || '').trim()) {
        return json(400, { success: false, error: 'Company Name is required' })
      }
      if (!String(body.companyNumber || '').trim()) {
        return json(400, { success: false, error: 'Company Number is required' })
      }
      const companyType = String(body.companyType || '').trim()
      if (companyType !== 'Company' && companyType !== 'Establishment') {
        return json(400, { success: false, error: 'Company Type is required' })
      }
      if (!String(body.title || body.employeePosition || '').trim()) {
        return json(400, { success: false, error: 'Employee position is required' })
      }
      const crPdfError = assertPdfAttachment(
        body.commercialRegistrationAttachment,
        'Commercial Registration'
      )
      if (crPdfError) return json(400, { success: false, error: crPdfError })
      const vatPdfError = assertPdfAttachment(body.vatCertificateAttachment, 'VAT Certificate')
      if (vatPdfError) return json(400, { success: false, error: vatPdfError })
    }

    const { accessToken, instanceUrl } = await getSalesforceAccessToken()
    const standardPayload = buildStandardLeadPayload(body)
    const salesFields = buildSalesInterestFields(body)
    const projectLookupFields = buildProjectLookupFields(body)
    const rentalFields = buildRentalLeadFields(body)

    let leadId
    try {
      leadId = await createLeadRecord(instanceUrl, accessToken, standardPayload)
    } catch (createError) {
      const coreOnly = {
        FirstName: standardPayload.FirstName,
        LastName: standardPayload.LastName,
        Phone: standardPayload.Phone,
        Company: standardPayload.Company,
        LeadSource: standardPayload.LeadSource,
        Description: standardPayload.Description,
      }
      if (standardPayload.Email) coreOnly.Email = standardPayload.Email
      console.warn('[Leads] Create with location fields failed, retrying core fields only:', createError.message)
      leadId = await createLeadRecord(instanceUrl, accessToken, coreOnly)

      const locationPatch = { ...standardPayload }
      delete locationPatch.FirstName
      delete locationPatch.LastName
      delete locationPatch.Phone
      delete locationPatch.Company
      delete locationPatch.LeadSource
      delete locationPatch.Description
      delete locationPatch.Email
      try {
        await patchLeadFields(instanceUrl, accessToken, leadId, locationPatch, 'location')
      } catch (patchErr) {
        console.warn('[Leads] Location patch after core create failed:', patchErr.message)
      }
    }

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

    try {
      await patchLeadFields(instanceUrl, accessToken, leadId, projectLookupFields, 'project lookup')
    } catch (error) {
      patchWarnings.push(error.message)
    }

    if (patchWarnings.length > 0) {
      console.warn('[Leads] Lead created but some custom fields were not saved:', patchWarnings.join(' | '))
    }

    if (profile === 'Supplier') {
      await uploadLeadPdf(
        instanceUrl,
        accessToken,
        leadId,
        body.commercialRegistrationAttachment,
        'Commercial Registration'
      )
      await uploadLeadPdf(
        instanceUrl,
        accessToken,
        leadId,
        body.vatCertificateAttachment,
        'VAT Certificate'
      )
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
    const { message, statusCode } = friendlyLeadError(error)
    return json(statusCode, {
      success: false,
      error: message,
    })
  }
}
