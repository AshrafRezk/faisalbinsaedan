/**
 * Netlify Function: Website Feature Switch
 * Server-side function to fetch feature switches from Salesforce Apex REST endpoint
 */

export const handler = async (event) => {
  // Allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const tokenUrl = process.env.SALESFORCE_TOKEN_URL;
    const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;

    if (!clientId || !clientSecret || !tokenUrl) {
      console.error('[Feature Switch Function] Missing credentials');
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
        console.error('[Feature Switch Function] Token request failed:', tokenResponse.status, errorText);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to authenticate with Salesforce' }),
        };
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      tokenInstanceUrl = tokenData.instance_url || instanceUrl;

      if (!accessToken || !tokenInstanceUrl) {
        console.error('[Feature Switch Function] Invalid token response');
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Invalid token response from Salesforce' }),
        };
      }
    } catch (error) {
      console.error('[Feature Switch Function] Token error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to get Salesforce token' }),
      };
    }

    // Step 2: Call Apex REST Endpoint
    const apexRestUrl = `${tokenInstanceUrl}/services/apexrest/WebsiteFeatureSwitch/v1`;

    try {
      const apiResponse = await fetch(apexRestUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error('[Feature Switch Function] API failed:', apiResponse.status, errorText);
        return {
          statusCode: apiResponse.status,
          body: JSON.stringify({ error: 'Salesforce API call failed', details: errorText }),
        };
      }

      const responseData = await apiResponse.json();

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responseData),
      };
    } catch (error) {
      console.error('[Feature Switch Function] API error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch feature switches from Salesforce' }),
      };
    }
  } catch (error) {
    console.error('[Feature Switch Function] Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
