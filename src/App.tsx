import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

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

const KNOCKOUT_SLOTS = [
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
].map(m => {
  const { bst } = etToBst(m.kickoffET);
  const [etH] = m.kickoffET.split(":").map(Number);
  // Only roll back to previous pick-day if the ET kickoff itself is in the
  // early hours (i.e. genuinely a "overnight" match like 00:00 ET), matching
  // the rule used for GROUP_MATCHES. A normal evening ET kickoff (e.g. 20:00)
  // that lands after midnight BST should NOT be rolled back.
  const earlyHours = etH < 6;
  const pickDate = earlyHours ? prevDateStr(m.etDate) : m.etDate;
  return { ...m, pickDate, kickoffBST: bst, earlyHours };
});

const FLAGS = {
  "Mexico":"🇲🇽","South Africa":"🇿🇦","South Korea":"🇰🇷","Czechia":"🇨🇿",
  "Canada":"🇨🇦","Bosnia & Herz.":"🇧🇦","USA":"🇺🇸","Paraguay":"🇵🇾",
  "Qatar":"🇶🇦","Switzerland":"🇨🇭","Brazil":"🇧🇷","Morocco":"🇲🇦",
  "Haiti":"🇭🇹","Scotland":"🏴󠁧󠁢󠁳󠁣󠁴󠁿","Australia":"🇦🇺","Turkiye":"🇹🇷",
  "Germany":"🇩🇪","Curacao":"🇨🇼","Netherlands":"🇳🇱","Japan":"🇯🇵",
  "Ivory Coast":"🇨🇮","Ecuador":"🇪🇨","Sweden":"🇸🇪","Tunisia":"🇹🇳",
  "Spain":"🇪🇸","Cape Verde":"🇨🇻","Belgium":"🇧🇪","Egypt":"🇪🇬",
  "Saudi Arabia":"🇸🇦","Uruguay":"🇺🇾","Iran":"🇮🇷","New Zealand":"🇳🇿",
  "France":"🇫🇷","Senegal":"🇸🇳","Iraq":"🇮🇶","Norway":"🇳🇴",
  "Argentina":"🇦🇷","Algeria":"🇩🇿","Austria":"🇦🇹","Jordan":"🇯🇴",
  "Portugal":"🇵🇹","DR Congo":"🇨🇩","England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croatia":"🇭🇷",
  "Ghana":"🇬🇭","Panama":"🇵🇦","Uzbekistan":"🇺🇿","Colombia":"🇨🇴","Draw":"⚖️",
};
const f = t => FLAGS[t] || "🏳️";

const GROUP_MATCHES = ALL_GROUP_MATCHES_RAW.map(m => {
  const { bst } = etToBst(m.kickoffET);
  const midnight = m.kickoffET === "00:00";
  const pickDate = midnight ? prevDateStr(m.etDate) : m.etDate;
  return { ...m, pickDate, kickoffBST: bst, earlyHours: midnight };
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

const deadlineBSTByPickDate = {};
Object.entries(deadlineETByPickDate).forEach(([d, et]) => { deadlineBSTByPickDate[d] = etToBst(et).bst; });

const groupPickDates    = [...new Set(GROUP_MATCHES.map(m=>m.pickDate))].sort();
const knockoutPickDates = [...new Set(KNOCKOUT_SLOTS.map(m=>m.pickDate))].sort();
const allPickDates      = [...new Set([...groupPickDates,...knockoutPickDates])].sort();

function phaseOf(d) { if(d<="2026-06-27")return"GROUP"; if(d<="2026-07-07")return"L32_L16"; return"FREE"; }
function nowET() {
  const p=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());
  return `${p.find(x=>x.type==="hour").value.padStart(2,"0")}:${p.find(x=>x.type==="minute").value.padStart(2,"0")}`;
}
function todayET() { return new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York"}).format(new Date()); }
function isLocked(pickDate) {
  const dl=deadlineETByPickDate[pickDate]; if(!dl)return false;
  if(pickDate<todayET())return true; if(pickDate>todayET())return false; return nowET()>=dl;
}

// picks is now { "matchId": "choice" } — one pick per match, not per day
function getPicksInPhase(player, pickDate) {
  const ph=phaseOf(pickDate); if(ph==="FREE")return[];
  // Only count each pick-day's ACTUAL active pick (via getDayPick) — a player can have
  // stale leftover pick entries for OTHER matches on a day they later changed their mind
  // on (only one pick per day is allowed, but old entries for the non-chosen match can
  // remain in the data). Those stale entries must NOT count towards "used teams".
  const datesInPhase = allPickDates.filter(d=>phaseOf(d)===ph);
  return datesInPhase
    .map(d=>getDayPick(player,d))
    .filter(dp=>dp && dp.choice!=="Draw")
    .map(dp=>dp.choice);
}

function fmtBST(bst) { if(!bst)return"—"; const[h,m]=bst.split(":").map(Number),ap=h>=12?"pm":"am",h12=h>12?h-12:h===0?12:h; return`${h12}:${m.toString().padStart(2,"0")}${ap}`; }
function fmtDate(d) { return new Date(d+"T12:00:00Z").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}); }
function fmtDateShort(d) { return new Date(d+"T12:00:00Z").toLocaleDateString("en-GB",{day:"numeric",month:"short"}); }
function slotLabel(slot) {
  // Slot label with FIFA match number
  const labels = {
    "R32-1":  "M73: 2A vs 2B",
    "R32-2":  "M74: 1E vs 3rd(ABCDF)",
    "R32-3":  "M75: 1F vs 2C",
    "R32-4":  "M76: 1C vs 2F",
    "R32-5":  "M77: 1I vs 3rd(CDFGH)",
    "R32-6":  "M78: 2E vs 2I",
    "R32-7":  "M79: 1A vs 3rd(CEFHI)",
    "R32-8":  "M80: 1L vs 3rd(EHIJK)",
    "R32-9":  "M81: 1D vs 3rd(BEFIJ)",
    "R32-10": "M82: 1G vs 3rd(AEHIJ)",
    "R32-11": "M83: 2K vs 2L",
    "R32-12": "M84: 1H vs 2J",
    "R32-13": "M85: 1B vs 3rd(EFGIJ)",
    "R32-14": "M86: 1J vs 2H",
    "R32-15": "M87: 1K vs 3rd(DEIJL)",
    "R32-16": "M88: 2D vs 2G",
    "R16-1":  "M89: W(M74) vs W(M77)",
    "R16-2":  "M90: W(M73) vs W(M75)",
    "R16-3":  "M91: W(M76) vs W(M78)",
    "R16-4":  "M92: W(M79) vs W(M80)",
    "R16-5":  "M93: W(M83) vs W(M84)",
    "R16-6":  "M94: W(M81) vs W(M82)",
    "R16-7":  "M95: W(M86) vs W(M88)",
    "R16-8":  "M96: W(M85) vs W(M87)",
    "QF-1":   "M97: W(M89) vs W(M90)",
    "QF-2":   "M98: W(M93) vs W(M94)",
    "QF-3":   "M99: W(M91) vs W(M92)",
    "QF-4":   "M100: W(M95) vs W(M96)",
    "SF-1":   "M101: W(M97) vs W(M98)",
    "SF-2":   "M102: W(M99) vs W(M100)",
    "3RD":    "M103: 3rd Place Play-off",
    "FINAL":  "M104: Final",
  };
  return labels[slot] || slot;
}
function avatarBg(name) {
  const c=["#b5341a","#7b34a0","#1e6fb5","#0e8c6e","#b56010","#1e8c40","#2c3e50","#b57a10"];
  let h=0; for(let x of name) h=(h*31+x.charCodeAt(0))%c.length; return c[Math.abs(h)];
}
function initials(name) { return name.trim().split(/\s+/).map(w=>w[0]).join("").toUpperCase().slice(0,2); }

// Get the one pick for an entire pick-day (the match they chose + which choice)
function getDayPick(player, pickDate) {
  const matches = [...(matchesByPickDate[pickDate]||[]), ...KNOCKOUT_SLOTS.filter(s=>s.pickDate===pickDate)];
  for (const m of matches) {
    const choice = player.picks[String(m.id)];
    if (choice) return { matchId: String(m.id), choice };
  }
  return null;
}

// Australian green & gold theme
const T = {
  cardBg:"rgba(255,255,255,0.05)", border:"rgba(255,255,255,0.10)",
  amber:"#FFD700", amberBg:"rgba(255,215,0,0.14)", amberBorder:"rgba(255,215,0,0.40)",
  green:"#00843D", greenBg:"rgba(0,132,61,0.15)", greenBorder:"rgba(0,132,61,0.40)",
  red:"#f06060", redBg:"rgba(240,96,96,0.12)", redBorder:"rgba(240,96,96,0.35)",
  blue:"#5ba8e0", blueBg:"rgba(91,168,224,0.12)", blueBorder:"rgba(91,168,224,0.35)",
  text:"#f5f0dc", muted:"#8a9e72", night:"#c084fc",
  cellCorrect:"rgba(0,110,45,0.80)", cellWrong:"rgba(160,30,30,0.82)",
  cellPending:"rgba(160,130,0,0.55)", cellNoPick:"rgba(40,50,60,0.70)",
};
const ADMIN_PW = "worldcup2026";


// ── NavTimer — top-level component, isolated from App re-renders ─────────
function NavTimer({ activeDates, deadlineBSTByPickDate, activePlayer, today, isLocked, getDayPick, setScreen }) {
  const [now, setNow] = useState(()=>new Date());
  useEffect(()=>{ const i=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(i); },[]);

  const tournamentStart = new Date("2026-06-11T19:00:00Z");
  let label, text, color, icon, locked=false, hasPick=false;

  if(now < tournamentStart) {
    const ms = tournamentStart - now;
    const d=Math.floor(ms/86400000),h=Math.floor((ms%86400000)/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000);
    text = d>0?`${d}d ${h}h ${m}m ${s}s`:h>0?`${h}h ${m}m ${s}s`:`${m}m ${s}s`;
    label="GAME BEGINS"; color=T.amber; icon="🏆";
  } else {
    let found = false;
    for(const pickDate of activeDates) {
      const dlBST = deadlineBSTByPickDate[pickDate]; if(!dlBST) continue;
      const [hh,mm] = dlBST.split(":").map(Number);
      // Convert the BST deadline directly to UTC (BST = UTC+1) using explicit UTC date
      // methods — avoids ambiguity from parsing date strings in the browser's local timezone.
      let utcH = hh - 1, dayOffset = 0;
      if(utcH < 0) { utcH += 24; dayOffset = -1; }
      const dlUTC = new Date(pickDate+"T00:00:00Z");
      dlUTC.setUTCDate(dlUTC.getUTCDate()+dayOffset);
      dlUTC.setUTCHours(utcH, mm, 0, 0);
      if(dlUTC > now) {
        const ms=dlUTC-now,d=Math.floor(ms/86400000),h=Math.floor((ms%86400000)/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000);
        text = d>0?`${d}d ${h}h ${m}m ${s}s`:h>0?`${h}h ${m}m ${s}s`:`${m}m ${s}s`;
        hasPick = activePlayer ? !!getDayPick(activePlayer,pickDate) : false;
        const isLockedToday = isLocked(pickDate) && pickDate===today;
        if(isLockedToday) {
          const midnightUTC = new Date(`${pickDate}T04:00:00Z`);
          if(now < midnightUTC) { label="PICKS CLOSED"; text="reopens midnight"; color=T.muted; icon="🔒"; locked=true; found=true; break; }
        }
        label=hasPick?"PICK MADE":"NEXT DEADLINE"; color=hasPick?T.green:T.amber; icon=hasPick?"✅":"⏱";
        found=true; break;
      }
    }
    if(!found){ return null; }
  }

  if(!text) return null;
  return (
    <div onClick={()=>!locked&&setScreen("pick")} style={{borderTop:`1px solid rgba(255,255,255,0.06)`,padding:"7px 18px",background:locked?"rgba(255,255,255,0.02)":hasPick?"rgba(0,132,61,0.10)":"rgba(255,215,0,0.07)",display:"flex",alignItems:"center",justifyContent:"center",gap:12,cursor:locked?"default":"pointer"}}>
      <span style={{fontSize:11,fontWeight:800,letterSpacing:2,textTransform:"uppercase",color,opacity:0.85}}>{icon} {label}</span>
      <span style={{fontSize:19,fontWeight:900,color,letterSpacing:-0.5,fontFamily:"monospace"}}>{text}</span>
    </div>
  );
}

