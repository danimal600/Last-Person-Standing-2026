const FDORG_TOKEN = "73804200936a4d86acaed8a91a7801ad";
const BASE = "https://api.football-data.org/v4";

exports.handler = async (event) => {
  const rawQuery = event.rawQuery || "";
  let fullPath = decodeURIComponent(rawQuery.replace(/^path=/, ""));
  
  // Always add season=2026 for WC competition to ensure we get 2026 data
  if(fullPath.includes("competitions/WC")) {
    const separator = fullPath.includes("?") ? "&" : "?";
    if(!fullPath.includes("season=")) {
      fullPath += `${separator}season=2026`;
    }
  }
  
  const url = `${BASE}/${fullPath}`;
  console.log("Fetching:", url);

  try {
    const res = await fetch(url, {
      headers: { 
        "X-Auth-Token": FDORG_TOKEN,
        "Accept": "application/json",
      },
    });
    
    const text = await res.text();
    console.log("Response status:", res.status, "| Preview:", text.slice(0, 300));
    
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
