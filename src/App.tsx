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
  { id:89,  etDate:"2026-07-04", slot:"R16-1",  phase:"L32_L16", kickoffET:"13:00" },
  { id:90,  etDate:"2026-07-04", slot:"R16-2",  phase:"L32_L16", kickoffET:"17:00" },
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
  const [bh] = bst.split(":").map(Number);
  const earlyHours = bh < 8;
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
  const [bh] = bst.split(":").map(Number);
  const earlyHours = bh < 8;
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
  // collect all team picks (not Draw) across all matches in this phase
  const allMatches = allPickDates
    .filter(d=>phaseOf(d)===ph)
    .flatMap(d=>[...(matchesByPickDate[d]||[]), ...KNOCKOUT_SLOTS.filter(s=>s.pickDate===d)]);
  return allMatches
    .map(m=>player.picks[String(m.id)])
    .filter(p=>p&&p!=="Draw");
}

function fmtBST(bst) { if(!bst)return"—"; const[h,m]=bst.split(":").map(Number),ap=h>=12?"pm":"am",h12=h>12?h-12:h===0?12:h; return`${h12}:${m.toString().padStart(2,"0")}${ap}`; }
function fmtDate(d) { return new Date(d+"T12:00:00Z").toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"}); }
function fmtDateShort(d) { return new Date(d+"T12:00:00Z").toLocaleDateString("en-GB",{day:"numeric",month:"short"}); }
function slotLabel(slot) {
  if(slot==="FINAL")return"Final"; if(slot==="3RD")return"3rd Place Play-off";
  if(slot==="SF-1")return"Semi-Final 1"; if(slot==="SF-2")return"Semi-Final 2";
  if(slot.startsWith("QF-"))return`Quarter-Final ${slot.slice(3)}`;
  if(slot.startsWith("R16-"))return`Round of 16 (${slot.slice(4)})`;
  if(slot.startsWith("R32-"))return`Round of 32 (${slot.slice(4)})`;
  return slot;
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

const T = {
  cardBg:"rgba(255,255,255,0.05)", border:"rgba(255,255,255,0.10)",
  amber:"#f0b429", amberBg:"rgba(240,180,41,0.14)", amberBorder:"rgba(240,180,41,0.38)",
  green:"#3ecf6e", greenBg:"rgba(62,207,110,0.12)", greenBorder:"rgba(62,207,110,0.35)",
  red:"#f06060", redBg:"rgba(240,96,96,0.12)", redBorder:"rgba(240,96,96,0.35)",
  blue:"#5ba8e0", blueBg:"rgba(91,168,224,0.12)", blueBorder:"rgba(91,168,224,0.35)",
  text:"#e8f0e9", muted:"#6a8c72", night:"#c084fc",
  cellCorrect:"rgba(28,110,50,0.80)", cellWrong:"rgba(160,30,30,0.82)",
  cellPending:"rgba(160,120,10,0.55)", cellNoPick:"rgba(40,50,60,0.70)",
};
const ADMIN_PW = "worldcup2026";

export default function App() {
  const [players,    setPlayers]    = useState([]);
  const [screen,     setScreen]     = useState("profile");
  const [activeId,   setActiveId]   = useState(() => { try { return localStorage.getItem("lps_activeId")||null; } catch { return null; } });
  const [koFixtures, setKoFixtures] = useState({});
  const [results,    setResults]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState(null);
  const toastRef = useRef(null);

  const activePlayer = players.find(p=>p.id==activeId)||null;
  const today = todayET();

  function toast_(type,msg) { clearTimeout(toastRef.current); setToast({type,msg}); toastRef.current=setTimeout(()=>setToast(null),4500); }

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: pData } = await supabase.from("players").select("*").order("lives",{ascending:false});
      const { data: pickData } = await supabase.from("picks").select("*");
      const { data: resData } = await supabase.from("results").select("*");
      const { data: koData } = await supabase.from("ko_fixtures").select("*");

      // picks stored per match: player.picks[matchId] = choice
      const picksByPlayer = {};
      (pickData||[]).forEach(pk => {
        if (!picksByPlayer[pk.player_id]) picksByPlayer[pk.player_id] = {};
        const key = pk.match_id || pk.pick_date; // fallback for old rows
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

      const savedId = localStorage.getItem("lps_activeId");
      if (savedId && assembled.find(p=>p.id==savedId)) {
        setActiveId(Number(savedId));
        setScreen("pick");
      }
    } catch(e) {
      toast_("error","Connection error — check Supabase credentials.");
      console.error(e);
    }
    setLoading(false);
  }, []); // eslint-disable-line

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { const i=setInterval(()=>loadAll(),30000); return()=>clearInterval(i); }, [loadAll]);
  useEffect(() => { try { activeId ? localStorage.setItem("lps_activeId",String(activeId)) : localStorage.removeItem("lps_activeId"); } catch {} }, [activeId]);

  // pickOutcome for grid — check if the player has a pick for this match on this date
  function pickOutcomeForMatch(player, matchId, pickDate) {
    const choice = player.picks[String(matchId)];
    const locked = isLocked(pickDate);
    if (!choice) return locked ? "locked_nopick" : "future";
    const r = results[`${pickDate}|${choice}`];
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

  async function logResult(pickDate, winTeam, loseTeam, wasDraw) {
    const rows = wasDraw
      ? [{pick_date:pickDate,team:"Draw",outcome:"draw_correct"},{pick_date:pickDate,team:winTeam,outcome:"draw_wrong"},{pick_date:pickDate,team:loseTeam,outcome:"draw_wrong"}]
      : [{pick_date:pickDate,team:winTeam,outcome:"win"},{pick_date:pickDate,team:loseTeam,outcome:"lose"},{pick_date:pickDate,team:"Draw",outcome:"draw_wrong"}];
    await supabase.from("results").upsert(rows,{onConflict:"pick_date,team"});

    // Get all matches on this day to find who picked what
    const dayMatches = getMatchesForPickDate(pickDate);
    const active = players.filter(p=>!p.eliminated&&p.lives>0);

    // Who loses a life? Anyone whose pick on any match this day matches the loser
    const losers = active.filter(p => {
      const dp = getDayPick(p, pickDate);
      if (!dp) return true; // no pick = Howard's law = lose a life
      return wasDraw ? dp.choice!=="Draw" : (dp.choice===loseTeam||dp.choice==="Draw");
    });

    if(!wasDraw && losers.length===active.length && active.length>0){
      toast_("info","⚖️ Midda's Law — everyone wrong, no lives lost!");
      loadAll(); return;
    }

    const updates = [];
    for(const p of active){
      const dp = getDayPick(p, pickDate);
      const lost = !dp || (wasDraw ? dp.choice!=="Draw" : (dp.choice===loseTeam||dp.choice==="Draw"));
      if(lost){ const nl=p.lives-1; updates.push(supabase.from("players").update({lives:nl,eliminated:nl===0}).eq("id",p.id)); }
    }
    await Promise.all(updates);
    toast_("success","Result logged. Lives updated.");
    loadAll();
  }

  async function applyHowardsLaw(pickDate) {
    const teams = getMatchesForPickDate(pickDate).flatMap(m=>[m.home,m.away]).filter(Boolean);
    const lowest = teams[teams.length-1]||""; if(!lowest)return;
    const dayMatches = getMatchesForPickDate(pickDate);
    const firstMatch = dayMatches[0]; if(!firstMatch)return;
    const unpicked = players.filter(p=>p.lives>0&&!p.eliminated&&!getDayPick(p,pickDate));
    if(!unpicked.length){toast_("info","All active players already have picks.");return;}
    const inserts = unpicked.map(p=>({player_id:p.id,pick_date:pickDate,match_id:String(firstMatch.id),choice:lowest}));
    await supabase.from("picks").upsert(inserts,{onConflict:"player_id,pick_date,match_id"});
    toast_("info",`Howard's Law — ${unpicked.length} player(s) assigned ${lowest}`);
    loadAll();
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
      await supabase.from("picks").delete().eq("player_id",pid).eq("pick_date",pickDate).eq("match_id",String(matchId));
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
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"rgba(0,0,0,0.22)",borderRadius:8,marginBottom:5,flexWrap:"wrap",gap:6}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {m.group&&<span style={{...pill("muted"),fontSize:10}}>Grp {m.group}</span>}
          {m.slot&&<span style={{...pill("muted"),fontSize:10}}>{slotLabel(m.slot)}</span>}
          <span style={{fontSize:13}}>{m.home?`${f(m.home)} ${m.home}`:"TBD"} <span style={{color:T.muted}}>vs</span> {m.away?`${f(m.away)} ${m.away}`:"TBD"}</span>
        </div>
        <span style={{fontSize:12,color:m.earlyHours?T.night:T.muted}}>{m.earlyHours?"🌙 ":""}{fmtBST(m.kickoffBST)} BST</span>
      </div>
    );
  }

  if(loading) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a1a10 0%,#0d2016 55%,#0a1a10 100%)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,color:T.amber,fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{fontSize:48}}>🏆</div>
      <div style={{fontSize:18,fontWeight:700}}>Last Person Standing</div>
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
            <h1 style={{fontSize:30,fontWeight:900,color:T.amber,letterSpacing:-0.5,margin:"8px 0 4px"}}>Last Person Standing</h1>
            <div style={{fontSize:11,color:T.muted,letterSpacing:3,textTransform:"uppercase"}}>FIFA World Cup 2026</div>
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
              <div><div style={{fontSize:12,color:T.muted,marginBottom:5}}>Your name</div><input ref={ref} style={inp} placeholder="e.g. Danny" value={name} onChange={e=>{setName(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} /></div>
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
    if(!p) return <div style={card}><p style={{color:T.muted,marginBottom:12}}>Not signed in.</p><button style={btn()} onClick={()=>setScreen("profile")}>← Choose profile</button></div>;
    const upcomingDates=activeDates.filter(d=>d>=today);
    const groupDatesUpcoming=upcomingDates.filter(d=>phaseOf(d)==="GROUP");
    const koDatesUpcoming=upcomingDates.filter(d=>phaseOf(d)!=="GROUP");

    return (
      <>
        <div style={{...card,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <div style={{width:46,height:46,borderRadius:"50%",background:avatarBg(p.name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff",flexShrink:0}}>{initials(p.name)}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:17,fontWeight:800}}>{p.name}</div>
            <div style={{fontSize:12,color:T.muted}}>{"❤️".repeat(p.lives)} {p.lives} live{p.lives!==1?"s":""} remaining</div>
          </div>
          <button style={{...btn(),fontSize:12,padding:"7px 12px"}} onClick={()=>setScreen("profile")}>⇄ Switch player</button>
          <button style={{...btn(),fontSize:12,padding:"7px 12px"}} onClick={()=>setScreen("grid")}>📊 Grid</button>
        </div>

        {groupDatesUpcoming.length>0&&(
          <div style={card}>
            <div style={sec}>⚽ Group Stage — pick in advance for any day</div>
            <p style={{fontSize:12,color:T.muted,marginBottom:16}}>Pick one match result per day before the first kick-off. 🌙 = early hours UK, still belongs to this day.</p>
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
                    {dayPick&&(
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{...pill("amber"),fontSize:12}}>{f(dayPick.choice)} {dayPick.choice} ✓</span>
                        {!locked&&<button style={{...btn(),fontSize:11,padding:"4px 8px"}} onClick={()=>clearPick(p.id,pickDate,dayPick.matchId)}>✕ Change</button>}
                      </div>
                    )}
                  </div>

                  {!locked&&matches.map(m=>{
                    const myPick=p.picks[String(m.id)];
                    const isPickedHere=!!myPick;
                    // If player has already picked a different match today, disable this one
                    const otherMatchPicked=dayPick&&dayPick.matchId!==String(m.id);

                    return (
                      <div key={m.id} style={{marginBottom:12,opacity:otherMatchPicked?0.4:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
                          <span style={pill("muted")}>Grp {m.group}</span>
                          <span style={{fontSize:11,color:m.earlyHours?T.night:T.muted}}>{m.earlyHours?"🌙 ":""}{fmtBST(m.kickoffBST)} BST</span>
                          {otherMatchPicked&&<span style={{fontSize:11,color:T.muted,fontStyle:"italic"}}>— pick already made for today</span>}
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                          {["Draw",m.home,m.away].map(choice=>{
                            const usedNotHere=choice!=="Draw"&&usedPhase.includes(choice)&&myPick!==choice;
                            const sel=myPick===choice;
                            const disabled=otherMatchPicked||usedNotHere||locked;
                            return <button key={choice} style={teamBtn(sel,disabled)} disabled={disabled} onClick={()=>!disabled&&makePick(p.id,pickDate,m.id,choice)}>
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
    const gridDates=activeDates.filter(d=>d<=today||players.some(p=>getDayPick(p,d))).slice(0,30);
    const sorted=[...players].sort((a,b)=>b.lives-a.lives||a.name.localeCompare(b.name));
    function cellBg(o){if(o==="correct")return T.cellCorrect;if(o==="wrong")return T.cellWrong;if(o==="pending")return T.cellPending;if(o==="locked_nopick")return T.cellNoPick;return"transparent";}

    return (
      <div style={card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
          <div style={sec}>📊 All Picks — Live Grid</div>
          <button style={{...btn("amber"),fontSize:13,padding:"7px 14px"}} onClick={()=>setScreen("profile")}>Make my picks →</button>
        </div>
        {gridDates.length===0&&<div style={{textAlign:"center",padding:"32px 0",color:T.muted}}><div style={{fontSize:36,marginBottom:12}}>⏳</div>Grid fills as players make picks.</div>}
        {gridDates.length>0&&(
          <div style={{overflowX:"auto"}}>
            <table style={{borderCollapse:"collapse",minWidth:"100%",fontSize:12}}>
              <thead>
                <tr>
                  <th style={{padding:"8px 12px",textAlign:"left",color:T.muted,fontWeight:600,fontSize:11,whiteSpace:"nowrap",borderBottom:`1px solid ${T.border}`,position:"sticky",left:0,background:"#0f2416",zIndex:2}}>Player</th>
                  <th style={{padding:"6px 8px",textAlign:"center",color:T.muted,fontWeight:600,fontSize:10,borderBottom:`1px solid ${T.border}`}}>Lives</th>
                  {gridDates.map(d=><th key={d} style={{padding:"6px 8px",textAlign:"center",color:d===today?T.amber:T.muted,fontWeight:600,fontSize:10,borderBottom:`1px solid ${T.border}`,minWidth:72,whiteSpace:"nowrap"}}>{fmtDateShort(d)}</th>)}
                </tr>
                <tr>
                  <td style={{position:"sticky",left:0,background:"#0f2416",zIndex:2}}></td><td></td>
                  {gridDates.map(d=>{const ms=getMatchesForPickDate(d);return <td key={d} style={{padding:"3px 4px",textAlign:"center",borderBottom:`1px solid ${T.border}`}}>{ms.map((m,i)=><div key={i} style={{fontSize:9,color:T.muted,lineHeight:1.4,whiteSpace:"nowrap"}}>{m.home&&m.away?`${f(m.home)}v${f(m.away)}`:m.slot?slotLabel(m.slot):""}</div>)}</td>;})}
                </tr>
              </thead>
              <tbody>
                {sorted.map((p,pi)=>(
                  <tr key={p.id} style={{background:pi%2===0?"rgba(0,0,0,0.18)":"transparent"}}>
                    <td style={{padding:"8px 12px",whiteSpace:"nowrap",position:"sticky",left:0,background:pi%2===0?"#0d1e14":"#101e15",zIndex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:22,height:22,borderRadius:"50%",background:p.eliminated?"#1a2e20":avatarBg(p.name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",flexShrink:0}}>{initials(p.name)}</div>
                        <span style={{color:p.eliminated?"#3a5a40":T.text,fontWeight:600}}>{p.name}</span>
                      </div>
                    </td>
                    <td style={{padding:"8px",textAlign:"center",fontSize:11}}>{p.eliminated?"💀":"❤️".repeat(p.lives)}</td>
                    {gridDates.map(d=>{
                      const dp=getDayPick(p,d);
                      const o=pickOutcomeForDay(p,d);
                      const bg=cellBg(o);
                      const pick=dp?dp.choice:null;
                      const text=pick?(pick==="Draw"?"Draw":pick.length>8?pick.slice(0,8)+"…":pick):(isLocked(d)?"—":"");
                      return <td key={d} style={{padding:"6px 4px",textAlign:"center",background:bg,border:`1px solid rgba(255,255,255,0.04)`}}>
                        <div style={{fontSize:11,fontWeight:600,color:o==="correct"?"#b0ffcc":o==="wrong"?"#ffb0b0":o==="pending"?"#ffe08a":pick?T.text:T.muted,whiteSpace:"nowrap"}}>
                          {pick?<>{f(pick)} {text}</>:<span style={{color:"#2a4030",fontSize:10}}>{text}</span>}
                        </div>
                      </td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:16}}>
          {[[T.cellCorrect,"✓ Correct"],[T.cellWrong,"✗ Wrong"],[T.cellPending,"⏳ Result pending"],[T.cellNoPick,"— No pick"]].map(([bg,label])=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:T.muted}}><div style={{width:14,height:14,borderRadius:3,background:bg}}></div>{label}</div>
          ))}
        </div>
      </div>
    );
  }

  function RulesView() {
    const rules=[["💰","Entry & prize","£10 per player. Winner takes all."],["⚽","Pick daily","One match result per day before the first kick-off (BST). Pick a specific match — team to win or a draw. Unlimited changes until deadline."],["🌙","Early-hours kick-offs","Games kicking off between midnight and 8am BST are grouped with the previous evening's round."],["🚫","No repeats — Group Stage","Can't pick the same team twice across the entire group stage (June 11–27)."],["🚫","No repeats — L32 & L16","Same rule across Round of 32 and Round of 16 combined."],["✅","QF onwards — no restriction","Quarter-finals, semis and final: pick freely, no repeat restrictions."],["⚖️","Draw","Valid pick in group stage only. Not allowed in knockout rounds."],["❤️","6 lives","Wrong pick = lose a life. Zero lives = eliminated."],["⚡","Howard's Law","Miss the deadline? Automatically assigned the lowest FIFA-ranked team playing that day. If already used, you lose a life."],["⚖️","Midda's Law","If every remaining player picks wrong in the same round, nobody loses a life."],["🏅","Remy's Law","Multiple finalists get tiebreak picks equal to the life difference between them. Same lives = one pick each."],["🎯","Final tiebreak","Predict the minute of the first goal AND the minute of the first corner."]];
    return (
      <div><div style={{...card,background:T.amberBg,border:`1px solid ${T.amberBorder}`}}>
        <div style={{textAlign:"center",marginBottom:20}}><div style={{fontSize:40,marginBottom:8}}>📖</div><h2 style={{fontSize:22,fontWeight:800,color:T.amber,marginBottom:4}}>The Rules</h2><p style={{fontSize:13,color:T.muted}}>Last Person Standing — FIFA World Cup 2026</p></div>
        {rules.map(([icon,title,desc])=>(
          <div key={title} style={{display:"flex",gap:14,padding:"14px 0",borderBottom:`1px solid ${T.border}`}}>
            <div style={{fontSize:22,flexShrink:0,marginTop:2}}>{icon}</div>
            <div><div style={{fontWeight:700,fontSize:14,color:T.amber,marginBottom:4}}>{title}</div><div style={{fontSize:13,color:T.text,lineHeight:1.65}}>{desc}</div></div>
          </div>
        ))}
      </div></div>
    );
  }

  function Schedule() {
    const phases=[["Group Stage","2026-06-11","2026-06-27"],["Round of 32","2026-06-28","2026-07-03"],["Round of 16","2026-07-04","2026-07-07"],["Quarter-Finals","2026-07-08","2026-07-11"],["Semi-Finals","2026-07-12","2026-07-15"],["3rd Place Play-off","2026-07-18","2026-07-18"],["Final","2026-07-19","2026-07-19"]];
    return phases.map(([label,from,to])=>{
      const dates=allPickDates.filter(d=>d>=from&&d<=to); if(!dates.length)return null;
      return (<div key={label} style={card}><div style={sec}>{label}</div>{dates.map(pickDate=>{const ms=getMatchesForPickDate(pickDate),dlBST=deadlineBSTByPickDate[pickDate];return(<div key={pickDate}><div style={{fontSize:12,color:T.amber,fontWeight:700,margin:"10px 0 6px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>{fmtDate(pickDate)}{dlBST&&<span style={{color:T.muted,fontWeight:400,fontSize:11}}>— picks close {fmtBST(dlBST)} BST</span>}{pickDate===today&&<span style={pill("blue")}>TODAY</span>}</div>{ms.length===0&&<div style={{fontSize:12,color:T.muted,padding:"6px 12px"}}>Fixtures TBD</div>}{ms.map((m,i)=><MatchRow key={i} m={m}/>)}</div>);})}</div>);
    });
  }

  function Admin() {
    const [pw,setPw]=useState(""); const [authed,setAuth]=useState(false);
    const [tab,setTab]=useState("results");
    const [koInputs,setKoInputs]=useState({});
    const [editPicks,setEditPicks]=useState({});
    const [resetPws,setResetPws]=useState({});

    if(!authed) return (
      <div style={{maxWidth:340,margin:"60px auto"}}>
        <div style={{...card,padding:28,textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:10}}>🔐</div>
          <div style={{fontWeight:700,fontSize:17,color:T.amber,marginBottom:18}}>Admin Access</div>
          <input style={{...inp,textAlign:"center",marginBottom:12}} type="password" placeholder="Admin password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(pw===ADMIN_PW?setAuth(true):toast_("error","Wrong password"))} />
          <button style={{...btn("amber"),width:"100%"}} onClick={()=>pw===ADMIN_PW?setAuth(true):toast_("error","Wrong password")}>Enter</button>
        </div>
      </div>
    );

    const tabs=[["results","🏁 Results"],["players","👤 Players"],["fixtures","🔧 Fixtures"]];
    const pastDates=activeDates.filter(d=>isLocked(d));

    return (
      <>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {tabs.map(([k,l])=><button key={k} style={{...navBtn(tab===k),fontSize:13}} onClick={()=>setTab(k)}>{l}</button>)}
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
                      <div style={{fontWeight:600,fontSize:13,marginBottom:8}}>{f(m.home)} {m.home} vs {f(m.away)} {m.away} · {fmtBST(m.kickoffBST)} BST {m.earlyHours?"🌙":""}</div>
                      {logged?<span style={pill("green")}>✓ Result logged</span>:(
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                          <button style={{...btn("green"),fontSize:12,padding:"6px 12px"}} onClick={()=>logResult(pickDate,m.home,m.away,false)}>{f(m.home)} {m.home} won</button>
                          <button style={{...btn("green"),fontSize:12,padding:"6px 12px"}} onClick={()=>logResult(pickDate,m.away,m.home,false)}>{f(m.away)} {m.away} won</button>
                          {!m.isKnockout&&<button style={{...btn(),fontSize:12,padding:"6px 12px"}} onClick={()=>logResult(pickDate,m.home,m.away,true)}>⚖️ Draw</button>}
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

        {tab==="players"&&(
          <div style={card}>
            <div style={sec}>👤 Manage Players</div>
            {players.map(p=>(
              <div key={p.id} style={{marginBottom:20,paddingBottom:20,borderBottom:`1px solid ${T.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12,flexWrap:"wrap"}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:avatarBg(p.name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"}}>{initials(p.name)}</div>
                  <div style={{flex:1}}><div style={{fontWeight:700,fontSize:15}}>{p.name}</div><div style={{fontSize:12,color:T.muted}}>{p.eliminated?"💀 Eliminated":"❤️".repeat(p.lives)+" "+p.lives+" lives"}</div></div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <button style={{...btn("danger"),fontSize:12,padding:"4px 10px"}} onClick={()=>adminAdjustLives(p.id,-1)}>−</button>
                    <span style={{fontSize:13,minWidth:20,textAlign:"center"}}>{p.lives}</span>
                    <button style={{...btn("green"),fontSize:12,padding:"4px 10px"}} onClick={()=>adminAdjustLives(p.id,1)}>+</button>
                  </div>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={{fontSize:11,color:T.muted,marginBottom:6}}>Reset password</div>
                  <div style={{display:"flex",gap:8}}>
                    <input type="password" placeholder="New password" style={{...inp,flex:1,padding:"7px 10px",fontSize:13}} value={resetPws[p.id]||""} onChange={e=>setResetPws(prev=>({...prev,[p.id]:e.target.value}))} />
                    <button style={{...btn("amber"),fontSize:12,padding:"7px 14px"}} onClick={async()=>{const nw=(resetPws[p.id]||"").trim();if(nw.length<3){toast_("error","Too short.");return;}await adminResetPassword(p.id,nw);setResetPws(prev=>({...prev,[p.id]:""}));}}>Set</button>
                  </div>
                </div>
                <div style={{fontSize:11,color:T.muted,marginBottom:8}}>Edit picks (per match)</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {activeDates.map(pickDate=>{
                    const ms=getMatchesForPickDate(pickDate); if(!ms.length)return null;
                    return ms.map(m=>{
                      const currentPick=p.picks[String(m.id)];
                      const opts=phaseOf(pickDate)==="GROUP"?["Draw",m.home,m.away]:[m.home,m.away];
                      const eKey=`${p.id}_${m.id}`;
                      return (
                        <div key={m.id} style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                          <span style={{fontSize:11,color:T.muted,minWidth:60}}>{fmtDateShort(pickDate)}</span>
                          <span style={{fontSize:11,color:T.muted,minWidth:80}}>{m.home} v {m.away}</span>
                          <span style={{fontSize:12,color:currentPick?T.amber:T.muted,minWidth:80}}>{currentPick?`${f(currentPick)} ${currentPick}`:"— no pick"}</span>
                          <select style={{...inp,flex:1,padding:"4px 8px",fontSize:12,minWidth:100}} value={editPicks[eKey]||""} onChange={e=>setEditPicks(prev=>({...prev,[eKey]:e.target.value}))}>
                            <option value="">— change to…</option>
                            {opts.map(t=><option key={t} value={t}>{f(t)} {t}</option>)}
                            <option value="CLEAR">✕ Clear pick</option>
                          </select>
                          <button style={{...btn("amber"),fontSize:11,padding:"4px 10px"}} onClick={async()=>{const val=editPicks[eKey];if(!val)return;await adminSetPick(p.id,pickDate,m.id,val);setEditPicks(prev=>({...prev,[eKey]:""}));}}>Save</button>
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            ))}
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
      </>
    );
  }

  const isNav=["pick","grid","schedule","rules","admin"].includes(screen);

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0a1a10 0%,#0d2016 55%,#0a1a10 100%)",fontFamily:"'Segoe UI',system-ui,sans-serif",color:T.text}}>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}*{box-sizing:border-box;margin:0;padding:0}select option{background:#0d2016}button:hover:not(:disabled){filter:brightness(1.1)}`}</style>
      {isNav&&(
        <header style={{background:"rgba(0,0,0,0.5)",borderBottom:`1px solid ${T.amberBorder}`,padding:"11px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <button style={{display:"flex",alignItems:"center",gap:10,background:"none",border:"none",cursor:"pointer",padding:0}} onClick={()=>setScreen("profile")}>
            <span style={{fontSize:22}}>🏆</span>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:16,fontWeight:900,color:T.amber}}>Last Person Standing</div>
              <div style={{fontSize:9,color:T.muted,letterSpacing:3,textTransform:"uppercase"}}>FIFA World Cup 2026</div>
            </div>
          </button>
          <nav style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
            {activePlayer&&<button style={navBtn(screen==="pick")} onClick={()=>setScreen("pick")}>⚽ My Picks</button>}
            <button style={navBtn(screen==="grid")} onClick={()=>setScreen("grid")}>📊 Grid</button>
            <button style={navBtn(screen==="schedule")} onClick={()=>setScreen("schedule")}>📅 Schedule</button>
            <button style={navBtn(screen==="rules")} onClick={()=>setScreen("rules")}>📖 Rules</button>
            <button style={navBtn(screen==="admin")} onClick={()=>setScreen("admin")}>👑 Admin</button>
            <button style={{...btn("amber"),fontSize:13,padding:"7px 13px"}} onClick={()=>setScreen("profile")}>{activePlayer?`👤 ${activePlayer.name}`:"Sign in →"}</button>
          </nav>
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
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:toast.type==="error"?"rgba(160,35,35,0.97)":toast.type==="success"?"rgba(20,120,55,0.97)":"rgba(20,70,140,0.97)",color:"#fff",padding:"11px 24px",borderRadius:30,fontSize:14,fontWeight:600,boxShadow:"0 4px 28px rgba(0,0,0,0.6)",zIndex:999,whiteSpace:"nowrap",animation:"slideUp 0.2s ease"}}>{toast.msg}</div>}
    </div>
  );
}
