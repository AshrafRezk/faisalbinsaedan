export const FEATURE_SWITCH_CACHE_KEY = "website-feature-switch-v2";
export const FEATURE_SWITCH_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function isFresh(timestamp: number) {
  return Number.isFinite(timestamp) && Date.now() - timestamp < FEATURE_SWITCH_TTL_MS;
}

async function fetchFeatureSwitches() {
  const url = `/api/website-feature-switch`;
  const response = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Feature switch API failed: ${response.status}`);
  const payload = await response.json();
  if (!payload?.success || !payload?.data?.values) throw new Error("Invalid feature switch payload");
  return payload;
}

export async function getFeatureSwitchesOnLoad() {
  try {
    const cachedRaw = localStorage.getItem(FEATURE_SWITCH_CACHE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      if (isFresh(cached?.fetchedAt) && cached?.payload?.data?.values) {
        return { source: "cache", payload: cached.payload };
      }
    }

    const payload = await fetchFeatureSwitches();
    localStorage.setItem(
      FEATURE_SWITCH_CACHE_KEY,
      JSON.stringify({ fetchedAt: Date.now(), payload })
    );
    return { source: "api", payload };
  } catch (error) {
    // Safe fallback if API fails: use stale cache if present.
    const staleRaw = localStorage.getItem(FEATURE_SWITCH_CACHE_KEY);
    if (staleRaw) {
      const stale = JSON.parse(staleRaw);
      if (stale?.payload?.data?.values) {
        return { source: "stale-cache", payload: stale.payload };
      }
    }
    throw error;
  }
}
