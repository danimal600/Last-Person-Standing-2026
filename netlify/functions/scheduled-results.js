// ── Scheduled function: runs server-side on a fixed schedule (see netlify.toml),
// completely independent of how many browser tabs are open. Fetches the
// World Cup data ONCE from football-data.org, then writes results/lives/
// scores to Supabase — every client picks this up via the normal loadAll
// read, with zero extra API calls of their own.
//
// IMPORTANT: the match-schedule data below (ALL_GROUP_MATCHES_RAW,
// KNOCKOUT_SLOTS_RAW, TEAM_NAME_MAP) is COPIED from src/App.jsx. If you ever
// change kickoff times, add knockout fixtures, or add a team-name mapping
// in App.jsx, mirror the same change here too.

const { createClient } = require("@supabase/supabase-js");

const FDORG_TOKEN = process.env.FDORG_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

function etToBst(etStr) {
  const [h, m] = etStr.split(":").map(Number);
  let bh = h + 5, overnight = false;
  if (bh >= 24) { bh -= 24; overnight = true; }
  return { bst:`${bh.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}`, overnight };
}
function prevDateStr(dateStr) {
  const d = new Date(dateStr+"T12:00:00Z"); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10);
}

const ALL_GROUP_MATCHES_RAW = [
  { id:1,  etDate:"2026-06-11", home:"Mexico",         away:"South Africa",   group:"A", kickoffET:"15:00" },
  { id:2,  etDate:"2026-06-11", home:"South Korea",    away:"Czechia",        group:"A", kickoffET:"22:00" },
  { id:3,  etDate:"2026-06-12", home:"Canada",         away:"Bosnia & Herz.", group:"B", kickoffET:"15:00" },
  { id:4,  etDate:"2026-06-12", home:"USA",            away:"Paraguay",       group:"D", kickoffET:"21:00" },
  { id:5,  etDate:"2026-06-13", home:"Qatar",          away:"Switzerland",    group:"B", kickoffET:"15:00" },
  { id:6,  etDate:"2026-06-13", home:"Brazil",         away:"Morocco",        group:"C", kickoffET:"18:00" },
  { id:7,  etDate:"2026-06-13", home:"Haiti",          away:"Scotland",       group:"C", kickoffET:"21:00" },
  { id:8,  etDate:"2026-06-14", home:"Australia",      away:"Turkiye",        group:"D", kickoffET:"00:00" },
  { id:9,  etDate:"2026-06-14", home:"Germany",        away:"Curacao",        group:"E", kickoffET:"13:00" },
  { id:10, etDate:"2026-06-14", home:"Netherlands",    away:"Japan",          group:"F", kickoffET:"16:00" },
  { id:11, etDate:"2026-06-14", home:"Ivory Coast",    away:"Ecuador",        group:"E", kickoffET:"19:00" },
  { id:12, etDate:"2026-06-14", home:"Sweden",         away:"Tunisia",        group:"F", kickoffET:"22:00" },
  { id:13, etDate:"2026-06-15", home:"Spain",          away:"Cape Verde",     group:"H", kickoffET:"12:00" },
  { id:14, etDate:"2026-06-15", home:"Belgium",        away:"Egypt",          group:"G", kickoffET:"15:00" },
  { id:15, etDate:"2026-06-15", home:"Saudi Arabia",   away:"Uruguay",        group:"H", kickoffET:"18:00" },
  { id:16, etDate:"2026-06-15", home:"Iran",           away:"New Zealand",    group:"G", kickoffET:"21:00" },
  { id:17, etDate:"2026-06-16", home:"France",         away:"Senegal",        group:"I", kickoffET:"15:00" },
  { id:18, etDate:"2026-06-16", home:"Iraq",           away:"Norway",         group:"I", kickoffET:"18:00" },
  { id:19, etDate:"2026-06-16", home:"Argentina",      away:"Algeria",        group:"J", kickoffET:"21:00" },
  { id:20, etDate:"2026-06-17", home:"Austria",        away:"Jordan",         group:"J", kickoffET:"00:00" },
  { id:21, etDate:"2026-06-17", home:"Portugal",       away:"DR Congo",       group:"K", kickoffET:"13:00" },
  { id:22, etDate:"2026-06-17", home:"England",        away:"Croatia",        group:"L", kickoffET:"16:00" },
  { id:23, etDate:"2026-06-17", home:"Ghana",          away:"Panama",         group:"L", kickoffET:"19:00" },
  { id:24, etDate:"2026-06-17", home:"Uzbekistan",     away:"Colombia",       group:"K", kickoffET:"22:00" },
  { id:25, etDate:"2026-06-18", home:"Czechia",        away:"South Africa",   group:"A", kickoffET:"12:00" },
  { id:26, etDate:"2026-06-18", home:"Switzerland",    away:"Bosnia & Herz.", group:"B", kickoffET:"15:00" },
  { id:27, etDate:"2026-06-18", home:"Canada",         away:"Qatar",          group:"B", kickoffET:"18:00" },
  { id:28, etDate:"2026-06-18", home:"Mexico",         away:"South Korea",    group:"A", kickoffET:"21:00" },
  { id:29, etDate:"2026-06-19", home:"USA",            away:"Australia",      group:"D", kickoffET:"15:00" },
  { id:30, etDate:"2026-06-19", home:"Scotland",       away:"Morocco",        group:"C", kickoffET:"18:00" },
  { id:31, etDate:"2026-06-19", home:"Brazil",         away:"Haiti",          group:"C", kickoffET:"20:30" },
  { id:32, etDate:"2026-06-19", home:"Turkiye",        away:"Paraguay",       group:"D", kickoffET:"23:00" },
  { id:33, etDate:"2026-06-20", home:"Netherlands",    away:"Sweden",         group:"F", kickoffET:"13:00" },
  { id:34, etDate:"2026-06-20", home:"Germany",        away:"Ivory Coast",    group:"E", kickoffET:"16:00" },
  { id:35, etDate:"2026-06-20", home:"Ecuador",        away:"Curacao",        group:"E", kickoffET:"20:00" },
  { id:36, etDate:"2026-06-21", home:"Tunisia",        away:"Japan",          group:"F", kickoffET:"00:00" },
  { id:37, etDate:"2026-06-21", home:"Spain",          away:"Saudi Arabia",   group:"H", kickoffET:"12:00" },
  { id:38, etDate:"2026-06-21", home:"Belgium",        away:"Iran",           group:"G", kickoffET:"15:00" },
  { id:39, etDate:"2026-06-21", home:"Uruguay",        away:"Cape Verde",     group:"H", kickoffET:"18:00" },
  { id:40, etDate:"2026-06-21", home:"New Zealand",    away:"Egypt",          group:"G", kickoffET:"21:00" },
  { id:41, etDate:"2026-06-22", home:"Argentina",      away:"Austria",        group:"J", kickoffET:"13:00" },
  { id:42, etDate:"2026-06-22", home:"France",         away:"Iraq",           group:"I", kickoffET:"17:00" },
  { id:43, etDate:"2026-06-22", home:"Norway",         away:"Senegal",        group:"I", kickoffET:"20:00" },
  { id:44, etDate:"2026-06-22", home:"Jordan",         away:"Algeria",        group:"J", kickoffET:"23:00" },
  { id:45, etDate:"2026-06-23", home:"Portugal",       away:"Uzbekistan",     group:"K", kickoffET:"13:00" },
  { id:46, etDate:"2026-06-23", home:"England",        away:"Ghana",          group:"L", kickoffET:"16:00" },
  { id:47, etDate:"2026-06-23", home:"Panama",         away:"Croatia",        group:"L", kickoffET:"19:00" },
  { id:48, etDate:"2026-06-23", home:"Colombia",       away:"DR Congo",       group:"K", kickoffET:"22:00" },
  { id:49, etDate:"2026-06-24", home:"Switzerland",    away:"Canada",         group:"B", kickoffET:"15:00" },
  { id:50, etDate:"2026-06-24", home:"Bosnia & Herz.", away:"Qatar",          group:"B", kickoffET:"15:00" },
  { id:51, etDate:"2026-06-24", home:"Scotland",       away:"Brazil",         group:"C", kickoffET:"18:00" },
  { id:52, etDate:"2026-06-24", home:"Morocco",        away:"Haiti",          group:"C", kickoffET:"18:00" },
  { id:53, etDate:"2026-06-24", home:"Czechia",        away:"Mexico",         group:"A", kickoffET:"21:00" },
  { id:54, etDate:"2026-06-24", home:"South Africa",   away:"South Korea",    group:"A", kickoffET:"21:00" },
  { id:55, etDate:"2026-06-25", home:"Curacao",        away:"Ivory Coast",    group:"E", kickoffET:"16:00" },
  { id:56, etDate:"2026-06-25", home:"Ecuador",        away:"Germany",        group:"E", kickoffET:"16:00" },
  { id:57, etDate:"2026-06-25", home:"Japan",          away:"Sweden",         group:"F", kickoffET:"19:00" },
  { id:58, etDate:"2026-06-25", home:"Tunisia",        away:"Netherlands",    group:"F", kickoffET:"19:00" },
  { id:59, etDate:"2026-06-25", home:"Turkiye",        away:"USA",            group:"D", kickoffET:"22:00" },
  { id:60, etDate:"2026-06-25", home:"Paraguay",       away:"Australia",      group:"D", kickoffET:"22:00" },
  { id:61, etDate:"2026-06-26", home:"Norway",         away:"France",         group:"I", kickoffET:"15:00" },
  { id:62, etDate:"2026-06-26", home:"Senegal",        away:"Iraq",           group:"I", kickoffET:"15:00" },
  { id:63, etDate:"2026-06-26", home:"Cape Verde",     away:"Saudi Arabia",   group:"H", kickoffET:"20:00" },
  { id:64, etDate:"2026-06-26", home:"Uruguay",        away:"Spain",          group:"H", kickoffET:"20:00" },
  { id:65, etDate:"2026-06-26", home:"Egypt",          away:"Iran",           group:"G", kickoffET:"23:00" },
  { id:66, etDate:"2026-06-26", home:"New Zealand",    away:"Belgium",        group:"G", kickoffET:"23:00" },
  { id:67, etDate:"2026-06-27", home:"Panama",         away:"England",        group:"L", kickoffET:"17:00" },
  { id:68, etDate:"2026-06-27", home:"Croatia",        away:"Ghana",          group:"L", kickoffET:"17:00" },
  { id:69, etDate:"2026-06-27", home:"Colombia",       away:"Portugal",       group:"K", kickoffET:"19:30" },
  { id:70, etDate:"2026-06-27", home:"DR Congo",       away:"Uzbekistan",     group:"K", kickoffET:"19:30" },
  { id:71, etDate:"2026-06-27", home:"Algeria",        away:"Austria",        group:"J", kickoffET:"22:00" },
  { id:72, etDate:"2026-06-27", home:"Jordan",         away:"Argentina",      group:"J", kickoffET:"22:00" },
];
const KNOCKOUT_SLOTS_RAW = [
  { id:73,  etDate:"2026-06-28", slot:"R32-1",  phase:"L32_L16", kickoffET:"15:00" },
  { id:74,  etDate:"2026-06-29", slot:"R32-2",  phase:"L32_L16", kickoffET:"16:30" },
  { id:75,  etDate:"2026-06-29", slot:"R32-3",  phase:"L32_L16", kickoffET:"21:00" },
  { id:76,  etDate:"2026-06-29", slot:"R32-4",  phase:"L32_L16", kickoffET:"13:00" },
  { id:77,  etDate:"2026-06-30", slot:"R32-5",  phase:"L32_L16", kickoffET:"17:00" },
  { id:78,  etDate:"2026-06-30", slot:"R32-6",  phase:"L32_L16", kickoffET:"13:00" },
  { id:79,  etDate:"2026-06-30", slot:"R32-7",  phase:"L32_L16", kickoffET:"21:00" },
  { id:80,  etDate:"2026-07-01", slot:"R32-8",  phase:"L32_L16", kickoffET:"12:00" },
  { id:81,  etDate:"2026-07-01", slot:"R32-9",  phase:"L32_L16", kickoffET:"20:00" },
  { id:82,  etDate:"2026-07-01", slot:"R32-10", phase:"L32_L16", kickoffET:"16:00" },
  { id:83,  etDate:"2026-07-02", slot:"R32-11", phase:"L32_L16", kickoffET:"19:00" },
  { id:84,  etDate:"2026-07-02", slot:"R32-12", phase:"L32_L16", kickoffET:"15:00" },
  { id:85,  etDate:"2026-07-02", slot:"R32-13", phase:"L32_L16", kickoffET:"23:00" },
  { id:86,  etDate:"2026-07-03", slot:"R32-14", phase:"L32_L16", kickoffET:"18:00" },
  { id:87,  etDate:"2026-07-03", slot:"R32-15", phase:"L32_L16", kickoffET:"21:30" },
  { id:88,  etDate:"2026-07-03", slot:"R32-16", phase:"L32_L16", kickoffET:"14:00" },
  { id:89,  etDate:"2026-07-04", slot:"R16-1",  phase:"L32_L16", kickoffET:"17:00" },
  { id:90,  etDate:"2026-07-04", slot:"R16-2",  phase:"L32_L16", kickoffET:"13:00" },
  { id:91,  etDate:"2026-07-05", slot:"R16-3",  phase:"L32_L16", kickoffET:"16:00" },
  { id:92,  etDate:"2026-07-05", slot:"R16-4",  phase:"L32_L16", kickoffET:"20:00" },
  { id:93,  etDate:"2026-07-06", slot:"R16-5",  phase:"L32_L16", kickoffET:"15:00" },
  { id:94,  etDate:"2026-07-06", slot:"R16-6",  phase:"L32_L16", kickoffET:"20:00" },
  { id:95,  etDate:"2026-07-07", slot:"R16-7",  phase:"L32_L16", kickoffET:"12:00" },
  { id:96,  etDate:"2026-07-07", slot:"R16-8",  phase:"L32_L16", kickoffET:"16:00" },
  { id:97,  etDate:"2026-07-09", slot:"QF-1",   phase:"FREE",    kickoffET:"16:00" },
  { id:98,  etDate:"2026-07-10", slot:"QF-2",   phase:"FREE",    kickoffET:"15:00" },
  { id:99,  etDate:"2026-07-11", slot:"QF-3",   phase:"FREE",    kickoffET:"17:00" },
  { id:100, etDate:"2026-07-11", slot:"QF-4",   phase:"FREE",    kickoffET:"21:00" },
  { id:101, etDate:"2026-07-14", slot:"SF-1",   phase:"FREE",    kickoffET:"15:00" },
  { id:102, etDate:"2026-07-15", slot:"SF-2",   phase:"FREE",    kickoffET:"15:00" },
  { id:103, etDate:"2026-07-18", slot:"3RD",    phase:"FREE",    kickoffET:"17:00" },
  { id:104, etDate:"2026-07-19", slot:"FINAL",  phase:"FREE",    kickoffET:"15:00" },
];
const TEAM_NAME_MAP = {
  "Mexico":"Mexico","South Africa":"South Africa","Korea Republic":"South Korea",
  "Czechia":"Czechia","Canada":"Canada","Bosnia and Herzegovina":"Bosnia & Herz.",
  "USA":"USA","United States":"USA","Paraguay":"Paraguay","Qatar":"Qatar",
  "Switzerland":"Switzerland","Brazil":"Brazil","Morocco":"Morocco","Haiti":"Haiti",
  "Scotland":"Scotland","Australia":"Australia","Türkiye":"Turkiye","Turkey":"Turkiye",
  "Germany":"Germany","Curaçao":"Curacao","Curacao":"Curacao","Netherlands":"Netherlands",
  "Japan":"Japan","Ivory Coast":"Ivory Coast","Côte d'Ivoire":"Ivory Coast",
  "Ecuador":"Ecuador","Sweden":"Sweden","Tunisia":"Tunisia","Spain":"Spain",
  "Cape Verde":"Cape Verde","Belgium":"Belgium","Egypt":"Egypt",
  "Saudi Arabia":"Saudi Arabia","Uruguay":"Uruguay","Iran":"Iran",
  "New Zealand":"New Zealand","France":"France","Senegal":"Senegal",
  "Iraq":"Iraq","Norway":"Norway","Argentina":"Argentina","Algeria":"Algeria",
  "Austria":"Austria","Jordan":"Jordan","Portugal":"Portugal","DR Congo":"DR Congo",
  "Congo DR":"DR Congo","England":"England","Croatia":"Croatia","Ghana":"Ghana",
  "Panama":"Panama","Uzbekistan":"Uzbekistan","Colombia":"Colombia",
  "South Korea":"South Korea","Bosnia & Herzegovina":"Bosnia & Herz.","Bosnia-Herzegovina":"Bosnia & Herz.",
};

