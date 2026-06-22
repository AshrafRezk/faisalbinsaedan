/**
 * Netlify Function: Salesforce File Proxy (v2)
 * Proxies a Salesforce ContentVersion VersionData binary to the client.
 * Uses Web API Response stream to bypass the 6MB payload limit for large PDFs.
 *
 * Usage:
 *   /.netlify/functions/salesforce-file?versionId=068XXXXXXXXXXXXXXX
 */
export default async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const versionId = url.searchParams.get("versionId");
    
    if (!versionId) {
      return new Response(JSON.stringify({ error: "versionId is required" }), { status: 400 });
    }

    // Get Salesforce credentials from environment variables
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const tokenUrl = process.env.SALESFORCE_TOKEN_URL;
    const instanceUrl = process.env.SALESFORCE_INSTANCE_URL;

    if (!clientId || !clientSecret || !tokenUrl) {
      console.error("[Salesforce File Function] Missing credentials");
      return new Response(JSON.stringify({ error: "Salesforce credentials not configured" }), { status: 500 });
    }

    // Step 1: Get access token
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[Salesforce File Function] Token request failed:", tokenResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to authenticate with Salesforce" }), { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const tokenInstanceUrl = tokenData.instance_url || instanceUrl;

    if (!accessToken || !tokenInstanceUrl) {
      console.error("[Salesforce File Function] Invalid token response");
      return new Response(JSON.stringify({ error: "Invalid token response from Salesforce" }), { status: 500 });
    }

    // Step 2: Fetch VersionData (binary)
    const sfUrl = `${tokenInstanceUrl}/services/data/v59.0/sobjects/ContentVersion/${encodeURIComponent(versionId)}/VersionData`;

    const sfResponse = await fetch(sfUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!sfResponse.ok) {
      const errorText = await sfResponse.text();
      console.error("[Salesforce File Function] VersionData fetch failed:", sfResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to fetch file from Salesforce" }), { status: sfResponse.status });
    }

    // Proxy the stream directly to bypass the 6MB limit
    return new Response(sfResponse.body, {
      status: 200,
      headers: {
        "Content-Type": sfResponse.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": "public, max-age=300",
      }
    });

  } catch (error) {
    console.error("[Salesforce File Function] Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
