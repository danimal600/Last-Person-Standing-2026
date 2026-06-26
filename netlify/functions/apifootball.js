const API_KEY = process.env.APIFOOTBALL_KEY || "514950080ef92cc2bc272497508a4cf9";
const BASE    = "https://v3.football.api-sports.io";

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

exports.handler = async (event) => {
  const path = decodeURIComponent((event.rawQuery||"").replace(/^path=/,""));
  const url  = `${BASE}/${path}`;

  const cached = cache.get(url);
  if(cached && Date.now() - cached.ts < CACHE_TTL) {
    console.log("Cache hit:", url);
    return { statusCode:200, headers:{"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}, body:cached.body };
  }

  console.log("Fetching:", url);
  try {
    const res  = await fetch(url, { headers:{ "x-apisports-key": API_KEY } });
    const text = await res.text();
    console.log("Status:", res.status, "| Preview:", text.slice(0,200));
    if(res.ok) cache.set(url, { ts:Date.now(), body:text });
    return {
      statusCode: res.status,
      headers:{ "Content-Type":"application/json","Access-Control-Allow-Origin":"*" },
      body: text
    };
  } catch(e) {
    console.error("apifootball proxy error:", e);
    return { statusCode:500, headers:{"Access-Control-Allow-Origin":"*"}, body:JSON.stringify({error:e.message}) };
  }
};