const GROUP_MATCHES = ALL_GROUP_MATCHES_RAW.map(m => {
  const { bst } = etToBst(m.kickoffET);
  const midnight = m.kickoffET === "00:00";
  const pickDate = midnight ? prevDateStr(m.etDate) : m.etDate;
  return { ...m, pickDate, kickoffBST: bst, earlyHours: midnight };
});

const KNOCKOUT_SLOTS = KNOCKOUT_SLOTS_RAW.map(m => {
  const { bst } = etToBst(m.kickoffET);
  const [etH] = m.kickoffET.split(":").map(Number);
  const earlyHours = etH < 6;
  const pickDate = earlyHours ? prevDateStr(m.etDate) : m.etDate;
  return { ...m, pickDate, kickoffBST: bst, earlyHours };
});

const matchesByPickDate = {};
GROUP_MATCHES.forEach(m => {
  if (!matchesByPickDate[m.pickDate]) matchesByPickDate[m.pickDate] = [];
  matchesByPickDate[m.pickDate].push(m);
});

const deadlineETByPickDate = {};
GROUP_MATCHES.forEach(m => {
  const d = m.pickDate;
  if (m.earlyHours) return;
  if (!deadlineETByPickDate[d] || m.kickoffET < deadlineETByPickDate[d]) deadlineETByPickDate[d] = m.kickoffET;
});
GROUP_MATCHES.forEach(m => { if (!deadlineETByPickDate[m.pickDate]) deadlineETByPickDate[m.pickDate] = m.kickoffET; });
KNOCKOUT_SLOTS.forEach(m => {
  const d = m.pickDate;
  if (m.earlyHours) return;
  if (!deadlineETByPickDate[d] || m.kickoffET < deadlineETByPickDate[d]) deadlineETByPickDate[d] = m.kickoffET;
});

