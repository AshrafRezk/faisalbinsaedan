/**
 * Netlify Function: Salesforce Query
 * Server-side function to query Salesforce using SOQL
 * Secrets are kept server-side and never exposed to the client
 */

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse the SOQL query from the request body
    const { soql } = JSON.parse(event.body || '{}');

    if (!soql) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'SOQL query is required' }),
      };
    }

    // Get Salesforce credentials from server-side environment variables (no VITE_ prefix)
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const tokenUrl = process.env.SALESFORCE_TOKEN_URL;
    const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;

    if (!clientId || !clientSecret || !tokenUrl) {
      console.error('[Salesforce Query Function] Missing credentials');
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
        console.error('[Salesforce Query Function] Token request failed:', tokenResponse.status, errorText);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to authenticate with Salesforce' }),
        };
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      tokenInstanceUrl = tokenData.instance_url || instanceUrl;

      if (!accessToken || !tokenInstanceUrl) {
        console.error('[Salesforce Query Function] Invalid token response');
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Invalid token response from Salesforce' }),
        };
      }
    } catch (error) {
      console.error('[Salesforce Query Function] Token error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to get Salesforce token' }),
      };
    }

    // Step 2: Execute SOQL query
    const encodedQuery = encodeURIComponent(soql);
    const queryUrl = `${tokenInstanceUrl}/services/data/v59.0/query?q=${encodedQuery}`;

    try {
      const queryResponse = await fetch(queryUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!queryResponse.ok) {
        const errorText = await queryResponse.text();
        console.error('[Salesforce Query Function] Query failed:', queryResponse.status, errorText);
        return {
          statusCode: queryResponse.status,
          body: JSON.stringify({ error: 'Salesforce query failed', details: errorText }),
        };
      }

      const queryData = await queryResponse.json();

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          records: queryData.records || [],
          totalSize: typeof queryData.totalSize === 'number' ? queryData.totalSize : undefined,
        }),
      };
    } catch (error) {
      console.error('[Salesforce Query Function] Query error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to execute Salesforce query' }),
      };
    }
  } catch (error) {
    console.error('[Salesforce Query Function] Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

