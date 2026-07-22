/**
 * Netlify Function: Salesforce News Search and Detail
 * Proxy function to call the Salesforce custom REST API for News Articles.
 * Handles authentication and forwards request parameters.
 */

export const handler = async (event) => {
    // Only allow GET requests
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
            console.error('[Salesforce News Function] Missing credentials');
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
                console.error('[Salesforce News Function] Token request failed:', tokenResponse.status, errorText);
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: 'Failed to authenticate with Salesforce' }),
                };
            }

            const tokenData = await tokenResponse.json();
            accessToken = tokenData.access_token;
            tokenInstanceUrl = tokenData.instance_url || instanceUrl;

            if (!accessToken || !tokenInstanceUrl) {
                console.error('[Salesforce News Function] Invalid token response');
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: 'Invalid token response from Salesforce' }),
                };
            }
        } catch (error) {
            console.error('[Salesforce News Function] Token error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to get Salesforce token' }),
            };
        }

        // Step 2: Forward request to Salesforce NewsArticles REST API
        const queryParams = event.queryStringParameters || {};
        const recordId = queryParams.recordId;
        
        let sfApiUrl = '';
        if (recordId) {
            // Remove recordId from query params so it's not sent as a regular filter
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(queryParams)) {
                if (key !== 'recordId' && value !== undefined) {
                    params.append(key, value);
                }
            }
            const queryString = params.toString();
            sfApiUrl = `${tokenInstanceUrl}/services/apexrest/NewsArticles/v1/articles/${recordId}${queryString ? '?' + queryString : ''}`;
        } else {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(queryParams)) {
                if (value !== undefined) {
                    params.append(key, value);
                }
            }
            const queryString = params.toString();
            sfApiUrl = `${tokenInstanceUrl}/services/apexrest/NewsArticles/v1/articles${queryString ? '?' + queryString : ''}`;
        }

        console.log('[Salesforce News Function] Calling SF API:', sfApiUrl);

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
                console.error('[Salesforce News Function] SF API failed:', sfResponse.status, errorText);
                return {
                    statusCode: sfResponse.status,
                    body: JSON.stringify({ error: 'Salesforce API call failed', details: errorText }),
                };
            }

            let sfData = await sfResponse.json();

            // Helper to rewrite relative URLs
            const orgOrigin = tokenInstanceUrl.replace(/\/$/, '');
            const toAbsoluteUrl = (relativeUrl) => {
                if (!relativeUrl) return '';
                if (/^https?:\/\//i.test(relativeUrl)) return relativeUrl;
                const path = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
                return `${orgOrigin}${path}`;
            };

            if (sfData?.data?.articles) {
                sfData.data.articles = sfData.data.articles.map(article => {
                    if (article.coverImageUrl) {
                        article.coverImageUrl = toAbsoluteUrl(article.coverImageUrl);
                    }
                    return article;
                });
            } else if (sfData?.data?.article) {
                if (sfData.data.article.coverImageUrl) {
                    sfData.data.article.coverImageUrl = toAbsoluteUrl(sfData.data.article.coverImageUrl);
                }
                if (sfData.data.article.body) {
                    sfData.data.article.body = sfData.data.article.body.replace(
                        /src=["'](?!\w+:\/\/)([^"']+)["']/gi,
                        (match, path) => {
                            const cleanPath = path.startsWith('/') ? path : `/${path}`;
                            return `src="${orgOrigin}${cleanPath}"`;
                        }
                    );
                }
            }

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(sfData),
            };
        } catch (error) {
            console.error('[Salesforce News Function] Fetch error:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to fetch news from Salesforce' }),
            };
        }
    } catch (error) {
        console.error('[Salesforce News Function] Unexpected error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
