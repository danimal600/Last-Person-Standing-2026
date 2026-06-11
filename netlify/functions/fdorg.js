const FDORG_TOKEN = "73804200936a4d86acaed8a91a7801ad";
const BASE = "https://api.football-data.org/v4";

exports.handler = async (event) => {
  const path = event.queryStringParameters?.path || "";
  
  // Reconstruct the full URL — the path param may contain & which gets split
  // so we need to use the raw query string
  const rawQuery = event.rawQuery || "";
  const fullPath = rawQuery.replace(/^path=/, "");
  const url = `${BASE}/${decodeURIComponent(fullPath)}`;

  console.log("Fetching:", url);

  try {
    const res = await fetch(url, {
      headers: { 
        "X-Auth-Token": FDORG_TOKEN,
        "Accept": "application/json",
      },
    });
    
    const text = await res.text();
    console.log("Response status:", res.status);
    console.log("Response preview:", text.slice(0, 200));
    
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
