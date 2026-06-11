const FDORG_TOKEN = "73804200936a4d86acaed8a91a7801ad";
const BASE = "https://api.football-data.org/v4";

exports.handler = async (event) => {
  const path = event.queryStringParameters?.path || "";
  const url = `${BASE}/${path}`;

  try {
    const res = await fetch(url, {
      headers: { "X-Auth-Token": FDORG_TOKEN },
    });
    const data = await res.json();
    return {
      statusCode: res.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(data),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message }),
    };
  }
};
