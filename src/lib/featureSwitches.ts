export const FEATURE_SWITCH_CACHE_KEY = "website-feature-switch-v2";
export const FEATURE_SWITCH_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const FEATURE_SWITCH_FETCH_TIMEOUT_MS = 10_000;

function isFresh(timestamp: number) {
  return Number.isFinite(timestamp) && Date.now() - timestamp < FEATURE_SWITCH_TTL_MS;
}

function readCacheEntry() {
  try {
    const cachedRaw = localStorage.getItem(FEATURE_SWITCH_CACHE_KEY);
    if (!cachedRaw) return null;
    const cached = JSON.parse(cachedRaw);
    if (!cached?.payload?.data?.values) return null;
    return cached as { fetchedAt?: number; payload: { data: { values: Record<string, boolean>; fields?: unknown[] } } };
  } catch {
    return null;
  }
}

/** Synchronous cache read so the app can render immediately on repeat visits. */
export function readCachedFeatureSwitchesSync() {
  const cached = readCacheEntry();
  if (!cached) return null;
  return {
    values: cached.payload.data.values,
    fields: cached.payload.data.fields || [],
    fresh: isFresh(cached.fetchedAt ?? 0),
  };
}

async function fetchFeatureSwitches() {
  const url = `/api/website-feature-switch`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FEATURE_SWITCH_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Feature switch API failed: ${response.status}`);
    const payload = await response.json();
    if (!payload?.success || !payload?.data?.values) throw new Error("Invalid feature switch payload");
    return payload;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getFeatureSwitchesOnLoad() {
  try {
    const cached = readCacheEntry();
    if (cached && isFresh(cached.fetchedAt ?? 0)) {
      return { source: "cache", payload: cached.payload };
    }

    const payload = await fetchFeatureSwitches();
    localStorage.setItem(
      FEATURE_SWITCH_CACHE_KEY,
      JSON.stringify({ fetchedAt: Date.now(), payload })
    );
    return { source: "api", payload };
  } catch (error) {
    const stale = readCacheEntry();
    if (stale) {
      return { source: "stale-cache", payload: stale.payload };
    }
    throw error;
  }
}