export default function App() {
  const [players,    setPlayers]    = useState([]);
  const [screen,     setScreen]     = useState("profile");
  const [activeId,   setActiveId]   = useState(() => { try { return localStorage.getItem("lps_activeId")||null; } catch { return null; } });
  const [koFixtures, setKoFixtures] = useState({});
  const [results,    setResults]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [toast,       setToast]       = useState(null);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [liveScores,  setLiveScores]  = useState({});
  const [howardsResult, setHowardsResult] = useState(null);
  const [popupSlides, setPopupSlides] = useState(null); // { slides:[{icon,title,body}], key }
  const [popupIdx, setPopupIdx] = useState(0);
  const toastRef = useRef(null);

  // ── Admin screen state, lifted to App level ────────────────────────────
  // Admin() is an inner function component, so it gets a NEW function
  // reference (and is remounted by React) every time App re-renders — e.g.
  // every 60s on the loadAll poll, or every 90s on the live-scores poll.
  // Click/select-driven state (which tab, which player, dropdown choices)
  // lives here so it survives those re-renders without snapping back.
  // NOTE: typing fields (password, rename, fixtures) deliberately stay
  // LOCAL to Admin() — lifting them would mean every keystroke triggers an
  // App re-render, which remounts Admin and makes the input lose focus
  // (you'd only be able to type one character at a time).
  const [adminTab, setAdminTab] = useState("results");
  const [adminEditPicks, setAdminEditPicks] = useState({});
  const [adminSelectedPlayer, setAdminSelectedPlayer] = useState(null);
  const [adminConfirmDelete, setAdminConfirmDelete] = useState(false);


  const activePlayer = players.find(p=>p.id==activeId)||null;
  const today = todayET();

  function toast_(type,msg) { clearTimeout(toastRef.current); setToast({type,msg}); toastRef.current=setTimeout(()=>setToast(null),4500); }

  const loadAll = useCallback(async (isInitial=false) => {
    if(isInitial) setLoading(true);
    try {
      const { data: pData } = await supabase.from("players").select("*").order("lives",{ascending:false});
      const { data: pickData } = await supabase.from("picks").select("*");
      const { data: resData } = await supabase.from("results").select("*");
      const { data: koData } = await supabase.from("ko_fixtures").select("*");

      const picksByPlayer = {};
      (pickData||[]).forEach(pk => {
        if (!picksByPlayer[pk.player_id]) picksByPlayer[pk.player_id] = {};
        const key = pk.match_id || pk.pick_date;
        picksByPlayer[pk.player_id][key] = pk.choice;
      });
      const assembled = (pData||[]).map(p => ({ ...p, picks: picksByPlayer[p.id]||{} }));
      setPlayers(assembled);

      const resObj = {};
      (resData||[]).forEach(r => { resObj[`${r.pick_date}|${r.team}`] = r.outcome; });
      setResults(resObj);

      const koObj = {};
      (koData||[]).forEach(k => { koObj[k.slot_id] = { home: k.home, away: k.away }; });
      setKoFixtures(koObj);

      // Only navigate on initial load, never on background polls
      if(isInitial) {
        const savedId = localStorage.getItem("lps_activeId");
        if (savedId && assembled.find(p=>p.id==savedId)) {
          setActiveId(Number(savedId));
          setScreen("pick");
        }
      }
    } catch(e) {
      if(isInitial) toast_("error","Connection error — check Supabase credentials.");
      console.error(e);
    }
    if(isInitial) setLoading(false);
  }, []); // eslint-disable-line

  useEffect(() => { loadAll(true); }, [loadAll]);
  useEffect(() => { const i=setInterval(()=>loadAll(false),60000); return()=>clearInterval(i); }, [loadAll]);
  useEffect(() => { try { activeId ? localStorage.setItem("lps_activeId",String(activeId)) : localStorage.removeItem("lps_activeId"); } catch {} }, [activeId]);

  // ── POPUP ENGINE ─────────────────────────────────────────────────────────
  const FDORG_TOKEN = "73804200936a4d86acaed8a91a7801ad";

  function seenKey(k) { return `lps_seen_${k}`; }
  function markSeen(k) { try { localStorage.setItem(seenKey(k),"1"); } catch {} }
  function hasSeen(k) { try { return !!localStorage.getItem(seenKey(k)); } catch { return false; } }

  async function generateSlides(prompt, fallbackSlides) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "anthropic-dangerous-direct-browser-access":"true",
        },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{ role:"user", content: prompt }]
        })
      });
      if(!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const raw = data.content?.[0]?.text||"[]";
      const clean = raw.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      if(Array.isArray(parsed) && parsed.length>0) return parsed;
      throw new Error("Empty response");
    } catch(e) {
      console.error("Popup generation error:",e);
      return fallbackSlides || null;
    }
  }

  function showPopupOnce(slides, key) {
    markSeen(key); // mark seen immediately so we never try twice
    if(slides && slides.length>0) {
      setPopupIdx(0);
      setPopupSlides({ slides, key });
    }
  }

  // Check which popups to show
  const checkPopups = useCallback(async () => {
    if(!activeId) return;
    const now = new Date();
    const tournamentStart = new Date("2026-06-11T19:00:00Z");
    const pot = players.length * 10;
    const playerCount = players.length;
    const stillIn = players.filter(p=>!p.eliminated).length;

    // ── SET 1: Hype countdowns ──────────────────────────────────────────
    const msToStart = tournamentStart - now;
    const daysToStart = msToStart / 86400000;

    if(daysToStart > 0) {
      let hypeKey = null;
      if(daysToStart <= 1 && daysToStart > 0)       hypeKey = "hype_1d";
      else if(daysToStart <= 2 && daysToStart > 1)  hypeKey = "hype_2d";
      else if(daysToStart <= 3 && daysToStart > 2)  hypeKey = "hype_3d";
      else if(daysToStart <= 7 && daysToStart > 6)  hypeKey = "hype_7d";

      if(hypeKey && !hasSeen(hypeKey)) {
        const dLabel = hypeKey==="hype_1d"?"1 DAY":hypeKey==="hype_2d"?"2 DAYS":hypeKey==="hype_3d"?"3 DAYS":"7 DAYS";
        const fallback = [
          {icon:"🏆",title:`${dLabel} TO GO`,body:`The Ray Gunn Cup is ${dLabel.toLowerCase()} away. ${playerCount} players entered. One will win £${pot}. The rest will spend the group stage second-guessing themselves.`},
          {icon:"🧠",title:"STUDY THE FORM",body:`12 groups. 48 teams. You can only pick each team once per phase. Think before you pick Brazil in game one and regret it for three weeks.`},
          {icon:"⚡",title:"FEAR HOWARD'S LAW",body:`Miss the deadline and the app automatically picks the lowest-ranked team playing that day on your behalf. It has no conscience. It has no mercy. Set a reminder.`},
        ];
        const slides = await generateSlides(
          `You are the brutally funny, excited host of a World Cup prediction game called "The Ray Gunn Cup — Last Person Standing 2026". 
          Generate exactly 3 hype slides for a countdown popup showing ${dLabel} until the tournament starts.
          Facts: ${playerCount} players, £${pot} pot, game starts June 11th 2026.
          Be genuinely exciting and funny. Short punchy sentences. Australian flavour (the colour scheme is green and gold). 
          Each slide has an icon (single emoji), title (4-6 words, ALL CAPS), and body (2-4 sentences, funny and punchy).
          Respond ONLY with a valid JSON array, no markdown, no preamble:
          [{"icon":"🏆","title":"TITLE HERE","body":"Body text here."},...]`,
          fallback
        );
        showPopupOnce(slides, hypeKey);
        return;
      }
    }

    // ── Matchday hype (day of first game, before deadline) ──────────────
    if(today === "2026-06-11" && !hasSeen("hype_matchday")) {
      const todayMatches = matchesByPickDate["2026-06-11"]||[];
      const slides = await generateSlides(
        `You are the brutally funny host of "The Ray Gunn Cup — Last Person Standing 2026".
        TODAY IS MATCHDAY 1. The World Cup starts TODAY.
        Facts: ${playerCount} players, £${pot} pot, ${todayMatches.length} games to pick from today, deadline 8:00pm BST.
        Generate exactly 3 hype/warning slides. Be electric. Mention how many games there are to pick from (${todayMatches.length}) without naming specific teams.
        Mention the deadline. Mention Howard's Law as a threat to those who don't pick.
        Each slide: icon (emoji), title (ALL CAPS, 4-6 words), body (2-4 punchy funny sentences).
        Respond ONLY with valid JSON array, no markdown:
        [{"icon":"🚨","title":"TITLE","body":"body"},...]`,
        [
          {icon:"🚨",title:"IT STARTS TODAY",body:`The Ray Gunn Cup is LIVE. ${todayMatches.length} games to pick from today. One pick only. Choose wisely.`},
          {icon:"⏰",title:"DEADLINE IS 8PM BST",body:`${playerCount} players. £${pot} pot. Deadline 8:00pm BST. Miss it and Howard's Law will pick for you. Don't be that person.`},
          {icon:"🏆",title:"MAY THE BEST PICK WIN",body:`The tournament has begun. ${playerCount} players. ${playerCount*6} lives between you. Only one will survive. Good luck. You'll need it.`},
        ]
      );
      showPopupOnce(slides, "hype_matchday");
      return;
    }

    // ── SET 2: Post-deadline report ──────────────────────────────────────
    for(const pickDate of [...allPickDates].reverse()) {
      if(pickDate > today) continue;
      if(!isLocked(pickDate)) continue;
      const dlKey = `deadline_${pickDate}_${activeId}`;
      if(hasSeen(dlKey)) continue;

      const dayMatches = getMatchesForPickDate(pickDate);
      if(!dayMatches.length) continue;

      // Build picks data
      const activePlayers = players.filter(p=>!p.eliminated);
      const pickCounts = {};
      const unpicked = [];
      activePlayers.forEach(p=>{
        const dp = getDayPick(p, pickDate);
        if(dp) { pickCounts[dp.choice]=(pickCounts[dp.choice]||0)+1; }
        else unpicked.push(p.name);
      });

      const sorted = Object.entries(pickCounts).sort((a,b)=>b[1]-a[1]);
      const topPick = sorted[0];
      const bottomPick = sorted[sorted.length-1];
      const maverick = bottomPick && bottomPick[1]===1 ? players.find(p=>getDayPick(p,pickDate)?.choice===bottomPick[0]) : null;

      const onThinIce = players.filter(p=>!p.eliminated&&p.lives<=2).map(p=>p.name);

      const slides = await generateSlides(
        `You are the brutally funny host of "The Ray Gunn Cup — Last Person Standing 2026".
        The deadline has just passed for ${fmtDate(pickDate)}. Results not yet known.
        Pick data:
        - Most popular pick: ${topPick?`${topPick[0]} (${topPick[1]} players)`:"none yet"}
        - All picks: ${sorted.map(([t,c])=>`${t}: ${c}`).join(", ")||"none"}
        - Players who missed deadline (Howard's Law victims): ${unpicked.length>0?unpicked.join(", "):"nobody — legend behaviour"}
        - Players on thin ice (2 lives or fewer): ${onThinIce.length>0?onThinIce.join(", "):"none yet"}
        - ${playerCount} total players, £${pot} pot, ${stillIn} still alive
        Generate exactly 4 slides. Be brutal, funny, specific with names. 
        Slide 1: picks summary and bandwagon callout.
        Slide 2: maverick callout OR Howard's Law victims.
        Slide 3: thin ice warning if relevant, otherwise general banter.
        Slide 4: dramatic sign-off building tension before results.
        Each slide: icon (emoji), title (ALL CAPS, 4-6 words), body (2-4 punchy sentences using real player names).
        Respond ONLY with valid JSON array, no markdown:
        [{"icon":"⚽","title":"TITLE","body":"body"},...]`,
        [
          {icon:"⚽",title:"PICKS ARE LOCKED",body:`Deadline has passed for ${fmtDate(pickDate)}. ${topPick?`${topPick[1]} of you backed ${topPick[0]}. The bandwagon is full.`:"All picks are in."} Results incoming.`},
          {icon:unpicked.length>0?"⚡":"🎯",title:unpicked.length>0?"HOWARD'S LAW STRIKES":"EVERYONE PICKED",body:unpicked.length>0?`${unpicked.join(", ")} missed the deadline. Howard's Law has been applied. No sympathy.`:`Every single player made a pick today. Unprecedented scenes. ${maverick?`${maverick.name} went rogue. Noted.`:"Nobody went rogue. Boring."}`},
          {icon:onThinIce.length>0?"💔":"❤️",title:onThinIce.length>0?"THIN ICE WARNING":"LIVES INTACT",body:onThinIce.length>0?`${onThinIce.join(", ")} — one wrong pick from elimination. One bad night and it's over.`:`${stillIn} players still standing. The cull continues. Results will change everything.`},
          {icon:"🔥",title:"RESULTS INCOMING",body:`The games are underway. ${stillIn} players. £${pot} pot. Someone is about to have a very bad evening. Stay tuned.`},
        ]
      );
      showPopupOnce(slides, dlKey);
      return;
    }

    // ── SET 3: Post-results report ───────────────────────────────────────
    for(const pickDate of [...allPickDates].reverse()) {
      if(pickDate > today) continue;
      const resKey = `results_${pickDate}_${activeId}`;
      if(hasSeen(resKey)) continue;

      const dayMatches = getMatchesForPickDate(pickDate);
      if(!dayMatches.length) continue;

      // Check if all matches for this day have results
      const allResultsIn = dayMatches.every(m => {
        return results[`${pickDate}|${m.home}`] || results[`${pickDate}|${m.away}`];
      });
      if(!allResultsIn) continue;

      // Build results data
      const activePlayers = players.filter(p=>!p.eliminated);
      const winners = [], losers = [], eliminated = [];

      // Check previous lives (need to infer from current state)
      players.forEach(p=>{
        const dp = getDayPick(p, pickDate);
        if(!dp) return;
        const outcome = pickOutcomeForDay(p, pickDate);
        if(outcome==="correct") winners.push(p.name);
        else if(outcome==="wrong") {
          losers.push({name:p.name, pick:dp.choice, lives:p.lives});
          if(p.lives===0||p.eliminated) eliminated.push({name:p.name, pick:dp.choice});
        }
      });

      // Match results
      const matchResults = dayMatches.map(m=>{
        const homeRes = results[`${pickDate}|${m.home}`];
        const awayRes = results[`${pickDate}|${m.away}`];
        const winner = homeRes==="win"?m.home:awayRes==="win"?m.away:"Draw";
        return `${m.home} vs ${m.away}: ${winner==="Draw"?"Draw":winner+" won"}`;
      }).join("; ");

      // Midda's Law check
      const midden = activePlayers.length>0 && losers.length===activePlayers.length;

      const slides = await generateSlides(
        `You are the brutally funny host of "The Ray Gunn Cup — Last Person Standing 2026".
        Results are in for ${fmtDate(pickDate)}.
        Results: ${matchResults}
        Players who got it RIGHT: ${winners.join(", ")||"literally nobody"}
        Players who got it WRONG (lost a life): ${losers.map(l=>`${l.name} (picked ${l.pick}, now on ${l.lives} lives)`).join(", ")||"nobody"}
        Players ELIMINATED: ${eliminated.length>0?eliminated.map(e=>`${e.name} (went out on ${e.pick})`).join(", "):"nobody"}
        Midda's Law triggered: ${midden?"YES":"no"}
        Players still in: ${stillIn}, pot: £${pot}
        Generate exactly ${eliminated.length>0?5:4} slides. Be SAVAGE. Australian energy.
        Slide 1: Results summary. Slide 2: Walk of shame roast.
        ${eliminated.length>0?`Slide 3: ELIMINATION of ${eliminated.map(e=>e.name).join(" and ")} — ruthless, mention their team.`:""}
        Slide ${eliminated.length>0?4:3}: ${midden?"Midda's Law chaos celebration":"Leaderboard snapshot"}.
        Slide ${eliminated.length>0?5:4}: Sign-off, build tension for tomorrow.
        Each slide: icon (emoji), title (ALL CAPS), body (2-4 sentences).
        Respond ONLY with valid JSON array, no markdown:
        [{"icon":"💀","title":"TITLE","body":"body"},...]`,
        [
          {icon:"🏁",title:"RESULTS ARE IN",body:`${matchResults}. ${winners.length>0?`${winners.join(", ")} called it right.`:"Nobody called it right."} ${losers.length>0?`${losers.length} player${losers.length!==1?"s":""} lose a life tonight.`:""}`},
          {icon:losers.length>0?"💔":"🎉",title:losers.length>0?"WALK OF SHAME":"CLEAN SHEET",body:losers.length>0?losers.map(l=>`${l.name} backed ${l.pick}. ❤️ down to ${l.lives} live${l.lives!==1?"s":""}.`).join(" "):midden?"Midda's Law! Everyone was wrong. Nobody loses a life. Beautiful chaos.":"Everyone survived today. Don't get used to it."},
          ...(eliminated.length>0?[{icon:"💀",title:`${eliminated.map(e=>e.name.toUpperCase()).join(" & ")} ELIMINATED`,body:`${eliminated.map(e=>`${e.name} went out backing ${e.pick}.`).join(" ")} The Ray Gunn Cup does not accept sympathy cards.`}]:[]),
          {icon:midden?"⚖️":"📊",title:midden?"MIDDA'S LAW ACTIVATED":"LEADERBOARD CHECK",body:midden?`Everyone wrong today. Nobody loses a life. Absolute shambles. Midda's Law saves the group.`:`${stillIn} players still alive. £${pot} in the pot. The pressure is building.`},
          {icon:"⏰",title:"SEE YOU TOMORROW",body:`${stillIn} survivors. £${pot} at stake. Every pick matters now. Don't be Howard tomorrow.`},
        ]
      );
      showPopupOnce(slides, resKey);
      return;
    }
  }, [activeId, players, results, today]); // eslint-disable-line

  // Check popups when players/results load or active player changes
  useEffect(() => {
    if(players.length>0 && activeId) {
      const t = setTimeout(checkPopups, 1500); // slight delay so app loads first
      return ()=>clearTimeout(t);
    }
  }, [activeId, players.length, Object.keys(results).length]); // eslint-disable-line

  // ── AUTO RESULTS — polls football-data.org every 5 mins ──────────────

  // Map football-data.org team names → our team names
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

  const autoResultsRef = useRef(false);

  const checkAutoResults = useCallback(async (currentResults, currentPlayers) => {
    try {
      // Single unfiltered fetch — returns ALL matches with their individual status
      // fields (FINISHED, IN_PLAY, PAUSED, HALFTIME, SCHEDULED, TIMED, etc). A
      // status-filtered fetch (e.g. status=SCHEDULED) risks silently missing matches
      // with a different "not started yet" status like TIMED, which previously caused
      // pick-days to be marked "fully done" prematurely.
      const res = await fetch("/.netlify/functions/fdorg?path=competitions%2FWC%2Fmatches");
      if(!res.ok) return;
      const data = await res.json();
      const allMatches = data.matches || [];
      const finishedMatches = allMatches.filter(m => m.status === "FINISHED");
      const notFinished = allMatches.filter(m => m.status !== "FINISHED");

      // Build sets of "home|away" team-pairs that are currently live or still pending —
      // keyed by TEAMS rather than date, since an early-hours match (e.g. kickoff 00:00 ET)
      // has a different `etDate` (API date) than its `pickDate` (rolled back to the
      // previous day), so date-keyed sets would miss it when checking if a pick-day
      // is "fully done".
      const teamPairKeys = (m) => {
        const home = TEAM_NAME_MAP[m.homeTeam?.name] || m.homeTeam?.name;
        const away = TEAM_NAME_MAP[m.awayTeam?.name] || m.awayTeam?.name;
        return [`${home}|${away}`, `${away}|${home}`];
      };
      const liveTeamPairs = new Set(
        notFinished.filter(m=>["IN_PLAY","PAUSED","HALFTIME"].includes(m.status)).flatMap(teamPairKeys)
      );
      // "Pending" = anything not finished and not currently live (SCHEDULED, TIMED, etc)
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
        if(currentResults[`${etDate}|${home}`]) return; // already logged
        // Find OUR app's match id for this fixture (needed for the Draw#<id> sentinel key)
        const ourMatch = GROUP_MATCHES.find(m => m.etDate===etDate && ((m.home===home&&m.away===away)||(m.home===away&&m.away===home)))
          || KNOCKOUT_SLOTS.filter(s=>koFixtures[s.id]).find(s => {
              const f = koFixtures[s.id];
              return (f.home===home&&f.away===away)||(f.home===away&&f.away===home);
            });
        if(!newlyFinishedByDate[etDate]) newlyFinishedByDate[etDate] = [];
        newlyFinishedByDate[etDate].push({match, home, away, etDate, ourMatchId: ourMatch?.id});
      });

      // Note: we deliberately do NOT early-return when newlyFinishedByDate is empty —
      // the lives-deduction pass below must still run for previously-unprocessed days.

      const active = currentPlayers.filter(p=>!p.eliminated&&p.lives>0);
      let didAnything = false;
      const updatedResults = {...currentResults};

      // Step 1: Log results for all newly finished matches (across all dates)
      for(const [etDate, dayMatches] of Object.entries(newlyFinishedByDate)) {
        for(const {match, home, away, etDate:pd, ourMatchId} of dayMatches) {
          const score = match.score.fullTime;
          // Use the API's overall `score.winner` field (HOME_TEAM/AWAY_TEAM/DRAW) where
          // available — this correctly reflects extra-time/penalty outcomes for
          // knockout matches, where the 90-minute fullTime score may be level even
          // though the match has a winner. Fall back to comparing fullTime goals
          // (group-stage matches, or older data without a winner field).
          const winnerSide = match.score?.winner; // "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null
          let isDraw, winTeam, loseTeam;
          if(winnerSide === "HOME_TEAM" || winnerSide === "AWAY_TEAM") {
            isDraw = false;
            winTeam = winnerSide === "HOME_TEAM" ? home : away;
            loseTeam = winnerSide === "HOME_TEAM" ? away : home;
          } else if(winnerSide === "DRAW") {
            isDraw = true; winTeam = home; loseTeam = away;
          } else {
            // No winner field — fall back to fullTime comparison
            isDraw = score.home === score.away;
            winTeam = isDraw ? home : score.home > score.away ? home : away;
            loseTeam = isDraw ? away : score.home > score.away ? away : home;
          }
          // Use OUR app's match id for the Draw sentinel — must match what pickOutcomeForMatch looks up.
          // Fall back to the API match id only if we couldn't resolve our own (shouldn't normally happen).
          const drawKey = `Draw#${ourMatchId ?? match.id ?? match.matchId ?? ""}`;
          console.log(`Auto-logging: ${home} ${score.home}-${score.away} ${away} on ${pd} (winner=${winnerSide}, ourMatchId=${ourMatchId})`);
          const rows = isDraw
            ? [{pick_date:pd,team:drawKey,outcome:"draw_correct"},{pick_date:pd,team:home,outcome:"draw_wrong"},{pick_date:pd,team:away,outcome:"draw_wrong"}]
            : [{pick_date:pd,team:winTeam,outcome:"win"},{pick_date:pd,team:loseTeam,outcome:"lose"},{pick_date:pd,team:drawKey,outcome:"draw_wrong"}];
          await supabase.from("results").upsert(rows,{onConflict:"pick_date,team"});
          rows.forEach(r => { updatedResults[`${pd}|${r.team}`] = r.outcome; });
          didAnything = true;
        }
      }

      // Step 2/3: Lives deduction — run for EVERY locked pick-day not yet fully wrapped
      // up, regardless of whether anything newly finished THIS poll. This ensures a day
      // that was left "holding" (Midda's still possible) on a previous poll gets
      // re-evaluated once newer results (or a code fix) change the picture.
      const datesToCheck = allPickDates.filter(d =>
        isLocked(d) && getMatchesForPickDate(d).length>0 && !updatedResults[`${d}|__lives_done__`]
      );

      for(const etDate of datesToCheck) {
        // Step 2: Check who's wrong so far for this pick day.
        // Check EVERY match belonging to this pick-day (including early-hours matches
        // whose own etDate is the NEXT calendar day) by team-pair, not by date.
        const dayMatchesAll = getMatchesForPickDate(etDate);
        const dayStillPlaying = dayMatchesAll.some(m => liveTeamPairs.has(`${m.home}|${m.away}`));
        const dayHasPending = dayMatchesAll.some(m => pendingTeamPairs.has(`${m.home}|${m.away}`));
        const dayFullyDone = !dayStillPlaying && !dayHasPending;

        // Find everyone's outcome for this pick day.
        // "Draw" picks are stored as match-specific "Draw#<matchId>" keys (since a draw
        // on one match must not be confused with a "Draw" pick on a different match the
        // same day) — so the lookup key must account for that.
        const outcomeFor = (p) => {
          const dp = getDayPick(p, etDate);
          if(!dp) return { dp, outcome: undefined };
          const lookupKey = dp.choice === "Draw" ? `Draw#${dp.matchId}` : dp.choice;
          return { dp, outcome: updatedResults[`${etDate}|${lookupKey}`] };
        };

        const playersWrong = active.filter(p => {
          const { dp, outcome } = outcomeFor(p);
          if(!dp) return true; // no pick = wrong
          if(!outcome) return null; // match not finished yet — unknown
          return outcome === "lose" || outcome === "draw_wrong";
        });

        const playersCorrect = active.filter(p => {
          const { dp, outcome } = outcomeFor(p);
          if(!dp) return false;
          return outcome === "win" || outcome === "draw_correct";
        });

        const playersUnknown = active.filter(p => {
          const { dp, outcome } = outcomeFor(p);
          if(!dp) return false;
          return !outcome; // their match hasn't finished yet
        });

        // Step 3: Decide whether to update lives now or wait
        const middasPossible = playersCorrect.length === 0; // nobody correct yet

        if(dayFullyDone) {
          // All matches done — final pass. Process anyone not yet marked as processed.
          const everyoneWrong = playersWrong.length === active.length && active.length > 0;
          const toProcess = active.filter(p => !updatedResults[`${etDate}|__processed__${p.id}`]);
          if(everyoneWrong) {
            console.log(`Midda's Law — everyone wrong on ${etDate}, no lives lost`);
          } else {
            const wrongToProcess = toProcess.filter(p => playersWrong.includes(p));
            const updates = wrongToProcess.map(p => {
              const nl = p.lives - 1;
              return supabase.from("players").update({lives:nl,eliminated:nl===0}).eq("id",p.id);
            });
            if(updates.length > 0) { await Promise.all(updates); didAnything = true; }
          }
          // Mark this pick day as fully wrapped up so we never touch lives for it again
          await supabase.from("results").upsert(
            [{pick_date:etDate,team:"__lives_done__",outcome:"done"}],
            {onConflict:"pick_date,team"}
          );
          updatedResults[`${etDate}|__lives_done__`] = "done";
          didAnything = true;
        } else if(!middasPossible) {
          // At least one person is correct — Midda's impossible.
          // Deduct lives now for anyone DEFINITELY wrong (their match has finished) who hasn't
          // already been processed. Players still waiting on a pending match (playersUnknown)
          // are left untouched and will be picked up on a later poll once their match finishes.
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
          }
        } else {
          // Midda's Law still possible — don't update lives yet, wait for remaining matches
          console.log(`Midda's Law still possible on ${etDate} — holding lives update`);
        }
      }

      // Final step: Persist the final score for EVERY finished match (not
      // just newly-finished ones — this runs every poll so it backfills
      // existing results too). Stored under OUR app's pickDate/matchId as
      // "__score__<matchId>" = "H-A" (optionally ":EXTRA_TIME"/":PENALTY_SHOOTOUT").
      // This lets the Schedule show "FT 2-0" purely from our own Supabase
      // data — no live-scores API call needed for matches that finished
      // long ago, so a transient rate-limit/API issue never makes old
      // results disappear from the Schedule again.
      // Deliberately runs LAST, with each match wrapped in its own
      // try/catch: if one match has unexpected/missing data, it must NOT
      // prevent the pick-resolution and lives-deduction logic above (the
      // critical part) from completing.
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
          if(!ourMatch) continue; // can't resolve to one of our scheduled matches yet
          const dur = match.score?.duration; // REGULAR | EXTRA_TIME | PENALTY_SHOOTOUT
          const scoreVal = `${score.home}-${score.away}` + (dur && dur!=="REGULAR" ? `:${dur}` : "");
          const scoreKey = `__score__${ourMatch.id}`;
          if(updatedResults[`${ourMatch.pickDate}|${scoreKey}`] === scoreVal) continue; // already up to date
          await supabase.from("results").upsert([{pick_date:ourMatch.pickDate,team:scoreKey,outcome:scoreVal}],{onConflict:"pick_date,team"});
          updatedResults[`${ourMatch.pickDate}|${scoreKey}`] = scoreVal;
          didAnything = true;
        } catch(e) {
          console.error("Score-persist error for match", match?.id, e);
        }
      }

      if(didAnything) loadAll(false);
    } catch(e) {
      console.error("Auto results error:", e);
    }
  }, [loadAll]); // eslint-disable-line

  // Run auto results check every 5 minutes
  useEffect(() => {
    const run = () => checkAutoResults(results, players);
    run();
    const i = setInterval(run, 10 * 60 * 1000);
    return () => clearInterval(i);
  }, [results, players, checkAutoResults]);

  // Automatically apply Howard's Law to anyone who hasn't picked once a pick-day's
  // deadline has passed. Idempotent — only inserts picks for currently-unpicked
  // players, so safe to run repeatedly.
  useEffect(() => {
    const run = () => {
      if(!players.length) return;
      for(const pickDate of allPickDates) {
        if(!isLocked(pickDate)) continue; // deadline hasn't passed yet
        if(results[`${pickDate}|__howards_done__`]) continue; // permanently processed — never re-check
        const unpicked = players.filter(p=>p.lives>0&&!p.eliminated&&!getDayPick(p,pickDate));
        if(unpicked.length>0) applyHowardsLawSilent(pickDate);
      }
    };
    run();
    const i = setInterval(run, 5 * 60 * 1000);
    return () => clearInterval(i);
  }, [players, results]); // eslint-disable-line

  // ── AUTO FIXTURES — populates knockout slots from API standings ───────
  // R32 fixed pairings (slot id → {home: "1A" or "2B" etc, away: "3X"})
  // Based on FIFA official bracket
  const R32_BRACKET = {
    73:  { home:"2A", away:"2B" },
    74:  { home:"1E", away:"3rd" },   // 3rd from A/B/C/D/F
    75:  { home:"1F", away:"2C" },
    76:  { home:"1C", away:"2F" },
    77:  { home:"1I", away:"3rd" },   // 3rd from C/D/F/G/H
    78:  { home:"2E", away:"2I" },
    79:  { home:"1A", away:"3rd" },   // 3rd from C/E/F/H/I
    80:  { home:"1L", away:"3rd" },   // 3rd from E/H/I/J/K
    81:  { home:"1D", away:"3rd" },   // 3rd from B/E/F/I/J
    82:  { home:"1G", away:"3rd" },   // 3rd from A/E/H/I/J
    83:  { home:"2K", away:"2L" },
    84:  { home:"1H", away:"2J" },
    85:  { home:"1B", away:"3rd" },   // 3rd from E/F/G/I/J
    86:  { home:"1J", away:"2H" },
    87:  { home:"1K", away:"3rd" },   // 3rd from D/E/I/J/L
    88:  { home:"2D", away:"2G" },
  };

  // R16 bracket — winner of R32 match X plays winner of R32 match Y
  const R16_BRACKET = {
    89:  { home:"W74",  away:"W77"  },  // W(1E v 3rd) v W(1I v 3rd)
    90:  { home:"W73",  away:"W75"  },  // W(2A v 2B) v W(1F v 2C)
    91:  { home:"W76",  away:"W78"  },  // W(1C v 2F) v W(2E v 2I)
    92:  { home:"W79",  away:"W80"  },  // W(1A v 3rd) v W(1L v 3rd)
    93:  { home:"W83",  away:"W84"  },  // W(2K v 2L) v W(1H v 2J)
    94:  { home:"W81",  away:"W82"  },  // W(1D v 3rd) v W(1G v 3rd)
    95:  { home:"W86",  away:"W88"  },  // W(1J v 2H) v W(2D v 2G)
    96:  { home:"W85",  away:"W87"  },  // W(1B v 3rd) v W(1K v 3rd)
  };

  // QF bracket
  const QF_BRACKET = {
    97:  { home:"W89",  away:"W90"  },  // W(89) v W(90)
    98:  { home:"W93",  away:"W94"  },  // W(93) v W(94)
    99:  { home:"W91",  away:"W92"  },  // W(91) v W(92)
    100: { home:"W95",  away:"W96"  },  // W(95) v W(96)
  };

  // SF bracket
  const SF_BRACKET = {
    101: { home:"W97",  away:"W98"  },
    102: { home:"W99",  away:"W100" },
  };

  // 3rd place & Final
  const FINAL_BRACKET = {
    103: { home:"L101", away:"L102" }, // 3rd place: losers of semis
    104: { home:"W101", away:"W102" }, // Final: winners of semis
  };

  // Annex C — maps sorted set of qualifying 3rd-place groups to slot assignments
  // Format: key = sorted groups joined e.g. "CDEFGHIJ"
  // value = {1A,1B,1D,1E,1G,1I,1K,1L} opponents for 3rd place slots
  // (only need the 8 "winner vs 3rd" slots — 74,77,79,80,81,82,85,87)
  // Slots map: [74,79,77,80,81,82,85,87] → opponents for 1E,1A,1I,1L,1D,1G,1B,1K
  const ANNEX_C = {
    "EFGHIJKL": ["3E","3J","3I","3F","3H","3G","3L","3K"],
    "DFGHIJKL": ["3H","3G","3I","3D","3J","3F","3L","3K"],
    "DEGHIJKL": ["3E","3J","3I","3D","3H","3G","3L","3K"],
    "DEFHIJKL": ["3E","3J","3I","3D","3H","3F","3L","3K"],
    "DEFGIJKL": ["3E","3G","3I","3D","3J","3F","3L","3K"],
    "DEFGHJKL": ["3E","3G","3J","3D","3H","3F","3L","3K"],
    "DEFGHIKL": ["3E","3G","3I","3D","3H","3F","3L","3K"],
    "DEFGHIJL": ["3E","3G","3J","3D","3H","3F","3L","3I"],
    "DEFGHIJK": ["3E","3G","3J","3D","3H","3F","3I","3K"],
    "CFGHIJKL": ["3H","3G","3I","3C","3J","3F","3L","3K"],
    "CEGHIJKL": ["3E","3J","3I","3C","3H","3G","3L","3K"],
    "CEFHIJKL": ["3E","3J","3I","3C","3H","3F","3L","3K"],
    "CEFGIJKL": ["3E","3G","3I","3C","3J","3F","3L","3K"],
    "CEFGHJKL": ["3E","3G","3J","3C","3H","3F","3L","3K"],
    "CEFGHIKL": ["3E","3G","3I","3C","3H","3F","3L","3K"],
    "CEFGHIJL": ["3E","3G","3J","3C","3H","3F","3L","3I"],
    "CEFGHIJK": ["3E","3G","3J","3C","3H","3F","3I","3K"],
    "CDGHIJKL": ["3H","3G","3I","3C","3J","3D","3L","3K"],
    "CDFHIJKL": ["3C","3J","3I","3D","3H","3F","3L","3K"],
    "CDFGIJKL": ["3C","3G","3I","3D","3J","3F","3L","3K"],
    "CDFGHJKL": ["3C","3G","3J","3D","3H","3F","3L","3K"],
    "CDFGHIKL": ["3C","3G","3I","3D","3H","3F","3L","3K"],
    "CDFGHIJL": ["3C","3G","3J","3D","3H","3F","3L","3I"],
    "CDFGHIJK": ["3C","3G","3J","3D","3H","3F","3I","3K"],
    "CDEHIJKL": ["3E","3J","3I","3C","3H","3D","3L","3K"],
    "CDEGHIJKL":["3E","3G","3I","3C","3J","3D","3L","3K"], // fallback shouldn't happen but safety
    "CDEGJKL":  ["3E","3G","3I","3C","3J","3D","3L","3K"],
    "CDEGHKL":  ["3E","3G","3J","3C","3H","3D","3L","3K"],
    "CDEGIJKL": ["3E","3G","3I","3C","3J","3D","3L","3K"],
    "CDEGIIL":  ["3E","3G","3I","3C","3J","3D","3L","3K"],
    "CDEGHJKL": ["3E","3G","3J","3C","3H","3D","3L","3K"],
    "CDEGHIKL": ["3E","3G","3I","3C","3H","3D","3L","3K"],
    "CDEGHIJL": ["3E","3G","3J","3C","3H","3D","3L","3I"],
    "CDEGHIJK": ["3E","3G","3J","3C","3H","3D","3I","3K"],
  };

  // Slots that need 3rd-place teams, in order matching ANNEX_C columns [1E,1A,1I,1L,1D,1G,1B,1K]
  const THIRD_PLACE_SLOTS = [74, 79, 77, 80, 81, 82, 85, 87];

  const checkAutoFixtures = useCallback(async (currentKoFixtures) => {
    try {
      // Get group standings from API
      const res = await fetch(
        "/.netlify/functions/fdorg?path=competitions%2FWC%2Fstandings"
      );
      if(!res.ok) return;
      const data = await res.json();
      const standings = data.standings || [];

      // Build group results: { A: [{team, points, gd, gf, pos}], B: [...], ... }
      const groups = {};
      for(const standing of standings) {
        if(standing.type !== "TOTAL") continue;
        const group = standing.group?.replace("GROUP_","") || standing.stage;
        if(!group || group.length !== 1) continue;
        groups[group] = standing.table.map(row => ({
          team: TEAM_NAME_MAP[row.team?.name] || row.team?.name,
          points: row.points,
          gd: row.goalDifference,
          gf: row.goalsFor,
          pos: row.position,
          played: row.playedGames,
        }));
      }

      // Check if group stage is finished (all teams played 3 games)
      const allGroupsDone = Object.values(groups).every(g =>
        g.length >= 4 && g.every(t => t.played >= 3)
      );

      // Populate R32 for any group that has finished
      const newFixtures = {};

      for(const [group, table] of Object.entries(groups)) {
        const done = table.length >= 4 && table.every(t => t.played >= 3);
        if(!done) continue;

        const winner = table.find(t=>t.pos===1)?.team;
        const runnerUp = table.find(t=>t.pos===2)?.team;
        if(!winner || !runnerUp) continue;

        // Find R32 slots involving this group's winner or runner-up
        for(const [slotId, bracket] of Object.entries(R32_BRACKET)) {
          const sid = Number(slotId);
          if(currentKoFixtures[sid]) continue; // already set

          if(bracket.home === `1${group}` && winner) {
            newFixtures[sid] = newFixtures[sid] || {};
            newFixtures[sid].home = winner;
          }
          if(bracket.away === `1${group}` && winner) {
            newFixtures[sid] = newFixtures[sid] || {};
            newFixtures[sid].away = winner;
          }
          if(bracket.home === `2${group}` && runnerUp) {
            newFixtures[sid] = newFixtures[sid] || {};
            newFixtures[sid].home = runnerUp;
          }
          if(bracket.away === `2${group}` && runnerUp) {
            newFixtures[sid] = newFixtures[sid] || {};
            newFixtures[sid].away = runnerUp;
          }
        }
      }

      // Handle third-place slots once all groups are done
      if(allGroupsDone) {
        // Collect all 3rd place teams
        const thirds = Object.entries(groups)
          .filter(([,t]) => t.length >= 3)
          .map(([group, table]) => ({
            group,
            team: table.find(t=>t.pos===3)?.team,
            points: table.find(t=>t.pos===3)?.points || 0,
            gd: table.find(t=>t.pos===3)?.gd || 0,
            gf: table.find(t=>t.pos===3)?.gf || 0,
          }))
          .filter(t => t.team);

        // Sort by points, then GD, then GF to find best 8
        thirds.sort((a,b) => b.points-a.points || b.gd-a.gd || b.gf-a.gf);
        const best8 = thirds.slice(0, 8);
        const qualGroups = best8.map(t=>t.group).sort().join("");

        // Look up Annex C
        const annexRow = ANNEX_C[qualGroups];
        if(annexRow) {
          THIRD_PLACE_SLOTS.forEach((slotId, i) => {
            if(currentKoFixtures[slotId]) return;
            const thirdCode = annexRow[i]; // e.g. "3E"
            const thirdGroup = thirdCode.slice(1);
            const thirdTeam = best8.find(t=>t.group===thirdGroup)?.team;
            if(thirdTeam) {
              newFixtures[slotId] = newFixtures[slotId] || {};
              newFixtures[slotId].away = thirdTeam;
            }
          });
        }
      }

      // Now handle R16/QF/SF/Final from knockout results
      // Get finished knockout matches from API
      const koRes = await fetch(
        "/.netlify/functions/fdorg?path=competitions%2FWC%2Fmatches%3Fstage%3DLAST_16%2CQUARTER_FINALS%2CSEMI_FINALS%2CFINAL%26status%3DFINISHED"
      );
      if(koRes.ok) {
        const koData = await koRes.json();
        const koMatches = koData.matches || [];

        // Map API match IDs to our slot IDs using kickoff date + teams
        // For each finished KO match, find winner and populate next round
        for(const match of koMatches) {
          const home = TEAM_NAME_MAP[match.homeTeam?.name] || match.homeTeam?.name;
          const away = TEAM_NAME_MAP[match.awayTeam?.name] || match.awayTeam?.name;

          // Knockout matches can go to extra time/penalties, so the 90-minute
          // fullTime score may be level even though there IS a winner. Use the
          // API's overall `score.winner` field (HOME_TEAM/AWAY_TEAM), which
          // accounts for extra time and penalties, rather than comparing
          // fullTime goals directly.
          const winnerSide = match.score?.winner; // "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null
          if(winnerSide !== "HOME_TEAM" && winnerSide !== "AWAY_TEAM") continue; // not decided yet / data incomplete
          const winner = winnerSide === "HOME_TEAM" ? home : away;
          const loser  = winnerSide === "HOME_TEAM" ? away : home;

          // Find which slot this match corresponds to in our app
          // by matching the teams to existing ko fixtures
          const matchSlot = Object.entries({...currentKoFixtures,...newFixtures})
            .find(([,fix]) => fix.home===home && fix.away===away || fix.home===away && fix.away===home);

          if(!matchSlot) continue;
          const slotId = Number(matchSlot[0]);
          const winCode = `W${slotId}`;
          const loseCode = `L${slotId}`;

          // Find next round slots that need this winner/loser
          for(const brackets of [R16_BRACKET, QF_BRACKET, SF_BRACKET, FINAL_BRACKET]) {
            for(const [nextSlotId, bracket] of Object.entries(brackets)) {
              const nsid = Number(nextSlotId);
              if(currentKoFixtures[nsid]) continue;
              if(bracket.home === winCode) {
                newFixtures[nsid] = newFixtures[nsid] || {};
                newFixtures[nsid].home = winner;
              }
              if(bracket.away === winCode) {
                newFixtures[nsid] = newFixtures[nsid] || {};
                newFixtures[nsid].away = winner;
              }
              if(bracket.home === loseCode) {
                newFixtures[nsid] = newFixtures[nsid] || {};
                newFixtures[nsid].home = loser;
              }
              if(bracket.away === loseCode) {
                newFixtures[nsid] = newFixtures[nsid] || {};
                newFixtures[nsid].away = loser;
              }
            }
          }
        }
      }

      // Save any complete new fixtures (both home and away known)
      const saves = [];
      for(const [slotId, fix] of Object.entries(newFixtures)) {
        if(fix.home && fix.away) {
          saves.push(
            supabase.from("ko_fixtures").upsert(
              { slot_id: Number(slotId), home: fix.home, away: fix.away },
              { onConflict: "slot_id" }
            )
          );
          console.log(`Auto-fixture: slot ${slotId} → ${fix.home} vs ${fix.away}`);
        }
      }
      if(saves.length > 0) {
        await Promise.all(saves);
        loadAll(false);
      }
    } catch(e) {
      console.error("Auto fixtures error:", e);
    }
  }, [loadAll]); // eslint-disable-line

  // Check fixtures every 10 minutes (less frequent than results)
  useEffect(() => {
    const run = () => checkAutoFixtures(koFixtures);
    run();
    const i = setInterval(run, 10 * 60 * 1000);
    return () => clearInterval(i);
  }, [koFixtures, checkAutoFixtures]);

  // ── LIVE SCORES — single call for all WC matches, filter client-side ───
  const fetchLiveScores = useCallback(async () => {
    try {
      const res = await fetch(
        "/.netlify/functions/fdorg?path=competitions%2FWC%2Fmatches"
      );
      if(!res.ok) { console.log("Live scores fetch failed:", res.status); return; }
      const data = await res.json();
      console.log("Live scores: got", data.matches?.length, "matches");
      const scores = {};
      (data.matches||[]).forEach(m => {
        const status = m.status;
        const isLive = ["IN_PLAY","PAUSED","HALFTIME"].includes(status);
        const isFinished = status === "FINISHED";
        // Include all live and finished matches — the API returns the full
        // tournament in one call anyway, so there's no extra cost to showing
        // historical scores too (avoids the "–" placeholder fallback).
        if(!isLive && !isFinished) return;
        const home = TEAM_NAME_MAP[m.homeTeam?.name] || m.homeTeam?.name;
        const away = TEAM_NAME_MAP[m.awayTeam?.name] || m.awayTeam?.name;
        if(!home || !away) return;
        const key = `${home}|${away}`;
        scores[key] = {
          home, away,
          homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0,
          awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0,
          minute: m.minute || null,
          status,
          // "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT" — used to show an ET/P
          // indicator on finished knockout matches decided beyond 90 minutes.
          duration: m.score?.duration || "REGULAR",
        };
        console.log(`Score: ${home} ${scores[key].homeScore}-${scores[key].awayScore} ${away} [${status}]`);
      });
      setLiveScores(scores);
    } catch(e) {
      console.error("Live scores error:", e);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    fetchLiveScores();
    const i = setInterval(fetchLiveScores, 180000); // every 3min — with ~50 players each polling independently, frequent polling risks hitting football-data.org's rate limit
    return () => clearInterval(i);
  }, [fetchLiveScores]);

  // pickOutcome for grid — check if the player has a pick for this match on this date
  function pickOutcomeForMatch(player, matchId, pickDate) {
    const choice = player.picks[String(matchId)];
    const locked = isLocked(pickDate);
    if (!choice) return locked ? "locked_nopick" : "future";
    // "Draw" is not a real team — make the result lookup match-specific so a draw
    // on ONE match doesn't mark a "Draw" pick on a DIFFERENT match (same pick-day) as correct.
    const lookupKey = choice === "Draw" ? `Draw#${matchId}` : choice;
    const r = results[`${pickDate}|${lookupKey}`];
    if (!r) return locked ? "pending" : "future";
    return (r==="win"||r==="draw_correct") ? "correct" : (r==="lose"||r==="draw_wrong") ? "wrong" : "pending";
  }

  // For the grid, we want to show a player's pick for an entire day
  function pickOutcomeForDay(player, pickDate) {
    const dayPick = getDayPick(player, pickDate);
    if (!dayPick) return isLocked(pickDate) ? "locked_nopick" : "future";
    return pickOutcomeForMatch(player, dayPick.matchId, pickDate);
  }

  function getMatchesForPickDate(pickDate) {
    const gm = matchesByPickDate[pickDate]||[];
    const km = KNOCKOUT_SLOTS.filter(s=>s.pickDate===pickDate&&koFixtures[s.id]).map(s=>({...s,...koFixtures[s.id],isKnockout:true}));
    return [...gm,...km];
  }
  const activeDates = allPickDates.filter(d => groupPickDates.includes(d) || KNOCKOUT_SLOTS.filter(s=>s.pickDate===d).some(s=>koFixtures[s.id]));

  // Make a pick for a specific match
  async function makePick(pid, pickDate, matchId, choice) {
    if(isLocked(pickDate)){toast_("error","🔒 Deadline passed!"); return;}
    const player = players.find(p=>p.id===pid);
    if(!player) return;

    // Check: player can only have ONE pick across the whole day
    const existingDayPick = getDayPick(player, pickDate);
    if (existingDayPick && existingDayPick.matchId !== String(matchId)) {
      toast_("error","You already have a pick for today — clear it first to change.");
      return;
    }

    // Check phase repeat restriction
    const used = getPicksInPhase(player, pickDate);
    if(choice!=="Draw" && used.includes(choice) && player.picks[String(matchId)]!==choice){
      toast_("error",`${f(choice)} ${choice} already used this phase!`);
      return;
    }

    // Optimistic update
    setPlayers(prev=>prev.map(p=>p.id!==pid?p:{...p,picks:{...p.picks,[String(matchId)]:choice}}));
    toast_("success",`${f(choice)} ${choice==="Draw"?"Draw":choice} locked in!`);

    const { error } = await supabase.from("picks").upsert(
      { player_id: pid, pick_date: pickDate, match_id: String(matchId), choice },
      { onConflict: "player_id,pick_date,match_id" }
    );
    if(error){ toast_("error","Save failed — try again."); loadAll(); }
  }

  async function clearPick(pid, pickDate, matchId) {
    if(isLocked(pickDate)){toast_("error","🔒 Deadline passed!");return;}
    setPlayers(prev=>prev.map(p=>{ if(p.id!==pid)return p; const np={...p.picks};delete np[String(matchId)]; return{...p,picks:np}; }));
    toast_("info","Pick cleared.");
    await supabase.from("picks").delete().eq("player_id",pid).eq("pick_date",pickDate).eq("match_id",String(matchId));
  }

  async function registerPlayer(name, password) {
    const { data, error } = await supabase.from("players").insert({ name:name.trim(), password, lives:6, eliminated:false }).select().single();
    if(error){ if(error.code==="23505")return"Name already taken."; return"Registration failed."; }
    setPlayers(prev=>[...prev,{...data,picks:{}}]);
    setActiveId(data.id); setScreen("pick");
    toast_("success",`Welcome, ${name}! You have 6 ❤️`);
    return null;
  }

  function loginPlayer(player, password) {
    if(password!==player.password)return"Wrong password.";
    setActiveId(player.id); setScreen("pick");
    return null;
  }

  async function logResult(pickDate, matchId, winTeam, loseTeam, wasDraw) {
    const drawKey = `Draw#${matchId}`;
    const rows = wasDraw
      ? [{pick_date:pickDate,team:drawKey,outcome:"draw_correct"},{pick_date:pickDate,team:winTeam,outcome:"draw_wrong"},{pick_date:pickDate,team:loseTeam,outcome:"draw_wrong"}]
      : [{pick_date:pickDate,team:winTeam,outcome:"win"},{pick_date:pickDate,team:loseTeam,outcome:"lose"},{pick_date:pickDate,team:drawKey,outcome:"draw_wrong"}];
    await supabase.from("results").upsert(rows,{onConflict:"pick_date,team"});

    const active = players.filter(p=>!p.eliminated&&p.lives>0);

    // Who loses a life? Only players whose pick was FOR THIS MATCH and was wrong.
    const losers = active.filter(p => {
      const dp = getDayPick(p, pickDate);
      if (!dp) return true; // no pick = Howard's law = lose a life
      if (String(dp.matchId) !== String(matchId)) return false; // picked a different match this day — not affected by this result
      return wasDraw ? dp.choice!=="Draw" : (dp.choice===loseTeam||dp.choice==="Draw");
    });

    if(!wasDraw && losers.length===active.length && active.length>0){
      toast_("info","⚖️ Midda's Law — everyone wrong, no lives lost!");
      loadAll(); return;
    }

    const updates = [];
    for(const p of losers){
      const nl=p.lives-1; updates.push(supabase.from("players").update({lives:nl,eliminated:nl===0}).eq("id",p.id));
    }
    await Promise.all(updates);
    toast_("success","Result logged. Lives updated.");
    loadAll();
  }

  async function applyHowardsLaw(pickDate) {
    const result = await applyHowardsLawCore(pickDate);
    if(result === null) { toast_("info","All active players already have picks."); return; }
    setHowardsResult(result);
  }

  // Silent version for automatic background application — no toast/modal popup
  async function applyHowardsLawSilent(pickDate) {
    await applyHowardsLawCore(pickDate);
  }

  async function applyHowardsLawCore(pickDate) {
    const dayMatches = getMatchesForPickDate(pickDate);
    if(!dayMatches.length) return null;

    // Once a pick-day has been processed (Howard's Law actually applied to at
    // least one player), NEVER touch it again — this is the critical
    // safeguard. Without it, if `players`/`picks` data ever loads
    // incompletely (e.g. a connectivity glitch leaving picks={} for
    // everyone), getDayPick would return null for ALL players on an old
    // date, "unpicked" would become everyone, and the upsert below could
    // silently OVERWRITE real historical picks with Howard's Law
    // assignments. Once marked done, this date is permanently off-limits.
    if(results[`${pickDate}|__howards_done__`]) return null;

    // Build a flat list of {team, match} for every team playing today
    const teamEntries = dayMatches.flatMap(m => [
      {team:m.home, match:m}, {team:m.away, match:m}
    ]).filter(e=>e.team);

    // Find the LOWEST-ranked team (highest rank number = worst) using FIFA_RANKINGS
    const rankOf = (team) => {
      const entry = FIFA_RANKINGS.find(r=>r.team===team);
      return entry ? entry.rank : -1; // unranked teams (rank -1) are treated as "lowest" (worst) — shouldn't normally occur with 48 WC teams
    };
    let lowestEntry = teamEntries[0];
    for(const e of teamEntries) {
      const cur = rankOf(e.team), best = rankOf(lowestEntry.team);
      if(cur > best) lowestEntry = e; // bigger rank number = worse team
    }
    const lowest = lowestEntry.team;
    const lowestMatch = lowestEntry.match;

    const active = players.filter(p=>p.lives>0&&!p.eliminated);
    const unpicked = active.filter(p=>!getDayPick(p,pickDate));
    if(!unpicked.length) return null;

    // Sanity check: for a date that's already in the past (not today), if
    // EVERY currently-active player appears unpicked, this is almost
    // certainly a data-loading glitch rather than reality — a poller running
    // every 5 minutes would have caught genuine stragglers for an old date
    // long ago. Skip without marking done, so it's safely retried once fresh
    // data loads (and is a no-op then, since real picks already exist).
    if(pickDate < today && unpicked.length === active.length && active.length > 1) {
      console.warn(`Howard's Law: skipping ${pickDate} — ALL ${active.length} active players appear unpicked (likely stale/incomplete data), not applying`);
      return null;
    }

    const inserts = unpicked.map(p=>({player_id:p.id,pick_date:pickDate,match_id:String(lowestMatch.id),choice:lowest}));
    await supabase.from("picks").upsert(inserts,{onConflict:"player_id,pick_date,match_id"});
    await supabase.from("results").upsert([{pick_date:pickDate,team:"__howards_done__",outcome:"done"}],{onConflict:"pick_date,team"});
    loadAll();
    return {pickDate, players:unpicked.map(p=>p.name), team:lowest};
  }


  async function setKoFixture(slotId, home, away) {
    await supabase.from("ko_fixtures").upsert({slot_id:slotId,home,away},{onConflict:"slot_id"});
    setKoFixtures(prev=>({...prev,[slotId]:{home,away}}));
    const slot=KNOCKOUT_SLOTS.find(s=>s.id===slotId);
    toast_("success",`${slot?slotLabel(slot.slot):slotId}: ${home} vs ${away}`);
  }
  async function clearKoFixture(slotId) {
    await supabase.from("ko_fixtures").delete().eq("slot_id",slotId);
    setKoFixtures(prev=>{const n={...prev};delete n[slotId];return n;});
    toast_("info","Fixture cleared.");
  }
  async function adminSetPick(pid, pickDate, matchId, choice) {
    if(choice==="CLEAR"){
      // Try a real delete first (cleanest outcome)...
      await supabase.from("picks").delete().eq("player_id",pid).eq("pick_date",pickDate).eq("match_id",String(matchId));
      // ...but also upsert choice="" as a fallback. If the delete above was
      // silently blocked (e.g. an RLS policy permits INSERT/UPDATE but not
      // DELETE), this still achieves the goal: getDayPick treats a falsy
      // choice (including "") as "no pick", so the stale entry is
      // functionally cleared either way.
      await supabase.from("picks").upsert({player_id:pid,pick_date:pickDate,match_id:String(matchId),choice:""},{onConflict:"player_id,pick_date,match_id"});
    } else {
      await supabase.from("picks").upsert({player_id:pid,pick_date:pickDate,match_id:String(matchId),choice},{onConflict:"player_id,pick_date,match_id"});
    }
    toast_("success","Pick updated."); loadAll();
  }
  async function adminResetPassword(pid,newPw) {
    await supabase.from("players").update({password:newPw}).eq("id",pid);
    setPlayers(prev=>prev.map(p=>p.id!==pid?p:{...p,password:newPw}));
    toast_("success","Password updated.");
  }
  async function adminAdjustLives(pid,delta) {
    const p=players.find(q=>q.id===pid); if(!p)return;
    const nl=Math.max(0,p.lives+delta);
    await supabase.from("players").update({lives:nl,eliminated:nl===0}).eq("id",pid);
    setPlayers(prev=>prev.map(q=>q.id!==pid?q:{...q,lives:nl,eliminated:nl===0}));
  }

  // ── STYLES ───────────────────────────────────────────────────────────────
  const card   = {background:T.cardBg,border:`1px solid ${T.border}`,borderRadius:14,padding:20,marginBottom:14};
  const sec    = {fontSize:10,textTransform:"uppercase",letterSpacing:3,color:T.amber,marginBottom:16};
  const inp    = {background:"rgba(255,255,255,0.07)",border:`1px solid rgba(255,255,255,0.16)`,borderRadius:8,color:T.text,padding:"10px 14px",fontSize:14,outline:"none",fontFamily:"inherit",width:"100%"};
  const btn    = v=>({padding:"10px 20px",borderRadius:8,border:"none",cursor:"pointer",fontSize:14,fontFamily:"inherit",background:v==="amber"?T.amber:v==="danger"?"rgba(200,50,50,0.75)":v==="green"?"rgba(30,150,70,0.75)":"rgba(255,255,255,0.09)",color:v==="amber"?"#0d1f14":T.text,fontWeight:v==="amber"?"800":"500"});
  const navBtn = a=>({padding:"7px 14px",borderRadius:6,border:`1px solid ${a?T.amberBorder:T.border}`,background:a?T.amberBg:"transparent",color:a?T.amber:T.muted,cursor:"pointer",fontSize:13});
  const pill   = v=>{const m={amber:{bg:T.amberBg,b:T.amberBorder,c:T.amber},green:{bg:T.greenBg,b:T.greenBorder,c:T.green},red:{bg:T.redBg,b:T.redBorder,c:T.red},muted:{bg:"rgba(255,255,255,0.05)",b:T.border,c:T.muted},blue:{bg:T.blueBg,b:T.blueBorder,c:T.blue},night:{bg:"rgba(192,132,252,0.12)",b:"rgba(192,132,252,0.35)",c:T.night}};const x=m[v]||m.muted;return{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:99,fontSize:12,background:x.bg,border:`1px solid ${x.b}`,color:x.c};};
  const teamBtn=(sel,dis)=>({padding:"11px 8px",borderRadius:9,cursor:dis?"not-allowed":"pointer",border:`1px solid ${sel?T.amber:T.border}`,background:sel?T.amberBg:dis?"rgba(0,0,0,0.12)":T.cardBg,color:dis?"#2a4030":sel?T.amber:T.text,opacity:dis?0.4:1,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.15s",flex:"1 1 0",minWidth:0});

  function MatchRow({m}) {
    const live = m.home && m.away ? liveScores[`${m.home}|${m.away}`] || liveScores[`${m.away}|${m.home}`] : null;

    // Persisted final score (written by checkAutoResults for every finished
    // match — see Step 0). This is the PRIMARY source for finished matches,
    // so the Schedule shows correct scores purely from our own Supabase
    // data, without depending on the live-scores API for historical
    // results (a transient API/rate-limit issue can no longer make old
    // scores disappear).
    const persistedRaw = results[`${m.pickDate}|__score__${m.id}`];
    let persisted = null;
    if(persistedRaw) {
      const [scorePart, dur] = persistedRaw.split(":");
      const [homeScore, awayScore] = scorePart.split("-").map(Number);
      persisted = {homeScore, awayScore, duration: dur || "REGULAR"};
    }

    const isLive = !persisted && live && (live.status==="IN_PLAY"||live.status==="PAUSED"||live.status==="HALFTIME");
    const isFinished = !!persisted || (live && live.status==="FINISHED");

    // Fallback: if neither the persisted score nor liveScores has this match
    // yet (polling gap) but our results table already has a win/lose/draw
    // outcome for it, still show it as finished (without a numeric score).
    // Also check m.etDate as a fallback key — for early-hours matches (e.g.
    // 00:00 ET kickoffs), m.pickDate is rolled back a day for grouping
    // purposes, but older results may have been written under the API's
    // etDate before this distinction was handled consistently.
    const drawKey = `Draw#${m.id}`;
    const resultKnown = !isFinished && m.home && m.away && (
      results[`${m.pickDate}|${m.home}`] || results[`${m.pickDate}|${m.away}`] || results[`${m.pickDate}|${drawKey}`]
      || (m.etDate && m.etDate!==m.pickDate && (results[`${m.etDate}|${m.home}`] || results[`${m.etDate}|${m.away}`] || results[`${m.etDate}|${drawKey}`]))
    );
    const isFinishedFallback = isFinished || !!resultKnown;


    // Score to display — prefer the persisted final score, fall back to live.
    const disp = persisted || live;
    const showScore = (isLive || isFinished) && disp;

    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:isLive?"rgba(200,30,30,0.12)":isFinishedFallback?"rgba(0,0,0,0.28)":"rgba(0,0,0,0.22)",border:isLive?`1px solid rgba(220,50,50,0.4)`:"1px solid transparent",borderRadius:8,marginBottom:5,gap:8,flexWrap:"nowrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          {m.group&&<span style={{...pill("muted"),fontSize:10,flexShrink:0}}>Grp {m.group}</span>}
          {m.slot&&<span style={{...pill("muted"),fontSize:10,flexShrink:0}}>{slotLabel(m.slot)}</span>}
          {isLive&&<span style={{background:"rgba(220,30,30,0.9)",color:"#fff",fontSize:9,fontWeight:800,padding:"2px 6px",borderRadius:4,letterSpacing:1,flexShrink:0}}>🔴 {live.minute?live.minute+"'":"LIVE"}</span>}
          {isFinishedFallback&&<span style={{...pill("muted"),fontSize:9,flexShrink:0}}>FT</span>}
        </div>
        <div style={{flex:1,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",minWidth:0}}>
          {m.home?`${f(m.home)} ${m.home}`:"TBD"}
          {showScore&&<span style={{fontWeight:900,color:T.amber,margin:"0 5px"}}>{disp.homeScore}–{disp.awayScore}{isFinished&&disp.duration==="EXTRA_TIME"&&<span style={{fontSize:10,fontWeight:700,marginLeft:3}}>ET</span>}{isFinished&&disp.duration==="PENALTY_SHOOTOUT"&&<span style={{fontSize:10,fontWeight:700,marginLeft:3}}>P</span>}</span>}
          {!showScore&&isFinishedFallback&&<span style={{fontWeight:900,color:T.amber,margin:"0 5px"}}>–</span>}
          {!(isLive||isFinishedFallback)&&<span style={{color:T.muted}}> vs </span>}
          {m.away?`${f(m.away)} ${m.away}`:"TBD"}
        </div>
        <span style={{fontSize:11,color:isLive?T.red:T.muted,flexShrink:0,marginLeft:4}}>{isLive?(live.minute?live.minute+"'":"Live"):isFinishedFallback?"":fmtBST(m.kickoffBST)+" BST"}</span>
      </div>
    );
  }

  if(loading) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a1500 0%,#0d1f00 55%,#0a1500 100%)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,color:T.amber,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{fontSize:48}}>🏆</div>
      <div style={{fontSize:18,fontWeight:700}}>Last Person Standing 2026</div>
      <div style={{fontSize:13,color:T.muted}}>Connecting…</div>
    </div>
  );

  function ProfileScreen() {
    const [switchTo,setSwitchTo]=useState(null);
    const [pw,setPw]=useState(""); const [err,setErr]=useState("");
    const pwRef=useRef(null);
    useEffect(()=>{if(switchTo)pwRef.current?.focus();},[switchTo]);
    const sorted=[...players].sort((a,b)=>b.lives-a.lives||a.name.localeCompare(b.name));
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{width:"100%",maxWidth:420}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:52,filter:"drop-shadow(0 0 18px rgba(240,180,41,0.45))"}}>🏆</div>
            <h1 style={{fontSize:30,fontWeight:900,color:T.amber,letterSpacing:-0.5,margin:"8px 0 4px"}}>Last Person Standing 2026</h1>
            <div style={{fontSize:11,color:T.muted,letterSpacing:3,textTransform:"uppercase"}}>The Ray Gunn Cup</div>
          </div>
          {sorted.length>0&&(
            <div style={{...card,marginBottom:12}}>
              <div style={sec}>Select your profile</div>
              {sorted.map(p=>(
                <div key={p.id}>
                  <button onClick={()=>{setSwitchTo(p);setPw("");setErr("");}}
                    style={{width:"100%",background:switchTo?.id===p.id?T.amberBg:"transparent",border:`1px solid ${switchTo?.id===p.id?T.amberBorder:T.border}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,marginBottom:8,transition:"all 0.15s"}}>
                    <div style={{width:40,height:40,borderRadius:"50%",background:p.eliminated?"#1a2e20":avatarBg(p.name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0}}>{initials(p.name)}</div>
                    <div style={{flex:1,textAlign:"left"}}>
                      <div style={{fontWeight:700,fontSize:15,color:p.eliminated?"#3a5a40":T.text}}>{p.name}</div>
                      <div style={{fontSize:12,color:T.muted,marginTop:2}}>{p.eliminated?"💀 Eliminated":("❤️".repeat(p.lives)+" "+p.lives+" live"+(p.lives!==1?"s":"")+" remaining")}</div>
                    </div>
                    {getDayPick(p,today)&&<span style={pill("amber")}>{f(getDayPick(p,today).choice)}</span>}
                    <span style={{color:T.muted,fontSize:20}}>›</span>
                  </button>
                  {switchTo?.id===p.id&&(
                    <div style={{background:T.amberBg,border:`1px solid ${T.amberBorder}`,borderRadius:10,padding:"14px",marginBottom:8,marginTop:-4}}>
                      <div style={{fontSize:13,color:T.amber,marginBottom:10,fontWeight:600}}>Enter {p.name}'s password</div>
                      <input ref={pwRef} type="password" placeholder="Password" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} onKeyDown={e=>{if(e.key==="Enter"){const r=loginPlayer(p,pw);if(r)setErr(r);}}} style={{...inp,marginBottom:8,fontSize:16}} />
                      {err&&<div style={{color:T.red,fontSize:12,marginBottom:8}}>{err}</div>}
                      <div style={{display:"flex",gap:8}}>
                        <button style={{...btn("amber"),flex:1,padding:"10px"}} onClick={()=>{const r=loginPlayer(p,pw);if(r)setErr(r);}}>Sign in →</button>
                        <button style={{...btn(),padding:"10px 16px"}} onClick={()=>{setSwitchTo(null);setPw("");setErr("");}}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <button style={{...btn("amber"),width:"100%",fontSize:15,padding:"13px"}} onClick={()=>setScreen("register")}>
            {players.length===0?"Join the Game →":"+ Register a new player"}
          </button>
          <div style={{textAlign:"center",marginTop:16}}>
            <button style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:12}} onClick={()=>setScreen("grid")}>📊 View all picks without logging in</button>
          </div>
        </div>
      </div>
    );
  }

  function RegisterScreen() {
    const [name,setName]=useState(""); const [pw1,setPw1]=useState(""); const [pw2,setPw2]=useState(""); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
    const ref=useRef(null); useEffect(()=>ref.current?.focus(),[]);
    async function go(){
      const n=name.trim();
      if(!n||n.length<2){setErr("Name must be at least 2 characters.");return;}
      if(n.length>12){setErr("Name must be 12 characters or less.");return;}
      if(!pw1||pw1.length<3){setErr("Password must be at least 3 characters.");return;}
      if(pw1!==pw2){setErr("Passwords don't match.");return;}
      setBusy(true); const errMsg=await registerPlayer(n,pw1); if(errMsg){setErr(errMsg);setBusy(false);}
    }
    return (
      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
        <div style={{width:"100%",maxWidth:400}}>
          <button style={{...btn(),marginBottom:20,fontSize:13}} onClick={()=>setScreen("profile")}>← Back</button>
          <div style={{...card,padding:28}}>
            <div style={{textAlign:"center",marginBottom:22}}>
              <div style={{fontSize:40,marginBottom:6}}>✍️</div>
              <h2 style={{fontSize:22,fontWeight:800,color:T.amber,marginBottom:6}}>Register to play</h2>
              <p style={{fontSize:13,color:T.muted,lineHeight:1.6}}>Pick a name and password.</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div><div style={{fontSize:12,color:T.muted,marginBottom:5}}>Your name</div><input ref={ref} style={inp} placeholder="e.g. Danny" maxLength={12} value={name} onChange={e=>{setName(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} /></div>
              <div><div style={{fontSize:12,color:T.muted,marginBottom:5}}>Choose a password</div><input style={inp} type="password" placeholder="At least 3 characters" value={pw1} onChange={e=>{setPw1(e.target.value);setErr("");}} /></div>
              <div><div style={{fontSize:12,color:T.muted,marginBottom:5}}>Confirm password</div><input style={inp} type="password" placeholder="Repeat password" value={pw2} onChange={e=>{setPw2(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} /></div>
              {err&&<div style={{color:T.red,fontSize:13}}>{err}</div>}
              <button style={{...btn("amber"),width:"100%",fontSize:15,padding:"13px",marginTop:4,opacity:busy?0.6:1}} onClick={go} disabled={busy}>{busy?"Registering…":"Register & start picking →"}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function PickScreen() {
    const p=activePlayer;

    // ── Hooks must be called before any early return ──────────────────
    const [now, setNow] = useState(()=>new Date());
    useEffect(()=>{ const i=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(i); },[]);

    if(!p) return <div style={card}><p style={{color:T.muted,marginBottom:12}}>Not signed in.</p><button style={btn()} onClick={()=>setScreen("profile")}>← Choose profile</button></div>;
    const upcomingDates=activeDates.filter(d=>d>=today);
    const groupDatesUpcoming=upcomingDates.filter(d=>phaseOf(d)==="GROUP");
    const koDatesUpcoming=upcomingDates.filter(d=>phaseOf(d)!=="GROUP");

    // Find next deadline datetime (in BST/London time via ET offset)
    function getNextDeadlineInfo() {
      for(const pickDate of activeDates) {
        const dlBST = deadlineBSTByPickDate[pickDate];
        if(!dlBST) continue;
        // Convert the BST deadline directly to UTC (BST = UTC+1) using explicit UTC date methods
        const [h,m] = dlBST.split(":").map(Number);
        let utcH = h - 1, dayOffset = 0;
        if(utcH < 0) { utcH += 24; dayOffset = -1; }
        const dlUTC = new Date(pickDate+"T00:00:00Z");
        dlUTC.setUTCDate(dlUTC.getUTCDate()+dayOffset);
        dlUTC.setUTCHours(utcH, m, 0, 0);
        if(dlUTC > now) {
          return { pickDate, dlBST, dlUTC, locked: false };
        }
      }
      return null;
    }

    function fmtCountdown(ms) {
      if(ms<=0) return "0s";
      const h=Math.floor(ms/3600000);
      const m=Math.floor((ms%3600000)/60000);
      const s=Math.floor((ms%60000)/1000);
      if(h>0) return `${h}h ${m}m`;
      if(m>0) return `${m}m ${s}s`;
      return `${s}s`;
    }

    const nextDl = getNextDeadlineInfo();
    const todayPick = getDayPick(p, today);
    const todayLocked = isLocked(today);

    // Midnight ET in UTC
    const midnightET = new Date();
    midnightET.setUTCHours(4,0,0,0); // midnight ET = 04:00 UTC
    if(midnightET < now) midnightET.setUTCDate(midnightET.getUTCDate()+1);
    const afterMidnight = now >= midnightET;

    let timerText = "";
    let timerColor = T.amber;
    let timerIcon = "⏱";

    if(nextDl) {
      const ms = nextDl.dlUTC - now;
      const isToday = nextDl.pickDate === today;
      if(isToday && todayLocked) {
        // Deadline passed today — show "closed" until midnight, then countdown to next
        timerIcon = "🔒"; timerColor = T.muted;
        timerText = "Picks closed for today";
      } else {
        timerColor = todayPick ? T.green : T.amber;
        timerIcon = todayPick ? "✅" : "⏱";
        timerText = (todayPick ? "Pick made · " : "") + fmtCountdown(ms) + " until deadline";
      }
    } else {
      timerIcon = "🏁"; timerColor = T.muted;
      timerText = "Group stage complete";
    }

    return (
      <>

        {groupDatesUpcoming.length>0&&(
          <div style={card}>
            <div style={sec}>⚽ Group Stage — pick in advance for any day</div>
            <p style={{fontSize:12,color:T.muted,marginBottom:16}}>Pick one match result per day before the first kick-off (BST). Unlimited changes until deadline.</p>
            {groupDatesUpcoming.map(pickDate=>{
              const locked=isLocked(pickDate);
              const matches=matchesByPickDate[pickDate]||[];
              const usedPhase=getPicksInPhase(p,pickDate);
              const dlBST=deadlineBSTByPickDate[pickDate];
              const dayPick=getDayPick(p,pickDate);

              return (
                <div key={pickDate} style={{marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontWeight:700,fontSize:14,color:pickDate===today?T.amber:T.text}}>{fmtDate(pickDate)}</span>
                      {pickDate===today&&<span style={pill("blue")}>TODAY</span>}
                      <span style={{fontSize:11,color:T.muted}}>deadline {fmtBST(dlBST)} BST</span>
                    </div>
                  </div>

                  {!locked&&matches.map(m=>{
                    const myPick=p.picks[String(m.id)];
                    const otherMatchPicked=dayPick&&dayPick.matchId!==String(m.id);

                    return (
                      <div key={m.id} style={{marginBottom:12,opacity:otherMatchPicked?0.4:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                          <span style={pill("muted")}>Grp {m.group}</span>
                          <span style={{fontSize:11,color:T.muted}}>{fmtBST(m.kickoffBST)} BST</span>
                          {otherMatchPicked&&<span style={{fontSize:11,color:T.muted,fontStyle:"italic"}}>— pick already made for today</span>}
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                          {[m.home,m.away,"Draw"].map(choice=>{
                            const usedNotHere=choice!=="Draw"&&usedPhase.includes(choice)&&myPick!==choice;
                            // Only show the checkmark/selected state on the match that is
                            // ACTUALLY today's active pick. A stale leftover entry for a
                            // different (dimmed) match on the same day should not display
                            // as "selected" — it's not the player's real pick for today.
                            const sel=!otherMatchPicked&&myPick===choice;
                            const disabled=otherMatchPicked||usedNotHere||locked;
                            // Tap selected pick to clear it
                            const handleClick=()=>{
                              if(disabled) return;
                              if(sel) clearPick(p.id,pickDate,m.id);
                              else makePick(p.id,pickDate,m.id,choice);
                            };
                            return <button key={choice} style={teamBtn(sel,disabled&&!sel)} disabled={disabled&&!sel} onClick={handleClick}>
                              <span style={{fontSize:choice==="Draw"?14:18}}>{f(choice)}</span>
                              <span style={{fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{choice}</span>
                              {usedNotHere&&<span style={{fontSize:9,color:"#2a4030"}}>used</span>}
                              {sel&&<span style={{color:T.amber,fontSize:14,flexShrink:0}}>✓</span>}
                            </button>;
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {locked&&!dayPick&&<div style={{fontSize:12,color:T.red}}>⚠️ No pick made — Howard's Law will apply.</div>}
                </div>
              );
            })}
          </div>
        )}

        {koDatesUpcoming.length>0&&(
          <div style={card}>
            <div style={sec}>🏆 Knockout Rounds</div>
            {koDatesUpcoming.map(pickDate=>{
              const ms=getMatchesForPickDate(pickDate).filter(m=>m.isKnockout); if(!ms.length)return null;
              const locked=isLocked(pickDate);
              const dayPick=getDayPick(p,pickDate);
              const usedPhase=getPicksInPhase(p,pickDate);
              return (
                <div key={pickDate} style={{marginBottom:16,paddingBottom:16,borderBottom:`1px solid ${T.border}`}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>{fmtDate(pickDate)}</div>
                  {dayPick&&(
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                      <span style={{...pill("amber"),fontSize:12}}>{f(dayPick.choice)} {dayPick.choice} ✓</span>
                      {!locked&&<button style={{...btn(),fontSize:11,padding:"4px 8px"}} onClick={()=>clearPick(p.id,pickDate,dayPick.matchId)}>✕ Change</button>}
                    </div>
                  )}
                  {ms.map((m,i)=>{
                    const myPick=p.picks[String(m.id)];
                    const otherMatchPicked=dayPick&&dayPick.matchId!==String(m.id);
                    return (
                      <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8,opacity:otherMatchPicked?0.4:1}}>
                        {[m.home,m.away].map(choice=>{
                          const u=usedPhase.includes(choice)&&myPick!==choice;
                          const sel=myPick===choice;
                          const dis=otherMatchPicked||u||locked;
                          return <button key={choice} style={teamBtn(sel,dis)} disabled={dis} onClick={()=>!dis&&makePick(p.id,pickDate,m.id,choice)}>
                            <span style={{fontSize:18}}>{f(choice)}</span><span style={{fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{choice}</span>{sel&&<span style={{color:T.amber,flexShrink:0}}>✓</span>}
                          </button>;
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {(()=>{const used=getPicksInPhase(p,today);return used.length>0?(<div style={card}><div style={sec}>🚫 Used this phase</div><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{used.map(t=><span key={t} style={{...pill("muted"),padding:"5px 12px",fontSize:13}}>{f(t)} {t}</span>)}</div></div>):null;})()}
      </>
    );
  }

  function GridView() {
    const [popup, setPopup] = useState(null);
    const [datePopup, setDatePopup] = useState(null);
    const gridDates=activeDates.filter(d=>d<=today||players.some(p=>getDayPick(p,d))).slice(0,30);
    const activePlayers = players.filter(p=>!p.eliminated);
    const pot = players.length * 10;
    const others = [...players].filter(p=>p.id!=activeId).sort((a,b)=>b.lives-a.lives||a.name.localeCompare(b.name));
    const sorted = activePlayer ? [activePlayer, ...others] : others;

    // Auto-scroll to "today" (or the latest available date) on first render,
    // so the grid opens on the current/upcoming pick-day rather than always
    // starting at the very first day of the tournament. Still fully
    // scrollable left/right afterwards.
    const scrollRef = useRef(null);
    const hasScrolledRef = useRef(false);
    useEffect(() => {
      if(hasScrolledRef.current) return;
      if(!scrollRef.current || gridDates.length===0) return;
      const idx = gridDates.indexOf(today);
      const targetDate = idx>=0 ? today : gridDates[gridDates.length-1];
      const th = scrollRef.current.querySelector(`[data-col="${targetDate}"]`);
      const playerTh = scrollRef.current.querySelector('[data-col="player"]');
      if(th && playerTh) {
        scrollRef.current.scrollLeft = Math.max(0, th.offsetLeft - playerTh.offsetWidth);
        hasScrolledRef.current = true;
      }
    }, [gridDates, today]);

    function cellBg(o){if(o==="correct")return T.cellCorrect;if(o==="wrong")return T.cellWrong;if(o==="pending")return T.cellPending;if(o==="locked_nopick")return T.cellNoPick;return"transparent";}
    function handleCellClick(d, pick) {
      if(!pick||pick==="—"||pick==="") return;
      const pickers = players.filter(p=>{const dp=getDayPick(p,d);return dp&&dp.choice===pick;});
      if(pickers.length===0) return;
      setPopup({date:d, team:pick, pickers});
    }
    function handleDateClick(d) {
      const ms = getMatchesForPickDate(d);
      if(ms.length===0) return;
      setDatePopup({date:d, matches:ms});
    }
    function handleMatchesClick(d) {
      const ms = getMatchesForPickDate(d);
      if(ms.length===0) return;
      const seen = new Set();
      const allChoices = [];
      ms.forEach(m => {
        const opts = phaseOf(d)==="GROUP" ? [m.home, m.away, "Draw"] : [m.home, m.away];
        opts.forEach(choice => {
          if(seen.has(choice)) return; seen.add(choice);
          const pickers = players.filter(p => {const dp=getDayPick(p,d); return dp&&dp.choice===choice;});
          allChoices.push({choice, count: pickers.length, pickers});
        });
      });
      allChoices.sort((a,b)=>b.count-a.count);
      setPopup({date:d, team:null, matchSummary:allChoices, matches:ms});
    }
    return (
      <div style={card}>
        <div style={{display:"flex",gap:16,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:3,color:T.amber,marginBottom:6}}>The Ray Gunn Cup</div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              <div><span style={{fontSize:22,fontWeight:900,color:T.amber}}>£{pot}</span><span style={{fontSize:12,color:T.muted,marginLeft:6}}>pot</span></div>
              <div><span style={{fontSize:22,fontWeight:900,color:T.text}}>{players.length}</span><span style={{fontSize:12,color:T.muted,marginLeft:6}}>players</span></div>
              <div><span style={{fontSize:22,fontWeight:900,color:T.green}}>{activePlayers.length}</span><span style={{fontSize:12,color:T.muted,marginLeft:6}}>still in</span></div>
            </div>
          </div>
        </div>
        {gridDates.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:T.muted}}><div style={{fontSize:36,marginBottom:12}}>⏳</div>Grid fills as players make picks.</div>}
        {gridDates.length>0&&(
          <div ref={scrollRef} style={{overflowX:"auto"}}>
            <table style={{borderCollapse:"collapse",minWidth:"100%",fontSize:12}}>
              <thead>
                <tr>
                  <th data-col="player" style={{padding:"8px 12px",textAlign:"left",color:T.muted,fontWeight:600,fontSize:11,whiteSpace:"nowrap",borderBottom:`1px solid ${T.border}`,position:"sticky",left:0,background:"#0a1500",zIndex:2}}>Player</th>
                  {gridDates.map(d=><th key={d} data-col={d} onClick={()=>handleDateClick(d)} style={{padding:"6px 8px",textAlign:"center",color:d===today?T.amber:T.text,fontWeight:700,fontSize:11,borderBottom:`1px solid ${T.border}`,minWidth:76,whiteSpace:"nowrap",cursor:"pointer"}}>{fmtDateShort(d)}</th>)}
                </tr>
                <tr>
                  <td style={{position:"sticky",left:0,background:"#0a1500",zIndex:2,padding:"2px 12px",fontSize:9,color:T.muted,borderBottom:`1px solid ${T.border}`}}>deadline →</td>
                  {gridDates.map(d=>{const dl=deadlineBSTByPickDate[d];return <td key={d} style={{padding:"2px 4px",textAlign:"center",fontSize:9,color:T.muted,borderBottom:`1px solid ${T.border}`}}>{dl?fmtBST(dl):""}</td>;})}
                </tr>
                <tr>
                  <td style={{position:"sticky",left:0,background:"#0a1500",zIndex:2,borderBottom:`1px solid ${T.border}`}}></td>
                  {gridDates.map(d=>{const ms=getMatchesForPickDate(d);return <td key={d} onClick={()=>handleMatchesClick(d)} style={{padding:"3px 4px",textAlign:"center",borderBottom:`1px solid ${T.border}`,cursor:"pointer"}}>{ms.map((m,i)=><div key={i} style={{fontSize:9,color:T.muted,lineHeight:1.4,whiteSpace:"nowrap"}}>{m.home&&m.away?`${f(m.home)}v${f(m.away)}`:m.slot?slotLabel(m.slot):""}</div>)}</td>;})}
                </tr>
              </thead>
              <tbody>
                {sorted.map((p,pi)=>{
                  const isMe = p.id==activeId;
                  const rowBg = isMe ? "rgba(255,215,0,0.06)" : pi%2===0?"rgba(0,0,0,0.18)":"transparent";
                  const stickyBg = isMe ? "#0f1a00" : pi%2===0?"#0a1500":"#0c1800";
                  return (
                    <tr key={p.id} style={{background:rowBg}}>
                      <td style={{padding:"6px 12px",whiteSpace:"nowrap",position:"sticky",left:0,background:stickyBg,zIndex:1,borderLeft:isMe?`2px solid ${T.amber}`:"none"}}>
                        <div>
                          <div style={{color:p.eliminated?"#3a5a40":isMe?T.amber:T.text,fontWeight:700,fontSize:11,whiteSpace:"nowrap"}}>{p.name}{isMe?" 👤":""}</div>
                          <div style={{fontSize:9,color:T.muted}}>{p.eliminated?"💀":"❤️".repeat(p.lives)}</div>
                        </div>
                      </td>
                      {gridDates.map(d=>{
                        const dp=getDayPick(p,d);
                        const o=pickOutcomeForDay(p,d);
                        const bg=cellBg(o);
                        const pick=dp?dp.choice:null;
                        let text="";
                        if(pick==="Draw"&&dp){const allMs=getMatchesForPickDate(d);const m=allMs.find(m=>String(m.id)===String(dp.matchId));text=m?`${f(m.home)}v${f(m.away)}`:"Draw";}
                        else if(pick){text=pick.length>8?pick.slice(0,8)+"…":pick;}
                        else{text=isLocked(d)?"—":"";}
                        return <td key={d} onClick={()=>pick&&handleCellClick(d,pick)} style={{padding:"5px 4px",textAlign:"center",background:bg,border:`1px solid rgba(255,255,255,0.04)`,cursor:pick?"pointer":"default"}}>
                          <div style={{fontSize:11,fontWeight:600,color:o==="correct"?"#b0ffcc":o==="wrong"?"#ffb0b0":o==="pending"?"#ffe08a":pick?T.text:T.muted,whiteSpace:"nowrap"}}>
                            {pick==="Draw"?<><span style={{fontSize:13}}>⚖️</span> <span style={{fontSize:10}}>{text}</span></>:pick?<>{f(pick)} {text}</>:<span style={{color:"#2a4030",fontSize:10}}>{text}</span>}
                          </div>
                        </td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:16}}>
          {[[T.cellCorrect,"✓ Correct"],[T.cellWrong,"✗ Wrong"],[T.cellPending,"⏳ Pending"],[T.cellNoPick,"— No pick"]].map(([bg,label])=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.muted}}><div style={{width:14,height:14,borderRadius:3,background:bg}}></div>{label}</div>
          ))}
        </div>
        {datePopup&&(
          <div onClick={()=>setDatePopup(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#0d1f00",border:`1px solid ${T.amberBorder}`,borderRadius:16,padding:24,width:"100%",maxWidth:360}}>
              <div style={{fontSize:16,fontWeight:800,color:T.amber,marginBottom:16}}>{fmtDate(datePopup.date)}</div>
              {datePopup.matches.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
                  <div style={{fontSize:14}}>{f(m.home)} {m.home} <span style={{color:T.muted}}>vs</span> {f(m.away)} {m.away}</div>
                  <div style={{fontSize:12,color:T.muted,marginLeft:12,flexShrink:0}}>{fmtBST(m.kickoffBST)}</div>
                </div>
              ))}
              <div style={{fontSize:11,color:T.muted,marginTop:12}}>Picks close {fmtBST(deadlineBSTByPickDate[datePopup.date])} BST</div>
              <button style={{...btn("amber"),width:"100%",marginTop:16}} onClick={()=>setDatePopup(null)}>Close</button>
            </div>
          </div>
        )}
        {popup&&(
          <div onClick={()=>setPopup(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#0d1f00",border:`1px solid ${T.amberBorder}`,borderRadius:16,padding:24,width:"100%",maxWidth:380,maxHeight:"80vh",overflowY:"auto"}}>
              {popup.matchSummary ? (
                <>
                  <div style={{fontSize:16,fontWeight:800,color:T.amber,marginBottom:4}}>{fmtDate(popup.date)}</div>
                  <div style={{fontSize:11,color:T.muted,marginBottom:16}}>Who picked what — most popular first</div>
                  {popup.matchSummary.filter(x=>x.count>0).map((item,i)=>(
                    <div key={i} style={{marginBottom:14}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                        <div style={{fontSize:15,fontWeight:700}}>{item.choice==="Draw"?"⚖️ Draw":`${f(item.choice)} ${item.choice}`}</div>
                        <span style={{...pill("amber"),fontSize:12}}>{item.count} pick{item.count!==1?"s":""}</span>
                      </div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {item.pickers.map(p=>(
                          <div key={p.id} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.05)",borderRadius:8,padding:"4px 10px"}}>
                            <span style={{fontSize:12,fontWeight:600,color:T.text}}>{p.name}</span>
                            <span style={{fontSize:10,color:T.muted}}>{"❤️".repeat(p.lives)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {popup.matchSummary.filter(x=>x.count>0).length===0&&<div style={{color:T.muted,fontSize:13}}>No picks made yet.</div>}
                </>
              ) : (
                <>
                  <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:3,color:T.amber,marginBottom:4}}>{fmtDate(popup.date)}</div>
                  <div style={{fontSize:20,fontWeight:800,color:T.text,marginBottom:16}}>{f(popup.team)} {popup.team}</div>
                  <div style={{fontSize:11,color:T.muted,marginBottom:12}}>{popup.pickers.length} player{popup.pickers.length!==1?"s":""} picked this</div>
                  {popup.pickers.map(p=>(
                    <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:700,fontSize:14,color:T.text}}>{p.name}</div>
                        <div style={{fontSize:11,color:T.muted}}>{p.eliminated?"💀 Eliminated":"❤️".repeat(p.lives)+" remaining"}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              <button style={{...btn("amber"),width:"100%",marginTop:16}} onClick={()=>setPopup(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // FIFA Rankings - April 1 2026 official update, all 48 WC teams
  const FIFA_RANKINGS = [
    {rank:1,  team:"Argentina",        flag:"🇦🇷"},
    {rank:2,  team:"Spain",            flag:"🇪🇸"},
    {rank:3,  team:"France",           flag:"🇫🇷"},
    {rank:4,  team:"England",          flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"},
    {rank:5,  team:"Portugal",         flag:"🇵🇹"},
    {rank:6,  team:"Brazil",           flag:"🇧🇷"},
    {rank:7,  team:"Morocco",          flag:"🇲🇦"},
    {rank:8,  team:"Netherlands",      flag:"🇳🇱"},
    {rank:9,  team:"Belgium",          flag:"🇧🇪"},
    {rank:10, team:"Germany",          flag:"🇩🇪"},
    {rank:11, team:"Croatia",          flag:"🇭🇷"},
    {rank:13, team:"Colombia",         flag:"🇨🇴"},
    {rank:14, team:"Mexico",           flag:"🇲🇽"},
    {rank:15, team:"Senegal",          flag:"🇸🇳"},
    {rank:16, team:"Uruguay",          flag:"🇺🇾"},
    {rank:17, team:"USA",              flag:"🇺🇸"},
    {rank:18, team:"Japan",            flag:"🇯🇵"},
    {rank:19, team:"Switzerland",      flag:"🇨🇭"},
    {rank:21, team:"Iran",             flag:"🇮🇷"},
    {rank:22, team:"Turkiye",          flag:"🇹🇷"},
    {rank:23, team:"Ecuador",          flag:"🇪🇨"},
    {rank:24, team:"Austria",          flag:"🇦🇹"},
    {rank:25, team:"South Korea",      flag:"🇰🇷"},
    {rank:27, team:"Australia",        flag:"🇦🇺"},
    {rank:28, team:"Algeria",          flag:"🇩🇿"},
    {rank:29, team:"Egypt",            flag:"🇪🇬"},
    {rank:30, team:"Canada",           flag:"🇨🇦"},
    {rank:31, team:"Norway",           flag:"🇳🇴"},
    {rank:33, team:"Ivory Coast",      flag:"🇨🇮"},
    {rank:34, team:"Panama",           flag:"🇵🇦"},
    {rank:38, team:"Sweden",           flag:"🇸🇪"},
    {rank:39, team:"Czechia",          flag:"🇨🇿"},
    {rank:40, team:"Paraguay",         flag:"🇵🇾"},
    {rank:42, team:"Scotland",         flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿"},
    {rank:45, team:"DR Congo",         flag:"🇨🇩"},
    {rank:46, team:"Tunisia",          flag:"🇹🇳"},
    {rank:51, team:"Uzbekistan",       flag:"🇺🇿"},
    {rank:56, team:"Iraq",             flag:"🇮🇶"},
    {rank:57, team:"Qatar",            flag:"🇶🇦"},
    {rank:60, team:"South Africa",     flag:"🇿🇦"},
    {rank:61, team:"Saudi Arabia",     flag:"🇸🇦"},
    {rank:63, team:"Jordan",           flag:"🇯🇴"},
    {rank:64, team:"Bosnia & Herz.",   flag:"🇧🇦"},
    {rank:67, team:"Cape Verde",       flag:"🇨🇻"},
    {rank:73, team:"Ghana",            flag:"🇬🇭"},
    {rank:82, team:"Curacao",          flag:"🇨🇼"},
    {rank:83, team:"Haiti",            flag:"🇭🇹"},
    {rank:85, team:"New Zealand",      flag:"🇳🇿"},
  ];

  function RulesView() {
    const [showRankings, setShowRankings] = useState(false);
    const [showTiebreakRules, setShowTiebreakRules] = useState(false);
    const rules=[
      ["💰","Entry & prize","£10 per player, paid in advance. Winner takes the pot. Use the link below to pay your entry fee before the tournament starts.","https://pay.collctiv.com/lps-2026-77059",null],
      ["⚽","Pick daily","One match result per day before the first kick-off (BST). Pick a specific match — team to win or a draw. Unlimited changes until deadline.",null,null],
      ["🚫","No repeats — Group Stage","Can't pick the same team twice across the entire group stage (June 11–27).",null,null],
      ["🚫","No repeats — L32 & L16","Same rule across Round of 32 and Round of 16 combined.",null,null],
      ["✅","QF onwards — no restriction","Quarter-finals, semis and final: pick freely, no repeat restrictions.",null,null],
      ["⚖️","Draw","Valid pick in group stage only. Not allowed in knockout rounds.",null,null],
      ["❤️","6 lives","Wrong pick = lose a life. Zero lives = eliminated.",null,null],
      ["⚡","Howard's Law","Miss the deadline? You're automatically assigned the lowest FIFA-ranked team playing that day. If you've already used them, you lose a life instead.",null,"rankings"],
      ["⚖️","Midda's Law","If every remaining player picks wrong in the same round, nobody loses a life.",null,null],
      ["🎯","Final tiebreak","Predict the minute of the Final's first goal AND first corner — used only if 2+ players are still alive after the Final.",null,"tiebreak"],
      ["🏅","Remy's Law","Once you reach the Final, the number of lives you have left = the number of tiebreaker \"goes\" you get.",null,null],
      ["🎬","Kejal's Rule","All winners are contractually obliged to create a piece of content for the Ray Gunn launch video, in perpetuity. Failure to deliver will result in an embarrassing photo being used as the WhatsApp group photo, or other elements of humiliation at Danny's discretion.",null,null],
    ];
    return (
      <div>
        <div style={{...card,background:T.amberBg,border:`1px solid ${T.amberBorder}`}}>
          <div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:40,marginBottom:8}}>📖</div><h2 style={{fontSize:22,fontWeight:800,color:T.amber,marginBottom:4}}>The Rules</h2><p style={{fontSize:13,color:T.muted}}>Last Person Standing — The Ray Gunn Cup</p></div>
          {rules.map(([icon,title,desc,link,extraBtn])=>(
            <div key={title} style={{display:"flex",gap:14,padding:"14px 0",borderBottom:`1px solid ${T.border}`,alignItems:"flex-start"}}>
              <div style={{fontSize:22,flexShrink:0,width:32,textAlign:"center",paddingTop:2}}>{icon}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14,color:T.amber,marginBottom:4}}>{title}</div>
                <div style={{fontSize:13,color:T.text,lineHeight:1.65}}>{desc}</div>
                {link&&<a href={link} target="_blank" rel="noreferrer" style={{display:"inline-block",marginTop:8,fontSize:13,color:T.amber,fontWeight:700,textDecoration:"underline"}}>💳 Pay £10 entry fee →</a>}
                {extraBtn==="rankings"&&<button onClick={()=>setShowRankings(true)} style={{display:"inline-block",marginTop:8,fontSize:12,color:T.amber,fontWeight:700,background:"rgba(255,215,0,0.1)",border:`1px solid ${T.amberBorder}`,borderRadius:8,padding:"5px 12px",cursor:"pointer"}}>🌍 View FIFA Rankings →</button>}
                {extraBtn==="tiebreak"&&<button onClick={()=>setShowTiebreakRules(true)} style={{display:"inline-block",marginTop:8,fontSize:12,color:T.amber,fontWeight:700,background:"rgba(255,215,0,0.1)",border:`1px solid ${T.amberBorder}`,borderRadius:8,padding:"5px 12px",cursor:"pointer"}}>🎯 View full tiebreaker rules →</button>}
              </div>
            </div>
          ))}
        </div>

        {/* FIFA Rankings popup */}
        {showRankings&&(
          <div onClick={()=>setShowRankings(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#0d1f00",border:`1px solid ${T.amberBorder}`,borderRadius:16,padding:20,width:"100%",maxWidth:380,maxHeight:"82vh",overflowY:"auto"}}>
              <div style={{fontSize:18,fontWeight:800,color:T.amber,marginBottom:4}}>🌍 FIFA Rankings</div>
              <div style={{fontSize:11,color:T.muted,marginBottom:16}}>All 48 World Cup teams · April 2026 official rankings. If you miss the deadline, you get assigned the lowest-ranked team playing that day.</div>
              {FIFA_RANKINGS.map((t,i)=>(
                <div key={t.team} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid ${T.border}`}}>
                  <div style={{fontSize:11,color:T.muted,width:20,textAlign:"right",flexShrink:0}}>#{t.rank}</div>
                  <div style={{fontSize:18,flexShrink:0}}>{t.flag}</div>
                  <div style={{fontSize:13,fontWeight:600,color:T.text}}>{t.team}</div>
                </div>
              ))}
              <div style={{fontSize:11,color:T.muted,margin:"12px 0 4px"}}>Source: Official FIFA World Ranking, April 1 2026</div>
              <button style={{...btn("amber"),width:"100%",marginTop:8}} onClick={()=>setShowRankings(false)}>Close</button>
            </div>
          </div>
        )}

        {/* Final Tiebreaker rules popup */}
        {showTiebreakRules&&(
          <div onClick={()=>setShowTiebreakRules(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#0d1f00",border:`1px solid ${T.amberBorder}`,borderRadius:16,padding:20,width:"100%",maxWidth:380,maxHeight:"82vh",overflowY:"auto"}}>
              <div style={{fontSize:18,fontWeight:800,color:T.amber,marginBottom:4}}>🎯 Final Tiebreaker</div>
              <div style={{fontSize:11,color:T.muted,marginBottom:16}}>How it works if more than one player is still alive after the Final (M104).</div>

              {[
                ["1️⃣","Picks open","As soon as the 3rd Place Play-off (M103) finishes — roughly 22 hours before the Final kicks off."],
                ["🏅","Remy's Law — your \"goes\"","Your number of goes = your number of lives at that point. 4 lives = 4 goes. Each go is a pair: a guess for the minute of the Final's first goal, AND a guess for the minute of the first corner — both 1–120."],
                ["⏱️","Penalty shootout = the first goal","If it's still 0-0 after 120 minutes, the shootout happens — and the FIRST PENALTY SCORED counts as \"the first goal\", recorded as minute 120 for tiebreak purposes."],
                ["📺","FIFA's site is the source of truth","The actual first-goal minute (and first-corner minute) will be taken exactly as displayed on FIFA's official website/match centre — including how they record injury-time goals."],
                ["🩹","Injury time","A goal in 1st-half injury time counts as 45. 2nd-half injury time = 90. Extra-time 1st half injury time = 105. Extra-time 2nd half injury time = 120."],
                ["🚩","No corners at all","If the goal-minute step is tied and we need corners, but the match somehow had NO corners — there's no actual corner minute to compare against, so we skip straight to the coin flip."],
                ["🔒","Hidden picks","Your goes are hidden from every other player (you can edit your own right up until the Final kicks off). Nobody can see anyone else's guesses early."],
                ["🏆","Step 1 — Final result","M104 plays out as normal — wrong pick still costs a life. Anyone left with lives > 0 afterwards is in the tiebreaker."],
                ["🥇","Step 2 — First goal","Whoever's CLOSEST go to the actual first-goal minute wins outright — \"WINNER (FIRST GOAL TIEBREAK)\"."],
                ["🥈","Step 3 — Corner (if tied)","If 2+ players are equally close on goal-minute, we use the CORNER guess from that same go — closest wins — \"WINNER (CORNER TIEBREAK)\"."],
                ["🪙","Step 4 — Coin flip (last resort)","Still tied? It's settled with a coin flip, live on Danny's Instagram — \"WINNER (COIN-FLIP)\"."],
                ["👁️","Reveal","Once the Final's deadline passes, everyone's goes, the actual goal/corner minutes, and the working-out are revealed at the top of the Grid tab."],
              ].map(([icon,title,desc])=>(
                <div key={title} style={{display:"flex",gap:12,padding:"12px 0",borderBottom:`1px solid ${T.border}`,alignItems:"flex-start"}}>
                  <div style={{fontSize:18,flexShrink:0,width:26,textAlign:"center",paddingTop:1}}>{icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13,color:T.amber,marginBottom:3}}>{title}</div>
                    <div style={{fontSize:12,color:T.text,lineHeight:1.6}}>{desc}</div>
                  </div>
                </div>
              ))}

              <button style={{...btn("amber"),width:"100%",marginTop:12}} onClick={()=>setShowTiebreakRules(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function Schedule() {
    const phases=[
      ["Group Stage","2026-06-11","2026-06-27"],
      ["Round of 32","2026-06-28","2026-07-03"],
      ["Round of 16","2026-07-04","2026-07-07"],
      ["Quarter-Finals","2026-07-09","2026-07-11"],
      ["Semi-Finals","2026-07-14","2026-07-15"],
      ["3rd Place & Final","2026-07-18","2026-07-19"],
    ];

    return phases.map(([label,from,to])=>{
      // For group stage: use activeDates + getMatchesForPickDate as before
      // For knockout: always show all slots in this phase range
      const isGroup = label==="Group Stage";
      const koDates = isGroup ? [] : [...new Set(
        KNOCKOUT_SLOTS.filter(s=>s.pickDate>=from&&s.pickDate<=to).map(s=>s.pickDate)
      )].sort();
      const groupDates = isGroup ? allPickDates.filter(d=>d>=from&&d<=to) : [];
      const dates = isGroup ? groupDates : koDates;
      if(!dates.length) return null;

      return (
        <div key={label} style={card}>
          <div style={sec}>{label}</div>
          {dates.map(pickDate=>{
            const dlBST = deadlineBSTByPickDate[pickDate];
            const groupMs = isGroup ? getMatchesForPickDate(pickDate) : [];
            const koSlots = isGroup ? [] : KNOCKOUT_SLOTS.filter(s=>s.pickDate===pickDate);

            return (
              <div key={pickDate}>
                <div style={{fontSize:12,color:T.amber,fontWeight:700,margin:"10px 0 6px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  {fmtDate(pickDate)}
                  {dlBST&&<span style={{color:T.muted,fontWeight:400,fontSize:11}}>— picks close {fmtBST(dlBST)} BST</span>}
                  {pickDate===today&&<span style={pill("blue")}>TODAY</span>}
                </div>

                {/* Group stage matches */}
                {groupMs.map((m,i)=><MatchRow key={i} m={m}/>)}

                {/* Knockout slots — always show, with teams if known */}
                {koSlots.map(slot=>{
                  const fix = koFixtures[slot.id];
                  const bst = etToBst(slot.kickoffET).bst;
                  if(fix) {
                    return <MatchRow key={slot.id} m={{...slot,...fix,kickoffBST:bst,isKnockout:true}}/>;
                  }
                  return (
                    <div key={slot.id} style={{background:"rgba(0,0,0,0.18)",borderRadius:10,padding:"10px 14px",marginBottom:8}}>
                      <div style={{fontSize:11,color:T.amber,fontWeight:700,marginBottom:4}}>{slotLabel(slot.slot)}</div>
                      <div style={{fontSize:12,color:T.muted}}>{fmtBST(bst)} BST · Teams TBD</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    });
  }


  function Admin() {
    const [pw,setPw]=useState("");
    const [koInputs,setKoInputs]=useState({});
    const [newName,setNewName]=useState("");
    const [newPw,setNewPw]=useState("");
    // Aliases to App-level state (see declarations near the top of App) —
    // click/select-driven, so safe to lift; survives App re-renders without
    // resetting (unlike the typing fields above, which deliberately stay local).
    const tab=adminTab, setTab=setAdminTab;
    const editPicks=adminEditPicks, setEditPicks=setAdminEditPicks;
    const selectedPlayer=adminSelectedPlayer, setSelectedPlayer=setAdminSelectedPlayer;
    const confirmDelete=adminConfirmDelete, setConfirmDelete=setAdminConfirmDelete;

    if(!adminAuthed) return (
      <div style={{maxWidth:340,margin:"60px auto"}}>
        <div style={{...card,padding:28,textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:10}}>🔐</div>
          <div style={{fontWeight:700,fontSize:17,color:T.amber,marginBottom:18}}>Admin Access</div>
          <input style={{...inp,textAlign:"center",marginBottom:12}} type="password" placeholder="Admin password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(pw===ADMIN_PW?setAdminAuthed(true):toast_("error","Wrong password"))} />
          <button style={{...btn("amber"),width:"100%"}} onClick={()=>pw===ADMIN_PW?setAdminAuthed(true):toast_("error","Wrong password")}>Enter</button>
        </div>
      </div>
    );

    const tabs=[["results","🏁 Results"],["players","👤 Players"],["fixtures","🔧 Fixtures"],["audit","🧮 Audit Lives"]];
    const pastDates=activeDates.filter(d=>isLocked(d));
    const selP = selectedPlayer ? players.find(p=>p.id===selectedPlayer) : null;

    async function deletePlayer(pid) {
      await supabase.from("players").delete().eq("id",pid);
      setSelectedPlayer(null); setConfirmDelete(false);
      toast_("info","Player deleted."); loadAll(false);
    }
    async function renamePlayer(pid, name) {
      const n=name.trim(); if(!n||n.length<2){toast_("error","Name too short.");return;}
      if(n.length>12){toast_("error","Name must be 12 characters or less.");return;}
      await supabase.from("players").update({name:n}).eq("id",pid);
      toast_("success","Name updated."); loadAll(false);
    }

    // ── AUDIT: recompute every player's lives from scratch based on picks + results ──
    function computeAuditResults() {
      const STARTING_LIVES = 6;
      const audit = {}; // pid -> { expectedLives, log: [...] }
      players.forEach(p => { audit[p.id] = { expectedLives: STARTING_LIVES, log: [] }; });

      // "Draw" picks are stored as match-specific "Draw#<matchId>" keys.
      const outcomeFor = (p, pickDate) => {
        const dp = getDayPick(p, pickDate);
        if(!dp) return { dp, outcome: undefined };
        const lookupKey = dp.choice === "Draw" ? `Draw#${dp.matchId}` : dp.choice;
        return { dp, outcome: results[`${pickDate}|${lookupKey}`] };
      };

      for(const pickDate of pastDates) {
        const dayMatches = getMatchesForPickDate(pickDate);
        if(dayMatches.length===0) continue;

        const active = players.filter(p => audit[p.id].expectedLives > 0);
        if(active.length===0) continue;

        // Has every match on this pick-day been fully logged in `results`?
        const dayFullyDone = dayMatches.every(m => {
          const drawKey = `Draw#${m.id}`;
          return results[`${pickDate}|${m.home}`] !== undefined
              || results[`${pickDate}|${m.away}`] !== undefined
              || results[`${pickDate}|${drawKey}`] !== undefined;
        });

        const playersWrong = [], playersCorrect = [], playersUnknown = [];
        for(const p of active) {
          const { dp, outcome } = outcomeFor(p, pickDate);
          if(!dp) { playersWrong.push(p); continue; } // Howard's Law — no pick = wrong
          if(!outcome) { playersUnknown.push(p); continue; } // match not finished yet
          if(outcome==="win"||outcome==="draw_correct") playersCorrect.push(p);
          else playersWrong.push(p);
        }

        const middasPossible = playersCorrect.length===0;

        // If the day isn't fully done AND nobody's correct yet, nothing can be
        // decided for this pick-day yet — skip (matches real-time "holding" behaviour).
        if(!dayFullyDone && middasPossible) continue;

        const everyoneWrong = dayFullyDone && playersWrong.length===active.length && active.length>0;

        for(const p of active) {
          if(playersUnknown.includes(p)) continue; // their match hasn't finished — no decision yet
          const isWrong = playersWrong.includes(p);
          const entry = {pickDate, dp:getDayPick(p,pickDate), wrong:isWrong};
          if(everyoneWrong) {
            entry.middasLaw = true;
          } else if(isWrong) {
            audit[p.id].expectedLives -= 1;
            entry.lifeLost = true;
          }
          audit[p.id].log.push(entry);
        }
      }
      return audit;
    }



    return (
      <>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {tabs.map(([k,l])=><button key={k} style={{...navBtn(tab===k),fontSize:13}} onClick={()=>{setTab(k);setSelectedPlayer(null);setConfirmDelete(false);}}>{l}</button>)}
        </div>

        {tab==="results"&&(
          <div style={card}>
            <div style={sec}>🏁 Log Match Results</div>
            {pastDates.length===0&&<p style={{color:T.muted}}>No locked days yet.</p>}
            {pastDates.map(pickDate=>(
              <div key={pickDate} style={{marginBottom:20}}>
                <div style={{fontSize:12,color:T.amber,fontWeight:700,marginBottom:8}}>{fmtDate(pickDate)}</div>
                {getMatchesForPickDate(pickDate).map((m,i)=>{
                  const pH=players.filter(p=>p.picks[String(m.id)]===m.home);
                  const pA=players.filter(p=>p.picks[String(m.id)]===m.away);
                  const pD=players.filter(p=>p.picks[String(m.id)]==="Draw");
                  const logged=results[`${pickDate}|${m.home}`]||results[`${pickDate}|${m.away}`];
                  return (
                    <div key={i} style={{background:"rgba(0,0,0,0.25)",borderRadius:8,padding:"10px 12px",marginBottom:8}}>
                      <div style={{fontWeight:600,fontSize:13,marginBottom:8}}>{f(m.home)} {m.home} vs {f(m.away)} {m.away} · {fmtBST(m.kickoffBST)} BST</div>
                      {logged?<span style={pill("green")}>✓ {logged==="auto"?"🤖 Auto-logged":"Result logged"}</span>:(
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                          <button style={{...btn("green"),fontSize:12,padding:"6px 12px"}} onClick={()=>logResult(pickDate,m.id,m.home,m.away,false)}>{f(m.home)} {m.home} won</button>
                          <button style={{...btn("green"),fontSize:12,padding:"6px 12px"}} onClick={()=>logResult(pickDate,m.id,m.away,m.home,false)}>{f(m.away)} {m.away} won</button>
                          {!m.isKnockout&&<button style={{...btn(),fontSize:12,padding:"6px 12px"}} onClick={()=>logResult(pickDate,m.id,m.home,m.away,true)}>⚖️ Draw</button>}
                        </div>
                      )}
                      <div style={{fontSize:11,color:T.muted}}>{f(m.home)} {pH.map(p=>p.name).join(", ")||"nobody"} · {f(m.away)} {pA.map(p=>p.name).join(", ")||"nobody"}{!m.isKnockout&&` · Draw: ${pD.map(p=>p.name).join(", ")||"nobody"}`}</div>
                    </div>
                  );
                })}
                <button style={{...btn(),fontSize:12,marginTop:4}} onClick={()=>applyHowardsLaw(pickDate)}>⚡ Howard's Law</button>
              </div>
            ))}
          </div>
        )}

        {tab==="players"&&!selectedPlayer&&(
          <div style={card}>
            <div style={sec}>👤 Players — tap to manage</div>
            {[...players].sort((a,b)=>b.lives-a.lives||a.name.localeCompare(b.name)).map(p=>(
              <button key={p.id} onClick={()=>{setSelectedPlayer(p.id);setNewName(p.name);setNewPw("");setConfirmDelete(false);}}
                style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(0,0,0,0.2)",border:`1px solid ${T.border}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",marginBottom:8,gap:12}}>
                <div style={{textAlign:"left"}}>
                  <div style={{fontWeight:700,fontSize:14,color:p.eliminated?"#3a5a40":T.text}}>{p.name}</div>
                  <div style={{fontSize:11,color:T.muted,marginTop:2}}>{p.eliminated?"💀 Eliminated":"❤️".repeat(p.lives)}</div>
                </div>
                <span style={{color:T.muted,fontSize:20}}>›</span>
              </button>
            ))}
          </div>
        )}

        {tab==="players"&&selectedPlayer&&selP&&(
          <div style={card}>
            <button style={{...btn(),fontSize:13,marginBottom:16}} onClick={()=>{setSelectedPlayer(null);setConfirmDelete(false);}}>← All players</button>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:20,fontWeight:800,color:T.amber,marginBottom:4}}>{selP.name}</div>
              <div style={{fontSize:13,color:T.muted}}>{selP.eliminated?"💀 Eliminated":"❤️".repeat(selP.lives)+" "+selP.lives+" lives"}</div>
            </div>
            <div style={{marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:11,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:2}}>Lives</div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <button style={{...btn("danger"),fontSize:16,padding:"6px 14px"}} onClick={()=>adminAdjustLives(selP.id,-1)}>−</button>
                <span style={{fontSize:20,fontWeight:800,minWidth:30,textAlign:"center"}}>{selP.lives}</span>
                <button style={{...btn("green"),fontSize:16,padding:"6px 14px"}} onClick={()=>adminAdjustLives(selP.id,1)}>+</button>
              </div>
            </div>
            <div style={{marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:11,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:2}}>Change name</div>
              <div style={{display:"flex",gap:8}}>
                <input style={{...inp,flex:1,padding:"8px 12px",fontSize:13}} value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&renamePlayer(selP.id,newName)} />
                <button style={{...btn("amber"),fontSize:12,padding:"8px 14px"}} onClick={()=>renamePlayer(selP.id,newName)}>Save</button>
              </div>
            </div>
            <div style={{marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:11,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:2}}>Reset password</div>
              <div style={{display:"flex",gap:8}}>
                <input type="password" placeholder="New password" style={{...inp,flex:1,padding:"8px 12px",fontSize:13}} value={newPw} onChange={e=>setNewPw(e.target.value)} />
                <button style={{...btn("amber"),fontSize:12,padding:"8px 14px"}} onClick={async()=>{const n=newPw.trim();if(n.length<3){toast_("error","Too short.");return;}await adminResetPassword(selP.id,n);setNewPw("");}}>Set</button>
              </div>
            </div>
            <div style={{marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${T.border}`}}>
              <div style={{fontSize:11,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:2}}>Edit picks</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {activeDates.map(pickDate=>{
                  const ms=getMatchesForPickDate(pickDate); if(!ms.length)return null;
                  return ms.map(m=>{
                    const currentPick=selP.picks[String(m.id)];
                    const opts=phaseOf(pickDate)==="GROUP"?[m.home,m.away,"Draw"]:[m.home,m.away];
                    const eKey=`${selP.id}_${m.id}`;
                    return (
                      <div key={m.id} style={{background:"rgba(0,0,0,0.2)",borderRadius:8,padding:"10px 12px"}}>
                        <div style={{fontSize:11,color:T.muted,marginBottom:6}}>{fmtDateShort(pickDate)} · {m.home} v {m.away}</div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          <span style={{fontSize:13,color:currentPick?T.amber:T.muted,minWidth:90}}>{currentPick?`${f(currentPick)} ${currentPick}`:"— no pick"}</span>
                          <select style={{...inp,flex:1,padding:"6px 8px",fontSize:12}} value={editPicks[eKey]||""} onChange={e=>setEditPicks(prev=>({...prev,[eKey]:e.target.value}))}>
                            <option value="">— change to…</option>
                            {opts.map(t=><option key={t} value={t}>{f(t)} {t}</option>)}
                            <option value="CLEAR">✕ Clear</option>
                          </select>
                          <button style={{...btn("amber"),fontSize:12,padding:"6px 12px"}} onClick={async()=>{const val=editPicks[eKey];if(!val)return;await adminSetPick(selP.id,pickDate,m.id,val);setEditPicks(prev=>({...prev,[eKey]:""}));}}>Save</button>
                        </div>
                      </div>
                    );
                  });
                })}
              </div>
            </div>
            <div>
              <div style={{fontSize:11,color:T.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:2}}>Danger zone</div>
              {!confirmDelete
                ? <button style={{...btn("danger"),width:"100%"}} onClick={()=>setConfirmDelete(true)}>🗑️ Delete {selP.name}'s account</button>
                : <div style={{background:"rgba(160,35,35,0.15)",border:"1px solid rgba(200,50,50,0.4)",borderRadius:10,padding:16}}>
                    <div style={{fontSize:14,fontWeight:700,color:T.red,marginBottom:8}}>Are you sure? This cannot be undone.</div>
                    <div style={{display:"flex",gap:8}}>
                      <button style={{...btn("danger"),flex:1}} onClick={()=>deletePlayer(selP.id)}>Yes, delete</button>
                      <button style={{...btn(),flex:1}} onClick={()=>setConfirmDelete(false)}>Cancel</button>
                    </div>
                  </div>
              }
            </div>
          </div>
        )}

        {tab==="fixtures"&&(
          <div style={card}>
            <div style={sec}>🔧 Set & Edit Knockout Fixtures</div>
            {KNOCKOUT_SLOTS.map(slot=>{
              const existing=koFixtures[slot.id],key=slot.id,isEditing=koInputs[`${key}_editing`];
              return (
                <div key={slot.id} style={{background:"rgba(0,0,0,0.2)",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:existing||isEditing?8:0,flexWrap:"wrap"}}>
                    <span style={{...pill("muted"),fontSize:11,minWidth:140}}>{slotLabel(slot.slot)}</span>
                    <span style={{fontSize:11,color:T.muted}}>{fmtDate(slot.pickDate)} · {fmtBST(slot.kickoffBST)} BST</span>
                    {existing&&!isEditing&&(
                      <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:"auto",flexWrap:"wrap"}}>
                        <span style={{fontSize:13,fontWeight:600}}>{f(existing.home)} {existing.home} <span style={{color:T.muted}}>vs</span> {f(existing.away)} {existing.away}</span>
                        <button style={{...btn(),fontSize:11,padding:"3px 10px"}} onClick={()=>setKoInputs(prev=>({...prev,[`${key}_editing`]:true,[`${key}_h`]:existing.home,[`${key}_a`]:existing.away}))}>✏️ Edit</button>
                        <button style={{...btn("danger"),fontSize:11,padding:"3px 10px"}} onClick={()=>clearKoFixture(slot.id)}>✕</button>
                      </div>
                    )}
                    {!existing&&!isEditing&&(
                      <button style={{...btn("amber"),fontSize:12,padding:"5px 12px",marginLeft:"auto"}} onClick={()=>setKoInputs(prev=>({...prev,[`${key}_editing`]:true,[`${key}_h`]:"",[`${key}_a`]:""}))}>+ Set teams</button>
                    )}
                  </div>
                  {isEditing&&(
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                      <input placeholder="Home team" style={{...inp,flex:"1 1 110px",padding:"7px 10px",fontSize:13}} value={koInputs[`${key}_h`]||""} onChange={e=>setKoInputs(prev=>({...prev,[`${key}_h`]:e.target.value}))} />
                      <span style={{color:T.muted,fontSize:13}}>vs</span>
                      <input placeholder="Away team" style={{...inp,flex:"1 1 110px",padding:"7px 10px",fontSize:13}} value={koInputs[`${key}_a`]||""} onChange={e=>setKoInputs(prev=>({...prev,[`${key}_a`]:e.target.value}))} />
                      <button style={{...btn("amber"),fontSize:12,padding:"7px 14px"}} onClick={async()=>{
                        const h=(koInputs[`${key}_h`]||"").trim(),a=(koInputs[`${key}_a`]||"").trim();
                        if(!h||!a){toast_("error","Enter both team names.");return;}
                        await setKoFixture(slot.id,h,a);
                        setKoInputs(prev=>{const n={...prev};delete n[`${key}_h`];delete n[`${key}_a`];delete n[`${key}_editing`];return n;});
                      }}>Save</button>
                      <button style={{...btn(),fontSize:12,padding:"7px 10px"}} onClick={()=>setKoInputs(prev=>{const n={...prev};delete n[`${key}_h`];delete n[`${key}_a`];delete n[`${key}_editing`];return n;})}>Cancel</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab==="audit"&&(()=>{
          const audit = computeAuditResults();
          const mismatches = players.filter(p => audit[p.id].expectedLives !== p.lives);
          async function fixAll(){
            for(const p of mismatches){
              const exp = audit[p.id].expectedLives;
              await supabase.from("players").update({lives:exp,eliminated:exp===0}).eq("id",p.id);
            }
            toast_("success",`Fixed ${mismatches.length} player${mismatches.length===1?"":"s"}.`);
            loadAll(false);
          }
          return (
          <div style={card}>
            <div style={sec}>🧮 Audit Lives</div>
            <p style={{color:T.muted,fontSize:12,marginBottom:14}}>Recomputes every player's lives from scratch using all logged results + picks, then compares to their current value in the database.</p>
            {mismatches.length===0 ? (
              <div style={{...pill("green"),fontSize:13}}>✓ All {players.length} players match expected lives.</div>
            ) : (
              <>
                <div style={{...pill("amber"),fontSize:13,marginBottom:12}}>⚠️ {mismatches.length} mismatch{mismatches.length===1?"":"es"} found</div>
                {mismatches.map(p=>(
                  <div key={p.id} style={{background:"rgba(0,0,0,0.25)",borderRadius:8,padding:"10px 12px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                    <div style={{fontWeight:600,fontSize:13}}>{p.name}</div>
                    <div style={{fontSize:12}}>
                      Current: <span style={{color:T.red,fontWeight:700}}>{p.lives}</span>
                      {" → "}
                      Expected: <span style={{color:T.green,fontWeight:700}}>{audit[p.id].expectedLives}</span>
                    </div>
                  </div>
                ))}
                <button style={{...btn("amber"),marginTop:8}} onClick={fixAll}>Fix all {mismatches.length} player{mismatches.length===1?"":"s"}</button>
              </>
            )}
            <details style={{marginTop:20}}>
              <summary style={{cursor:"pointer",color:T.muted,fontSize:12}}>Show full audit log per player</summary>
              <div style={{marginTop:10}}>
                {players.map(p=>(
                  <div key={p.id} style={{marginBottom:14}}>
                    <div style={{fontWeight:700,fontSize:13,color:T.amber,marginBottom:4}}>{p.name} — current {p.lives}, expected {audit[p.id].expectedLives}</div>
                    {audit[p.id].log.map((entry,i)=>(
                      <div key={i} style={{fontSize:11,color:T.muted,paddingLeft:10}}>
                        {fmtDate(entry.pickDate)}: {entry.dp?`picked ${entry.dp.choice}`:"no pick"} —{" "}
                        {entry.middasLaw ? "⚖️ Midda's Law (saved)" : entry.wrong ? (entry.lifeLost?"❌ wrong, life lost":"❌ wrong") : "✅ correct"}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </details>
          </div>
          );
        })()}
      </>
    );
  }

  const isNav=["pick","grid","schedule","rules","admin"].includes(screen);

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a1500 0%,#0d1f00 55%,#0a1500 100%)",fontFamily:"'Segoe UI',system-ui,sans-serif",color:T.text}}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}*{box-sizing:border-box;margin:0;padding:0}select option{background:#0d2016}button:hover:not(:disabled){filter:brightness(1.1)}`}</style>
      {isNav&&(
        <header style={{background:"rgba(0,0,0,0.6)",borderBottom:`1px solid ${T.amberBorder}`}}>
          {/* Row 1: Logo + Name + Lives — padded for iPhone PWA safe area */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 18px",paddingTop:"max(12px, env(safe-area-inset-top, 12px))",gap:10}}>
            <button style={{display:"flex",alignItems:"center",gap:10,background:"none",border:"none",cursor:"pointer",padding:0}} onClick={()=>setScreen("profile")}>
              <span style={{fontSize:26}}>🏆</span>
              <div style={{textAlign:"left"}}>
                <div style={{fontSize:16,fontWeight:900,color:T.amber,lineHeight:1.2}}>Last Person Standing 2026</div>
                <div style={{fontSize:10,color:T.muted,letterSpacing:3,textTransform:"uppercase"}}>The Ray Gunn Cup</div>
              </div>
            </button>
            <button onClick={()=>setScreen("profile")} style={{display:"flex",alignItems:"center",gap:8,background:T.amberBg,border:`1px solid ${T.amberBorder}`,borderRadius:10,padding:"9px 14px",cursor:"pointer",flexShrink:0}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:800,color:T.amber,lineHeight:1.2}}>{activePlayer?`👤 ${activePlayer.name}`:"Sign in →"}</div>
                {activePlayer&&<div style={{fontSize:11,color:T.muted,marginTop:2}}>{"❤️".repeat(activePlayer.lives)}</div>}
              </div>
            </button>
          </div>
          {/* Row 2: Nav tabs */}
          <div style={{display:"flex",borderTop:`1px solid rgba(255,255,255,0.06)`}}>
            {(activePlayer?[["⚽","My Picks","pick"],["📊","Grid","grid"],["📅","Schedule","schedule"],["📖","Rules","rules"]]:[["📊","Grid","grid"],["📅","Schedule","schedule"],["📖","Rules","rules"]]).map(([icon,label,key])=>(
              <button key={key} onClick={()=>setScreen(key)} style={{flex:1,padding:"9px 4px",background:screen===key?T.amberBg:"transparent",border:"none",borderBottom:screen===key?`2px solid ${T.amber}`:"2px solid transparent",color:screen===key?T.amber:T.muted,cursor:"pointer",fontSize:12,fontWeight:screen===key?700:400,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all 0.15s"}}>
                {icon} {label}
              </button>
            ))}
          </div>
          {/* Row 3: Timer — isolated component, won't re-render parent */}
          <NavTimer activeDates={activeDates} deadlineBSTByPickDate={deadlineBSTByPickDate} activePlayer={activePlayer} today={today} isLocked={isLocked} getDayPick={getDayPick} setScreen={setScreen} />
        </header>
      )}
      <main style={{maxWidth:isNav?940:"none",margin:"0 auto",padding:isNav?"18px 14px":0}}>
        {screen==="profile"  &&<ProfileScreen/>}
        {screen==="register" &&<RegisterScreen/>}
        {screen==="pick"     &&<PickScreen/>}
        {screen==="grid"     &&<GridView/>}
        {screen==="schedule" &&<Schedule/>}
        {screen==="rules"    &&<RulesView/>}
        {screen==="admin"    &&<Admin/>}
      </main>
      {isNav&&(
        <footer style={{textAlign:"center",padding:"24px 0 32px",borderTop:`1px solid rgba(255,255,255,0.05)`,marginTop:8}}>
          <button style={{background:"none",border:"none",color:T.muted,fontSize:11,cursor:"pointer",opacity:0.5}} onClick={()=>setScreen("admin")}>👑 Admin</button>
        </footer>
      )}
      {/* ── POPUP CAROUSEL ── */}
      {popupSlides&&popupSlides.slides.length>0&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{width:"100%",maxWidth:400,position:"relative"}}>
            <button onClick={()=>setPopupSlides(null)} style={{position:"absolute",top:-44,right:0,background:"none",border:"none",color:T.muted,fontSize:13,cursor:"pointer",padding:"8px 12px"}}>Skip all ✕</button>
            {(()=>{
              const slide = popupSlides.slides[popupIdx];
              if(!slide) return null;
              return (
                <div style={{background:"linear-gradient(135deg,#0d1f00,#1a3300)",border:`1px solid ${T.amberBorder}`,borderRadius:20,padding:32,textAlign:"center",minHeight:280,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
                  <div style={{fontSize:52,marginBottom:4}}>{slide.icon}</div>
                  <div style={{fontSize:18,fontWeight:900,color:T.amber,letterSpacing:1,lineHeight:1.2,textTransform:"uppercase"}}>{slide.title}</div>
                  <div style={{fontSize:14,color:T.text,lineHeight:1.7,maxWidth:320}}>{slide.body}</div>
                </div>
              );
            })()}
            <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:16}}>
              {popupSlides.slides.map((_,i)=>(
                <div key={i} style={{width:i===popupIdx?20:6,height:6,borderRadius:3,background:i===popupIdx?T.amber:"rgba(255,255,255,0.2)",transition:"all 0.2s"}}/>
              ))}
            </div>
            <button
              onClick={()=>{
                if(popupIdx < popupSlides.slides.length-1) setPopupIdx(popupIdx+1);
                else setPopupSlides(null);
              }}
              style={{...btn("amber"),width:"100%",marginTop:16,fontSize:15,padding:"13px"}}
            >
              {popupIdx < popupSlides.slides.length-1 ? "Next →" : "Let's go 🏆"}
            </button>
          </div>
        </div>
      )}
      {howardsResult&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"#0d1f00",border:`1px solid ${T.amberBorder}`,borderRadius:16,padding:24,width:"100%",maxWidth:340}}>
            <div style={{fontSize:18,fontWeight:800,color:T.amber,marginBottom:4}}>⚡ Howard's Law Applied</div>
            <div style={{fontSize:12,color:T.muted,marginBottom:16}}>{fmtDate(howardsResult.pickDate)}</div>
            <div style={{fontSize:13,color:T.text,marginBottom:16}}>
              {howardsResult.players.length} player{howardsResult.players.length!==1?"s":""} assigned {f(howardsResult.team)} <strong>{howardsResult.team}</strong>:
            </div>
            {howardsResult.players.map((name,i)=>(
              <div key={i} style={{padding:"6px 0",borderBottom:`1px solid ${T.border}`,fontSize:14,fontWeight:600}}>{name}</div>
            ))}
            <button style={{...btn("amber"),width:"100%",marginTop:16}} onClick={()=>setHowardsResult(null)}>Got it</button>
          </div>
        </div>
      )}
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:toast.type==="error"?"rgba(160,35,35,0.97)":toast.type==="success"?"rgba(20,120,55,0.97)":"rgba(20,70,140,0.97)",color:"#fff",padding:"11px 24px",borderRadius:30,fontSize:14,fontWeight:600,boxShadow:"0 4px 28px rgba(0,0,0,0.6)",zIndex:999,whiteSpace:"nowrap",animation:"slideUp 0.2s ease"}}>{toast.msg}</div>}
    </div>
  );
}
