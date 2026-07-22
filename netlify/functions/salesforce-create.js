/**
 * Netlify Function: Salesforce Create
 * Server-side function to create records in Salesforce
 * Secrets are kept server-side and never exposed to the client
 */

export const handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse the request body
    const { objectName, data } = JSON.parse(event.body || '{}');

    if (!objectName || !data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'objectName and data are required' }),
      };
    }

    // Get Salesforce credentials from server-side environment variables (no VITE_ prefix)
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const tokenUrl = process.env.SALESFORCE_TOKEN_URL;
    const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;

    if (!clientId || !clientSecret || !tokenUrl) {
      console.error('[Salesforce Create Function] Missing credentials');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Salesforce credentials not configured' }),
      };
    }

    // Step 1: Get access token
    let accessToken;
    let tokenInstanceUrl = instanceUrl;

    try {
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('[Salesforce Create Function] Token request failed:', tokenResponse.status, errorText);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to authenticate with Salesforce' }),
        };
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      tokenInstanceUrl = tokenData.instance_url || instanceUrl;

      if (!accessToken || !tokenInstanceUrl) {
        console.error('[Salesforce Create Function] Invalid token response');
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Invalid token response from Salesforce' }),
        };
      }
    } catch (error) {
      console.error('[Salesforce Create Function] Token error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to get Salesforce token' }),
      };
    }

    // Step 2: Create record
    const createUrl = `${tokenInstanceUrl}/services/data/v59.0/sobjects/${objectName}`;

    try {
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error('[Salesforce Create Function] Create failed:', createResponse.status, errorText);
        return {
          statusCode: createResponse.status,
          body: JSON.stringify({ error: 'Salesforce create failed', details: errorText }),
        };
      }

      const createData = await createResponse.json();

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          id: createData.id,
        }),
      };
    } catch (error) {
      console.error('[Salesforce Create Function] Create error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to create Salesforce record' }),
      };
    }
  } catch (error) {
    console.error('[Salesforce Create Function] Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