const groupPickDates    = [...new Set(GROUP_MATCHES.map(m=>m.pickDate))].sort();
const knockoutPickDates = [...new Set(KNOCKOUT_SLOTS.map(m=>m.pickDate))].sort();
const allPickDates      = [...new Set([...groupPickDates,...knockoutPickDates])].sort();

function nowET() {
  const p=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
  return `${p.find(x=>x.type==="hour").value.padStart(2,"0")}:${p.find(x=>x.type==="minute").value.padStart(2,"0")}`;
}
function todayET() { return new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York"}).format(new Date()); }
function isLocked(pickDate) {
  const dl=deadlineETByPickDate[pickDate]; if(!dl)return false;
  if(pickDate<todayET())return true; if(pickDate>todayET())return false; return nowET()>=dl;
}

// picks is { "matchId": "choice" } — one pick per match, not per day
function getDayPick(player, pickDate) {
  const matches = [...(matchesByPickDate[pickDate]||[]), ...KNOCKOUT_SLOTS.filter(s=>s.pickDate===pickDate)];
  for (const m of matches) {
    const choice = player.picks[String(m.id)];
    if (choice) return { matchId: String(m.id), choice };
  }
  return null;
}

function getMatchesForPickDate(pickDate, koFixtures) {
  const gm = matchesByPickDate[pickDate]||[];
  const km = KNOCKOUT_SLOTS.filter(s=>s.pickDate===pickDate&&koFixtures[s.id]).map(s=>({...s,...koFixtures[s.id],isKnockout:true}));
  return [...gm,...km];
}


exports.handler = async () => {
  const summary = { ok: false, didAnything: false, steps: [] };

  if (!FDORG_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing required environment variables (FDORG_TOKEN / SUPABASE_URL / SUPABASE_SERVICE_KEY)");
    return { statusCode: 500, body: JSON.stringify({ error: "missing env vars" }) };
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // ── Fetch current state from Supabase ────────────────────────────────
  const { data: pData } = await supabase.from("players").select("*");
  const { data: pickData } = await supabase.from("picks").select("*");
  const { data: resData } = await supabase.from("results").select("*");
  const { data: koData } = await supabase.from("ko_fixtures").select("*");

  const picksByPlayer = {};
  (pickData||[]).forEach(pk => {
    if (!picksByPlayer[pk.player_id]) picksByPlayer[pk.player_id] = {};
    const key = pk.match_id || pk.pick_date;
    picksByPlayer[pk.player_id][key] = pk.choice;
  });
  const players = (pData||[]).map(p => ({ ...p, picks: picksByPlayer[p.id]||{} }));

  const results = {};
  (resData||[]).forEach(r => { results[`${r.pick_date}|${r.team}`] = r.outcome; });

  const koFixtures = {};
  (koData||[]).forEach(k => { koFixtures[k.slot_id] = { home: k.home, away: k.away }; });

  // ── Fetch from football-data.org (ONE call, regardless of how many
  // players have the app open — this is the whole point) ────────────────
  let data;
  try {
    const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches?season=2026", {
      headers: { "X-Auth-Token": FDORG_TOKEN, "Accept": "application/json" },
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("Upstream fetch failed:", res.status, "| Preview:", text.slice(0,200));
      return { statusCode: 200, body: JSON.stringify({ ok:false, error:"upstream_failed", status: res.status }) };
    }
    data = JSON.parse(text);
  } catch(e) {
    console.error("Upstream fetch error:", e);
    return { statusCode: 200, body: JSON.stringify({ ok:false, error:"upstream_error", message: e.message }) };
  }

  const allMatches = data.matches || [];
  const finishedMatches = allMatches.filter(m => m.status === "FINISHED");
  const notFinished = allMatches.filter(m => m.status !== "FINISHED");

  const teamPairKeys = (m) => {
    const home = TEAM_NAME_MAP[m.homeTeam?.name] || m.homeTeam?.name;
    const away = TEAM_NAME_MAP[m.awayTeam?.name] || m.awayTeam?.name;
    return [`${home}|${away}`, `${away}|${home}`];
  };
  const liveTeamPairs = new Set(
    notFinished.filter(m=>["IN_PLAY","PAUSED","HALFTIME"].includes(m.status)).flatMap(teamPairKeys)
  );
  const pendingTeamPairs = new Set(
    notFinished.filter(m=>!["IN_PLAY","PAUSED","HALFTIME"].includes(m.status)).flatMap(teamPairKeys)
  );

  // Group finished matches by ET pick date, skip already logged
  const newlyFinishedByDate = {};
  finishedMatches.forEach(match => {
    const score = match.score?.fullTime;
    if(!score || score.home===null || score.away===null) return;
    const home = TEAM_NAME_MAP[match.homeTeam?.name] || match.homeTeam?.name;
    const away = TEAM_NAME_MAP[match.awayTeam?.name] || match.awayTeam?.name;
    const etDate = new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York"}).format(new Date(match.utcDate));
    if(results[`${etDate}|${home}`]) return; // already logged
    const ourMatch = GROUP_MATCHES.find(m => m.etDate===etDate && ((m.home===home&&m.away===away)||(m.home===away&&m.away===home)))
      || KNOCKOUT_SLOTS.filter(s=>koFixtures[s.id]).find(s => {
          const f = koFixtures[s.id];
          return (f.home===home&&f.away===away)||(f.home===away&&f.away===home);
        });
    if(!newlyFinishedByDate[etDate]) newlyFinishedByDate[etDate] = [];
    newlyFinishedByDate[etDate].push({match, home, away, etDate, ourMatchId: ourMatch?.id});
  });

  const active = players.filter(p=>!p.eliminated&&p.lives>0);
  let didAnything = false;
  const updatedResults = {...results};

  // Step 1: Log results for all newly finished matches (across all dates)
  for(const [etDate, dayMatches] of Object.entries(newlyFinishedByDate)) {
    for(const {match, home, away, etDate:pd, ourMatchId} of dayMatches) {
      const score = match.score.fullTime;
      const winnerSide = match.score?.winner; // "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null
      let isDraw, winTeam, loseTeam;
      if(winnerSide === "HOME_TEAM" || winnerSide === "AWAY_TEAM") {
        isDraw = false;
        winTeam = winnerSide === "HOME_TEAM" ? home : away;
        loseTeam = winnerSide === "HOME_TEAM" ? away : home;
      } else if(winnerSide === "DRAW") {
        isDraw = true; winTeam = home; loseTeam = away;
      } else {
        isDraw = score.home === score.away;
        winTeam = isDraw ? home : score.home > score.away ? home : away;
        loseTeam = isDraw ? away : score.home > score.away ? away : home;
      }
      const drawKey = `Draw#${ourMatchId ?? match.id ?? match.matchId ?? ""}`;
      console.log(`Auto-logging: ${home} ${score.home}-${score.away} ${away} on ${pd} (winner=${winnerSide}, ourMatchId=${ourMatchId})`);
      const rows = isDraw
        ? [{pick_date:pd,team:drawKey,outcome:"draw_correct"},{pick_date:pd,team:home,outcome:"draw_wrong"},{pick_date:pd,team:away,outcome:"draw_wrong"}]
        : [{pick_date:pd,team:winTeam,outcome:"win"},{pick_date:pd,team:loseTeam,outcome:"lose"},{pick_date:pd,team:drawKey,outcome:"draw_wrong"}];
      await supabase.from("results").upsert(rows,{onConflict:"pick_date,team"});
      rows.forEach(r => { updatedResults[`${pd}|${r.team}`] = r.outcome; });
      didAnything = true;
      summary.steps.push(`logged ${home} ${score.home}-${score.away} ${away} (${pd})`);
    }
  }

  // Step 2/3: Lives deduction
  const datesToCheck = allPickDates.filter(d =>
    isLocked(d) && getMatchesForPickDate(d, koFixtures).length>0 && !updatedResults[`${d}|__lives_done__`]
  );

  for(const etDate of datesToCheck) {
    const dayMatchesAll = getMatchesForPickDate(etDate, koFixtures);
    const dayStillPlaying = dayMatchesAll.some(m => liveTeamPairs.has(`${m.home}|${m.away}`));
    const dayHasPending = dayMatchesAll.some(m => pendingTeamPairs.has(`${m.home}|${m.away}`));
    const dayFullyDone = !dayStillPlaying && !dayHasPending;

    const outcomeFor = (p) => {
      const dp = getDayPick(p, etDate);
      if(!dp) return { dp, outcome: undefined };
      const lookupKey = dp.choice === "Draw" ? `Draw#${dp.matchId}` : dp.choice;
      return { dp, outcome: updatedResults[`${etDate}|${lookupKey}`] };
    };

    const playersWrong = active.filter(p => {
      const { dp, outcome } = outcomeFor(p);
      if(!dp) return true;
      if(!outcome) return null;
      return outcome === "lose" || outcome === "draw_wrong";
    });

    const playersCorrect = active.filter(p => {
      const { dp, outcome } = outcomeFor(p);
      if(!dp) return false;
      return outcome === "win" || outcome === "draw_correct";
    });

    const middasPossible = playersCorrect.length === 0;

    if(dayFullyDone) {
      const everyoneWrong = playersWrong.length === active.length && active.length > 0;
      const toProcess = active.filter(p => !updatedResults[`${etDate}|__processed__${p.id}`]);
      if(everyoneWrong) {
        console.log(`Midda's Law — everyone wrong on ${etDate}, no lives lost`);
        summary.steps.push(`${etDate}: Midda's Law (everyone wrong)`);
      } else {
        const wrongToProcess = toProcess.filter(p => playersWrong.includes(p));
        const updates = wrongToProcess.map(p => {
          const nl = p.lives - 1;
          return supabase.from("players").update({lives:nl,eliminated:nl===0}).eq("id",p.id);
        });
        if(updates.length > 0) {
          await Promise.all(updates);
          didAnything = true;
          summary.steps.push(`${etDate}: ${updates.length} player(s) lost a life`);
        }
      }
      await supabase.from("results").upsert(
        [{pick_date:etDate,team:"__lives_done__",outcome:"done"}],
        {onConflict:"pick_date,team"}
      );
      updatedResults[`${etDate}|__lives_done__`] = "done";
      didAnything = true;
    } else if(!middasPossible) {
      const toProcess = active.filter(p =>
        !updatedResults[`${etDate}|__processed__${p.id}`] && playersWrong.includes(p)
      );
      const updates = [];
      const markerRows = [];
      for(const p of toProcess) {
        const nl = p.lives - 1;
        updates.push(supabase.from("players").update({lives:nl,eliminated:nl===0}).eq("id",p.id));
        markerRows.push({pick_date:etDate, team:`__processed__${p.id}`, outcome:"lost_life"});
      }
      if(updates.length > 0) await Promise.all(updates);
      if(markerRows.length > 0) {
        await supabase.from("results").upsert(markerRows,{onConflict:"pick_date,team"});
        markerRows.forEach(r => { updatedResults[`${etDate}|${r.team}`] = r.outcome; });
        didAnything = true;
        summary.steps.push(`${etDate}: ${markerRows.length} player(s) lost a life (early)`);
      }
    } else {
      console.log(`Midda's Law still possible on ${etDate} — holding lives update`);
    }
  }

  // Final step: persist the final score for every finished match
  for(const match of finishedMatches) {
    try {
      const score = match.score?.fullTime;
      if(!score || score.home===null || score.away===null) continue;
      if(!match.utcDate) continue;
      const home = TEAM_NAME_MAP[match.homeTeam?.name] || match.homeTeam?.name;
      const away = TEAM_NAME_MAP[match.awayTeam?.name] || match.awayTeam?.name;
      const matchEtDate = new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York"}).format(new Date(match.utcDate));
      const ourMatch = GROUP_MATCHES.find(m => m.etDate===matchEtDate && ((m.home===home&&m.away===away)||(m.home===away&&m.away===home)))
        || KNOCKOUT_SLOTS.filter(s=>koFixtures[s.id]).find(s => {
            const fx = koFixtures[s.id];
            return (fx.home===home&&fx.away===away)||(fx.home===away&&fx.away===home);
          });
      if(!ourMatch) continue;
      const dur = match.score?.duration;
      const scoreVal = `${score.home}-${score.away}` + (dur && dur!=="REGULAR" ? `:${dur}` : "");
      const scoreKey = `__score__${ourMatch.id}`;
      if(updatedResults[`${ourMatch.pickDate}|${scoreKey}`] === scoreVal) continue;
      await supabase.from("results").upsert([{pick_date:ourMatch.pickDate,team:scoreKey,outcome:scoreVal}],{onConflict:"pick_date,team"});
      updatedResults[`${ourMatch.pickDate}|${scoreKey}`] = scoreVal;
      didAnything = true;
      summary.steps.push(`score persisted: ${home} ${scoreVal} ${away}`);
    } catch(e) {
      console.error("Score-persist error for match", match?.id, e);
    }
  }

  summary.ok = true;
  summary.didAnything = didAnything;
  console.log("Done:", JSON.stringify(summary));
  return { statusCode: 200, body: JSON.stringify(summary) };
};