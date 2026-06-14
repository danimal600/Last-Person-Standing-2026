const FDORG_TOKEN = process.env.FDORG_TOKEN || "73804200936a4d86acaed8a91a7801ad";
const BASE = "https://api.football-data.org/v4";

// ── Lightweight in-memory response cache ──────────────────────────────────
// With ~50 players each independently polling every 60-90s, concurrent
// requests can exceed football-data.org's free-tier rate limit, causing
// fetches to fail and scores/FT badges to disappear from the Schedule.
// Netlify often reuses warm function instances for bursts of traffic, so a
// simple module-level cache (shared across invocations on the same warm
// instance) lets many near-simultaneous requests for the same URL reuse one
// upstream call. Worst case (cold instance, no cache hit) behaves exactly
// as before — this is a pure mitigation, no downside.
const CACHE_TTL_MS = 45000; // 45s — well under the 60-90s client poll intervals
const cache = new Map(); // url -> { ts, statusCode, body }

exports.handler = async (event) => {
  const rawQuery = event.rawQuery || "";
  let fullPath = decodeURIComponent(rawQuery.replace(/^path=/, ""));
  
  // Add season=2026 for WC competition
  if(fullPath.includes("competitions/WC")) {
    const separator = fullPath.includes("?") ? "&" : "?";
    if(!fullPath.includes("season=")) {
      fullPath += `${separator}season=2026`;
    }
  }

  // football-data.org only supports ONE status value at a time
  // If multiple statuses requested, just use the first one
  fullPath = fullPath.replace(/status=([^&]+)/, (match, statuses) => {
    const first = statuses.split(',')[0];
    return `status=${first}`;
  });

  const url = `${BASE}/${fullPath}`;

  const cached = cache.get(url);
  if(cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
    console.log("Cache hit:", url);
    return {
      statusCode: cached.statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: cached.body,
    };
  }

  console.log("Fetching:", url);

  try {
    const res = await fetch(url, {
      headers: { 
        "X-Auth-Token": FDORG_TOKEN,
        "Accept": "application/json",
      },
    });
    
    const text = await res.text();
    console.log("Status:", res.status, "| Preview:", text.slice(0, 200));

    // Only cache successful responses — a 429/5xx shouldn't be remembered,
    // so the next request gets a fresh chance (and we don't keep serving
    // an error to everyone for 45s).
    if(res.ok) {
      cache.set(url, { ts: Date.now(), statusCode: res.status, body: text });
    }
    
    return {
      statusCode: res.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: text,
    };
  } catch (e) {
    console.error("fdorg proxy error:", e);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: e.message }),
    };
  }
};