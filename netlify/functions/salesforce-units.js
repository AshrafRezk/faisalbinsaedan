/**
 * Netlify Function: Salesforce Units Search
 * Proxy function to call the Salesforce custom REST API for units searching.
 * Handles authentication and forwards request parameters.
 */

export const handler = async (event) => {
    // Only allow GET requests for searching
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        // Get Salesforce credentials from environment variables
        const clientId = process.env.SALESFORCE_CLIENT_ID;
        const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
        const tokenUrl = process.env.SALESFORCE_TOKEN_URL;
        const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;

        if (!clientId || !clientSecret || !tokenUrl) {
            console.error('[Salesforce Units Function] Missing credentials');
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
                console.error('[Salesforce Units Function] Token request failed:', tokenResponse.status, errorText);
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: 'Failed to authenticate with Salesforce' }),
                };
            }

            const tokenData = await tokenResponse.json();
            accessToken = tokenData.access_token;
            tokenInstanceUrl = tokenData.instance_url || instanceUrl;

            if (!accessToken || !tokenInstanceUrl) {
                console.error('[Salesforce Units Function] Invalid token response');
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: 'Invalid token response from Salesforce' }),
                };
            }
        } catch (error) {
            console.error('[Salesforce Units Function] Token error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to get Salesforce token' }),
            };
        }

        // Step 2: Forward request to Salesforce UnitSearch REST API
        // Rewrite bedrooms filter to minBedrooms/maxBedrooms using the same value.
        const requestParams = new URLSearchParams(event.rawQuery || '');
        const bedrooms = requestParams.get('bedrooms');
        if (bedrooms !== null && bedrooms !== '') {
            requestParams.delete('bedrooms');
            requestParams.set('minBedrooms', bedrooms);
            requestParams.set('maxBedrooms', bedrooms);
        }

        const queryString = requestParams.toString();
        const sfApiUrl = `${tokenInstanceUrl}/services/apexrest/UnitSearch/v1/${queryString ? '?' + queryString : ''}`;

        console.log('[Salesforce Units Function] Calling SF API:', sfApiUrl);

        try {
            const sfResponse = await fetch(sfApiUrl, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!sfResponse.ok) {
                const errorText = await sfResponse.text();
                console.error('[Salesforce Units Function] SF API failed:', sfResponse.status, errorText);
                return {
                    statusCode: sfResponse.status,
                    body: JSON.stringify({ error: 'Salesforce API call failed', details: errorText }),
                };
            }

            const sfData = await sfResponse.json();

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sfData),
            };
        } catch (error) {
            console.error('[Salesforce Units Function] Fetch error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch units from Salesforce' }),
            };
        }
    } catch (error) {
        console.error('[Salesforce Units Function] Unexpected error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
