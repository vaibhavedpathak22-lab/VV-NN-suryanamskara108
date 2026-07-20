'use strict';

/* ── 12 Poses + Mantras ─────────────────────────────────────── */
const STEPS = [
  { pose:"Pranamasana",           sub:"Prayer pose",                  breath:"Exhale", breathClass:"exhale", mantra:"Om Mitraya Namaha",          meaning:"Salutations to the friend of all",             mantraD:"ॐ मित्राय नमः" },
  { pose:"Hasta Uttanasana",      sub:"Raised arms pose",             breath:"Inhale", breathClass:"inhale", mantra:"Om Ravaye Namaha",            meaning:"Salutations to the shining one",               mantraD:"ॐ रवये नमः" },
  { pose:"Hasta Padasana",        sub:"Hand to foot pose",            breath:"Exhale", breathClass:"exhale", mantra:"Om Suryaya Namaha",           meaning:"Salutations to the dispeller of darkness",     mantraD:"ॐ सूर्याय नमः" },
  { pose:"Ashwa Sanchalanasana",  sub:"Equestrian — right leg back",  breath:"Inhale", breathClass:"inhale", mantra:"Om Bhanave Namaha",           meaning:"Salutations to the one who illumines",         mantraD:"ॐ भानवे नमः" },
  { pose:"Dandasana",             sub:"Stick pose / plank",           breath:"Hold",   breathClass:"hold",   mantra:"Om Khagaya Namaha",           meaning:"Salutations to the one who moves through sky", mantraD:"ॐ खगाय नमः" },
  { pose:"Ashtanga Namaskara",    sub:"Salute with eight limbs",      breath:"Exhale", breathClass:"exhale", mantra:"Om Pushne Namaha",            meaning:"Salutations to the giver of nourishment",     mantraD:"ॐ पूष्णे नमः" },
  { pose:"Bhujangasana",          sub:"Cobra pose",                   breath:"Inhale", breathClass:"inhale", mantra:"Om Hiranya Garbhaya Namaha",  meaning:"Salutations to the golden cosmic self",        mantraD:"ॐ हिरण्यगर्भाय नमः" },
  { pose:"Adho Mukha Svanasana",  sub:"Downward facing dog",          breath:"Exhale", breathClass:"exhale", mantra:"Om Marichaye Namaha",         meaning:"Salutations to the lord of the dawn",          mantraD:"ॐ मरीचये नमः" },
  { pose:"Ashwa Sanchalanasana",  sub:"Equestrian — left leg back",   breath:"Inhale", breathClass:"inhale", mantra:"Om Adityaya Namaha",          meaning:"Salutations to the son of cosmic mother",      mantraD:"ॐ आदित्याय नमः" },
  { pose:"Hasta Padasana",        sub:"Hand to foot pose",            breath:"Exhale", breathClass:"exhale", mantra:"Om Savitre Namaha",           meaning:"Salutations to the lord of creation",          mantraD:"ॐ सवित्रे नमः" },
  { pose:"Hasta Uttanasana",      sub:"Raised arms pose",             breath:"Inhale", breathClass:"inhale", mantra:"Om Arkaya Namaha",            meaning:"Salutations to the form of the sun",           mantraD:"ॐ अर्काय नमः" },
  { pose:"Pranamasana",           sub:"Prayer pose",                  breath:"Exhale", breathClass:"exhale", mantra:"Om Bhaskaraya Namaha",        meaning:"Salutations to the one who leads to enlightenment", mantraD:"ॐ भास्कराय नमः" }
];

const CIRC = 2 * Math.PI * 98;
const KEY  = "surya-v36";
let _goalRolledDate = "";  // tracks date for which 4:01 AM rollover already ran

/* ── Config ─────────────────────────────────────────────────── */
let cfg = {
  programName   : "वैभव - सूर्यसारथी.१ॐ८",
  dailyIncrease : 4,
  maxSets       : 108,
  breakEvery    : 12,
  voiceOn       : true,
  mantrasOn     : true,
  breathOn      : true,
  autoOn        : true,
  poseSeconds   : 5,
  graceSeconds  : 5,
  chartDays         : 7,
  chartMode         : "bar",
  pranayamaMinutes  : 28,
  pranayamaAuto     : true,
  pranaLang         : "en",
  alarmOn           : true,
  alarmHour         : 5,
  alarmMinute       : 0,
};

/* ── Data (persisted) ───────────────────────────────────────── */
let data = {
  history       : {},   // { "YYYY-MM-DD": { sets, timeMs, goal } }
  totalAllTime  : 0,
  totalTimeMs   : 0,
  programDay    : 1,
  lastDate      : "",
  baseGoal      : 0,    // today's goal (editable); 0 = auto from programDay
  goalDate      : "",   // date baseGoal was set for; resets +4 on new day
  lastGoal       : 0,    // goal of last completed day — used for exact +4 calc
  lastRecoveryAt : 0,    // totalAllTime count at which last recovery was triggered
  lastRolledDate : "",   // date on which 4:01 AM goal rollover last ran
};

/* ── Session (runtime) ──────────────────────────────────────── */
let sess = {
  active   : false,
  paused   : false,
  step     : -1,
  breakAcc : 0,
  // session stopwatch (today's goal timer)
  sessionStart  : 0,   // Date.now() when session started
  sessionPaused : 0,   // accumulated ms while paused
  pauseAt       : 0,   // Date.now() when paused
};

let poseRafHandle  = null;  // rAF for pose countdown bar
let poseTimerStart = 0;
let poseElapsed    = 0;
let clockRaf       = null;  // rAF for live clock display
let voiceMuted     = false;

/* ── Helpers ─────────────────────────────────────────────────── */
const todayKey  = () => new Date().toISOString().slice(0,10);
const dayKey    = n  => { const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); };
const todayDone = () => (data.history[todayKey()]||{}).sets || 0;
const vib       = ms => { try { navigator.vibrate&&navigator.vibrate(ms); }catch(e){} };
const setStatus = t  => document.getElementById("status").textContent = t;

function fmtTime(ms) {
  const totalSec = Math.floor(ms/1000);
  const h = Math.floor(totalSec/3600);
  const m = Math.floor((totalSec%3600)/60);
  const s = totalSec % 60;
  if(h>0) return h+"h "+String(m).padStart(2,"0")+"m "+String(s).padStart(2,"0")+"s";
  if(m>0) return m+"m "+String(s).padStart(2,"0")+"s";
  return s+"s";
}

function computeStreak() {
  let s=0;
  for(let i=0;;i++){ if(todayDoneFor(dayKey(i))>0) s++; else break; }
  return s;
}
function todayDoneFor(key) { return (data.history[key]||{}).sets || 0; }

function todayGoal() {
  const today = todayKey();
  // Manual goal set for today
  if(data.baseGoal > 0 && data.goalDate === today)
    return Math.min(data.baseGoal, cfg.maxSets);
  // Repeat goal: yesterday was not completed — same goal today (no +4)
  if(data.repeatGoal > 0 && data.repeatGoalDate === today)
    return Math.min(data.repeatGoal, cfg.maxSets);
  // Auto: last COMPLETED goal + dailyIncrease
  if(data.lastGoal > 0)
    return Math.min(data.lastGoal + cfg.dailyIncrease, cfg.maxSets);
  // Day 1 fallback
  return Math.min((data.programDay||1) * cfg.dailyIncrease, cfg.maxSets);
}

function setTodayGoal(n) {
  data.baseGoal   = Math.max(1, Math.min(n, cfg.maxSets));
  data.goalDate   = todayKey();
  data.lastGoal   = data.baseGoal;  // set immediately so midnight rollover uses it
  data.programDay = Math.max(1, Math.round(data.baseGoal / cfg.dailyIncrease));
  saveAll();
}

/* ── Persist ─────────────────────────────────────────────────── */
function loadAll() {
  // All previous versions — newest first so we get the most recent data
  // ALL versions ever released — newest first so best data is picked first
  const OLD_KEYS = [
    "surya-v33","surya-v32","surya-v31","surya-v30","surya-v29",
    "surya-v28","surya-v27","surya-v26","surya-v25","surya-v24","surya-v23",
    "surya-v22","surya-v21","surya-v20","surya-v19","surya-v18","surya-v17",
    "surya-v16","surya-v15","surya-v14","surya-v13","surya-v12","surya-v11",
    "surya-v10","surya-v9","surya-v8","surya-v7","surya-v6","surya-v5",
    "surya-v4","surya-v3","surya-v2","surya-v1","surya-namaskara-data-v1","surya-v0"
  ];

  // Helper: parse any save format → { cfg, data }
  function parseSave(raw) {
    const sv = JSON.parse(raw);
    if(sv.data && typeof sv.data === "object") {
      return { cfg: sv.cfg||{}, data: sv.data };
    } else if(sv.history || sv.totalAllTime !== undefined) {
      return { cfg:{}, data:{
        history      : sv.history      || {},
        totalAllTime : sv.totalAllTime || 0,
        totalTimeMs  : sv.totalTimeMs  || 0,
        programDay   : sv.programDay   || 1,
        lastDate     : sv.lastDate     || "",
        baseGoal     : sv.baseGoal     || 0,
        goalDate     : sv.goalDate     || "",
        lastGoal     : sv.lastGoal     || 0,
        lastRecoveryAt: sv.lastRecoveryAt || 0,
      }};
    }
    return null;
  }

  // Helper: normalise a history record to { sets, timeMs, goal }
  function normRec(v) {
    if(typeof v === "number") return { sets:v, timeMs:0, goal:0 };
    return { sets:v.sets||0, timeMs:v.timeMs||0, goal:v.goal||0 };
  }

  // Helper: merge one history object into data.history (keep max sets, sum time)
  function mergeHistory(src) {
    Object.keys(src).forEach(date => {
      const r = normRec(src[date]);
      if(!data.history[date]) {
        data.history[date] = r;
      } else {
        data.history[date].sets   = Math.max(data.history[date].sets||0,   r.sets);
        data.history[date].timeMs = Math.max(data.history[date].timeMs||0, r.timeMs);
        if(!data.history[date].goal && r.goal) data.history[date].goal = r.goal;
      }
    });
  }

  try {
    const TODAY = new Date().toISOString().slice(0,10);
    const curRaw = localStorage.getItem(KEY);

    if(curRaw) {
      // ── Current key exists — load it exactly, protect today's data ──────
      const sv = parseSave(curRaw);
      if(sv) {
        Object.assign(cfg,  sv.cfg  || {});
        Object.assign(data, sv.data || {});
        Object.keys(data.history).forEach(k => {
          data.history[k] = normRec(data.history[k]);
        });
        // totalAllTime, totalTimeMs, today's sets and time are AUTHORITATIVE
        // as stored — never recompute, never override. completeSet() is the
        // only function allowed to increment these.
      }

    } else {
      // ── First-time load with new key — one-time migration from old keys ──
      const allRaws = [];
      for(const ok of OLD_KEYS) {
        const r = localStorage.getItem(ok);
        if(r) allRaws.push({ key:ok, raw:r });
      }

      if(allRaws.length > 0) {
        const parsed = [];
        for(const s of allRaws) {
          try {
            const p = parseSave(s.raw);
            if(p) parsed.push({ key:s.key, ...p });
          } catch(e) { console.warn("Could not parse", s.key); }
        }

        if(parsed.length > 0) {
          // ── Pick best base: highest totalAllTime = most complete ──────────
          parsed.sort((a,b) =>
            (b.data.totalAllTime||0) - (a.data.totalAllTime||0)
          );
          const base = parsed[0];
          Object.assign(cfg,  base.cfg  || {});
          Object.assign(data, base.data || {});
          Object.keys(data.history).forEach(k => {
            data.history[k] = normRec(data.history[k]);
          });

          // ── Snapshot today's values from the BEST save BEFORE merging ────
          // "Best" for today = highest sets count for today's date
          let todayBestSets  = data.history[TODAY]?.sets   || 0;
          let todayBestTime  = data.history[TODAY]?.timeMs || 0;
          let todayBestGoal  = data.history[TODAY]?.goal   || 0;
          let bestTotalSets  = data.totalAllTime || 0;
          let bestTotalTime  = data.totalTimeMs  || 0;

          // Check all old saves for a higher today-count
          for(const p of parsed) {
            const tr = normRec(p.data.history?.[TODAY] || {});
            if(tr.sets > todayBestSets) {
              todayBestSets = tr.sets;
              todayBestTime = Math.max(todayBestTime, tr.timeMs);
            }
            if((p.data.totalAllTime||0) > bestTotalSets)
              bestTotalSets = p.data.totalAllTime;
            if((p.data.totalTimeMs||0)  > bestTotalTime)
              bestTotalTime = p.data.totalTimeMs;
          }

          // ── Merge ONLY missing past dates — never overwrite existing ──────
          for(let i = 1; i < parsed.length; i++) {
            const srcHist = parsed[i].data.history || {};
            Object.keys(srcHist).forEach(date => {
              if(date === TODAY) return;      // handle today separately
              if(!data.history[date]) {
                data.history[date] = normRec(srcHist[date]);
              }
              // Existing past dates — left untouched (base is authoritative)
            });
          }

          // ── Restore today's best values (highest sets wins) ───────────────
          data.history[TODAY] = {
            sets  : todayBestSets,
            timeMs: todayBestTime,
            goal  : todayBestGoal,
          };

          // ── Restore totals — never reduce them ───────────────────────────
          data.totalAllTime = bestTotalSets;
          data.totalTimeMs  = bestTotalTime;

          // ── Restore today's manual goal if any save has one for today ─────
          for(const s of allRaws) {
            try {
              const p = parseSave(s.raw);
              if(!p) continue;
              if(p.data.goalDate === TODAY && (p.data.baseGoal||0) > 0) {
                data.baseGoal = p.data.baseGoal;
                data.goalDate = TODAY;
                data.lastGoal = p.data.lastGoal || p.data.baseGoal;
                break;
              }
            } catch(e) {}
          }

          console.log(
            "ONE-TIME migration complete | sources:", parsed.length,
            "| totalSets:", data.totalAllTime,
            "| totalTime:", Math.round((data.totalTimeMs||0)/60000) + "min",
            "| today sets:", todayBestSets,
            "| history days:", Object.keys(data.history).length
          );

          // Save under new key immediately
          try { localStorage.setItem(KEY, JSON.stringify({cfg, data})); } catch(e){}

          // Delete old keys — migration runs exactly once
          for(const s of allRaws) {
            try { localStorage.removeItem(s.key); } catch(e){}
          }
        }
      }
    }
  } catch(e) { console.error("loadAll error:", e); }

  const today = todayKey();
  if(data.lastDate && data.lastDate !== today) {
    // Count actual calendar days elapsed (handles multi-day skips)
    const last = new Date(data.lastDate + "T00:00:00");
    const now  = new Date(today         + "T00:00:00");
    const daysMissed = Math.max(1, Math.round((now - last) / 86400000));

    // Advance programDay by days elapsed so goal progression stays correct
    data.programDay = (data.programDay||1) + daysMissed;

    // For each skipped day in the gap — insert a 0-sets record with the goal
    // that was due that day, so the 21-day chart shows honest gaps
    for(let d = 1; d < daysMissed; d++) {
      const skipDate = new Date(last.getTime() + d * 86400000)
        .toISOString().slice(0, 10);
      if(!data.history[skipDate]) {
        const skipGoal = Math.min(
          (data.lastGoal || 0) + d * cfg.dailyIncrease,
          cfg.maxSets
        );
        data.history[skipDate] = { sets: 0, timeMs: 0, goal: skipGoal };
      }
    }

    // Save lastGoal so tomorrow = today's goal + dailyIncrease (exact, no drift)
    // Priority: baseGoal (manual set today) > history record > existing lastGoal
    if(data.baseGoal > 0 && data.goalDate === data.lastDate) {
      // User had manually set today's goal — use that as base for tomorrow
      data.lastGoal = data.baseGoal;
    } else {
      // Walk back through history to find last recorded goal
      for(let d = 1; d <= daysMissed + 1; d++) {
        const check = new Date(now.getTime() - d * 86400000)
          .toISOString().slice(0, 10);
        const rec = data.history[check];
        if(rec && rec.goal) { data.lastGoal = rec.goal; break; }
      }
    }

    data.baseGoal = 0;
    data.goalDate = "";
  }
  data.lastDate = today;

  // Safety: if today already has a completed history record with a goal,
  // make sure lastGoal reflects it so tomorrow is always +4 from today
  const todayHistRec = data.history[today];
  if(todayHistRec && todayHistRec.goal && todayHistRec.goal > (data.lastGoal||0)) {
    // Only update lastGoal if today's goal is higher (prevents regression)
    // Don't update if user manually set a lower goal intentionally
    if(!data.baseGoal || data.goalDate !== today) {
      data.lastGoal = todayHistRec.goal;
    }
  }

  voiceMuted = !cfg.voiceOn;

  // Restore rollover state from stored field
  // lastRolledDate is set by _doGoalRollover() and persisted in data
  _goalRolledDate = data.lastRolledDate || "";
}
function saveAll() {
  try { localStorage.setItem(KEY, JSON.stringify({cfg,data})); }
  catch(e){ setStatus("Storage full"); }
}

/* ── Voice ───────────────────────────────────────────────────── */
let voices=[], hiVoice=null;
function pickBestVoice() {
  voices = speechSynthesis.getVoices();
  hiVoice =
    voices.find(v=>v.lang==="sa-IN") ||
    voices.find(v=>v.lang==="hi-IN"&&v.localService) ||
    voices.find(v=>v.lang==="hi-IN") ||
    voices.find(v=>v.lang.startsWith("hi")) ||
    voices.find(v=>v.lang.startsWith("en-IN")) ||
    voices.find(v=>v.lang.startsWith("en")) || null;
  if(hiVoice) setStatus("Voice: "+hiVoice.name+" ("+hiVoice.lang+")");
}
window.speechSynthesis.onvoiceschanged = pickBestVoice;
if(speechSynthesis.getVoices().length>0) pickBestVoice();

/* ── Speech queue — no cancel() races ───────────────────────── */
// All utterances go through speakQ so they play one after another
// without cancelling each other.
const speechQ = [];
let speechBusy = false;

function qFlush() {
  if(speechBusy || speechQ.length === 0) return;
  speechBusy = true;
  const utt = speechQ.shift();
  const origEnd = utt.onend;
  utt.onend = (e) => {
    speechBusy = false;
    if(origEnd) origEnd(e);
    qFlush();
  };
  utt.onerror = () => { speechBusy = false; qFlush(); };
  try{ speechSynthesis.speak(utt); }catch(e){ speechBusy=false; qFlush(); }
}

function qSpeak(utt) {
  speechQ.push(utt);
  qFlush();
}

function qClear() {
  speechQ.length = 0;
  speechBusy = false;
  try{ speechSynthesis.cancel(); }catch(e){}
}

function makeMantraUtt(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang  = hiVoice ? hiVoice.lang : "hi-IN";
  if(hiVoice) u.voice = hiVoice;
  u.rate  = 0.72; u.pitch = 0.95; u.volume = 1.0;
  return u;
}

function makeEnUtt(text) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang  = "en-IN"; u.rate = 0.85; u.pitch = 1.05; u.volume = 1.0;
  const ev = voices.find(v=>v.lang==="en-IN") || voices.find(v=>v.lang.startsWith("en")) || null;
  if(ev) u.voice = ev;
  return u;
}

// Language-aware utterance for pranayama instructions
function makePranaUtt(text) {
  const lang = cfg.pranaLang || "en";
  const u = new SpeechSynthesisUtterance(text);

  // Always re-fetch voices list (may not be loaded on first call)
  const vList = speechSynthesis.getVoices();

  if(lang === "hi") {
    u.lang   = "hi-IN";
    u.rate   = 0.62;   // slower for Hindi — easier to follow
    u.pitch  = 1.0;
    u.volume = 1.0;
    const hv = vList.find(v=>v.lang==="hi-IN"&&v.localService)
            || vList.find(v=>v.lang==="hi-IN")
            || vList.find(v=>v.lang.startsWith("hi"))
            || null;
    if(hv) u.voice = hv;
  } else if(lang === "mr") {
    u.lang   = "mr-IN";
    u.rate   = 0.60;   // Marathi slightly slower
    u.pitch  = 1.0;
    u.volume = 1.0;
    const mv = vList.find(v=>v.lang==="mr-IN"&&v.localService)
            || vList.find(v=>v.lang==="mr-IN")
            || vList.find(v=>v.lang.startsWith("mr"))
            || null;
    if(mv) {
      u.voice = mv;
    } else {
      // Marathi TTS not installed — fall back to hi-IN (same Devanagari script)
      u.lang = "hi-IN";
      const hv = vList.find(v=>v.lang==="hi-IN") || null;
      if(hv) u.voice = hv;
    }
  } else {
    u.lang   = "en-IN";
    u.rate   = 0.68;   // slower English for better comprehension
    u.pitch  = 1.0;
    u.volume = 1.0;
    const ev = vList.find(v=>v.lang==="en-IN")
            || vList.find(v=>v.lang.startsWith("en"))
            || null;
    if(ev) u.voice = ev;
  }
  return u;
}

// Speak mantra (Sanskrit) then optional breath cue (English) — queued
function speakMantra(text, breath="", delay=0) {
  if(voiceMuted || !window.speechSynthesis) return;
  const doMantra = cfg.mantrasOn !== false;
  const doBreath = cfg.breathOn  !== false && breath;
  if(!doMantra && !doBreath) return;
  setTimeout(()=>{
    if(doMantra) qSpeak(makeMantraUtt(text));
    if(doBreath) qSpeak(makeEnUtt(breath));
  }, delay);
}

// Speak English text — queued
function speakText(text, delay=0) {
  if(voiceMuted || !window.speechSynthesis) return;
  setTimeout(()=>{ qSpeak(makeEnUtt(text)); }, delay);
}

// Get pranayama text in the right language from a step object OR plain string
function getPranaText(textOrObj) {
  if(typeof textOrObj === "string") return textOrObj;
  const lang = cfg.pranaLang || "en";
  if(lang === "hi") return textOrObj.hi || textOrObj.en;
  if(lang === "mr") return textOrObj.mr || textOrObj.hi || textOrObj.en;
  return textOrObj.en;
}

// Speak pranayama instruction in selected language — queued
function speakPrana(textOrObj, delay=0) {
  if(voiceMuted || !window.speechSynthesis) return;
  const text = getPranaText(textOrObj);
  setTimeout(()=>{ qSpeak(makePranaUtt(text)); }, delay);
}


/* ── Screen Wake Lock ────────────────────────────────────────── */
let wakeLock = null;

async function acquireWakeLock() {
  if (!('wakeLock' in navigator)) return; // not supported
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      wakeLock = null;
      // Re-acquire if session still active (OS released it on tab-hide)
    });
    setStatus('Screen will stay on during practice');
  } catch(e) {
    // Low battery or other OS refusal — silent fail, not critical
    console.warn('Wake lock denied:', e.message);
  }
}

async function releaseWakeLock() {
  if (wakeLock) {
    try { await wakeLock.release(); } catch(e) {}
    wakeLock = null;
  }
}

// Re-acquire when app comes back to foreground (OS auto-releases on hide)
// visibilitychange handled in unified handler below

/* ── DND Banner ──────────────────────────────────────────────── */
function showDndBanner() {
  const b = document.getElementById('dnd-banner');
  if (b) b.classList.add('show');
}
function hideDndBanner() {
  const b = document.getElementById('dnd-banner');
  if (b) b.classList.remove('show');
}
document.addEventListener('DOMContentLoaded', () => {
  const dismissBtn = document.getElementById('dnd-dismiss');
  if (dismissBtn) dismissBtn.addEventListener('click', () => hideDndBanner());
});

/* ── Pose countdown timer ────────────────────────────────────── */
function startPoseTimer() {
  clearPoseTimer();
  if(!cfg.autoOn) return;
  poseTimerStart = Date.now();   // always fresh — pace change fix
  poseElapsed    = 0;
  document.getElementById("tbar-wrap").style.display="block";
  const dur = cfg.poseSeconds * 1000;
  function tick() {
    if(!sess.active||sess.paused) return;
    poseElapsed = Date.now() - poseTimerStart;
    const frac  = Math.min(1, poseElapsed / dur);
    document.getElementById("tbar").style.width=(100-frac*100)+"%";
    if(frac>=1){ poseElapsed=0; advanceStep(); return; }
    poseRafHandle = requestAnimationFrame(tick);
  }
  poseRafHandle = requestAnimationFrame(tick);
}
function clearPoseTimer() {
  if(poseRafHandle){ cancelAnimationFrame(poseRafHandle); poseRafHandle=null; }
  poseElapsed=0;
  const tb=document.getElementById("tbar");
  if(tb) tb.style.width="100%";
}

/* ── Session stopwatch (goal timer) ─────────────────────────── */
function startClock() {
  stopClock();
  function tick() {
    if(!sess.active||sess.paused) return;
    updateClockDisplay();
    clockRaf = requestAnimationFrame(tick);
  }
  clockRaf = requestAnimationFrame(tick);
}
function stopClock() {
  if(clockRaf){ cancelAnimationFrame(clockRaf); clockRaf=null; }
}
function sessionElapsedMs() {
  if(!sess.sessionStart) return 0;
  const running = sess.active&&!sess.paused ? Date.now()-sess.sessionStart-sess.sessionPaused : 0;
  return running;
}
function updateClockDisplay() {
  const clk=document.getElementById("session-clock");
  const lbl=document.getElementById("main-label");
  if(!clk) return;
  if(sess.active && !sess.paused) {
    clk.textContent = fmtTime(sessionElapsedMs());
  } else if(sess.paused) {
    clk.textContent = fmtTime(sessionElapsedMs());
  } else {
    clk.textContent = "";
  }
}

/* ── Session logic ───────────────────────────────────────────── */
function handleMainBtn() {
  if(!sess.active) {
    // Fresh start
    sess.active=true; sess.paused=false; sess.step=0;
    sess.sessionStart=Date.now(); sess.sessionPaused=0; sess.pauseAt=0;
    poseElapsed=0;
    speakMantra(STEPS[0].mantraD, STEPS[0].breath);
    startPoseTimer(); startClock(); vib(20);
    acquireWakeLock();
    showDndBanner();
    document.getElementById("main-label").textContent="⏸ Pause";
    render(); return;
  }
  if(!sess.paused) {
    // Pause
    sess.paused=true; sess.pauseAt=Date.now();
    clearPoseTimer(); stopClock();
    releaseWakeLock();
    document.getElementById("main-label").textContent="▶ Resume";
  } else {
    // Resume
    sess.paused=false;
    sess.sessionPaused += Date.now()-sess.pauseAt;
    poseTimerStart = Date.now(); // reset pose timer on resume
    startPoseTimer(); startClock();
    acquireWakeLock();
    document.getElementById("main-label").textContent="⏸ Pause";
  }
}

function advanceStep() {
  clearPoseTimer();
  if(!sess.active) return;
  const next=sess.step+1;
  if(next>=12){ completeSet(); return; }
  sess.step=next;
  speakMantra(STEPS[next].mantraD, STEPS[next].breath);
  startPoseTimer(); render();
}

function completeSet() {
  vib([30,30,60]);
  const today=todayKey();
  if(!data.history[today]) data.history[today]={ sets:0, timeMs:0, goal:0 };
  data.history[today].sets += 1;
  const _g = todayGoal();
  data.history[today].goal = _g;
  data.lastGoal = _g;   // always track so tomorrow = lastGoal + 4
  data.totalAllTime += 1;
  sess.breakAcc += 1;
  saveAll();

  const done=todayDone(), goal=todayGoal();
  // Speak: Om (Sanskrit) then "Round N" in English
  setTimeout(()=>{
    qClear();
    qSpeak(makeMantraUtt("ॐ"));
    qSpeak(makeEnUtt("Round " + done));
  }, 300);

  // ── Recovery milestone: every 400 sets ──────────────────────
  const RECOVERY_EVERY = 400;
  const lastRecov = data.lastRecoveryAt || 0;
  if(data.totalAllTime > 0 &&
     data.totalAllTime % RECOVERY_EVERY === 0 &&
     data.totalAllTime !== lastRecov) {
    data.lastRecoveryAt = data.totalAllTime;
    saveAll();
    finishSession(false);
    setTimeout(()=>showRecovery(data.totalAllTime), 400);
    return;
  }

  // Break reminder (every N sets within session)
  if(sess.breakAcc>0 && sess.breakAcc%cfg.breakEvery===0) {
    finishSession(false);
    setTimeout(()=>showBreak(done), 400);
    return;
  }

  // Daily goal reached
  if(done>=goal) {
    finishSession(true);
    return;
  }

  // Grace period before next set
  sess.step=0;
  startGrace();
}

/* ── Grace countdown between rounds ─────────────────────────── */
let graceRaf    = null;
let graceStart  = 0;
let graceActive = false;

function startGrace() {
  clearGrace();
  graceActive = true;
  graceStart  = Date.now();
  const dur   = cfg.graceSeconds * 1000;

  // Announce rest time once
  setTimeout(()=>{
    qSpeak(makeEnUtt("Rest. Next round in " + cfg.graceSeconds + " seconds."));
  }, 500);

  const el = document.getElementById("grace-bar");
  const wt = document.getElementById("grace-wrap");
  const ct = document.getElementById("grace-count");
  if(wt) wt.style.display = "flex";

  function tick() {
    if(!graceActive) return;
    const elapsed = Date.now() - graceStart;
    const frac    = Math.min(1, elapsed / dur);
    const secsLeft = Math.ceil((dur - elapsed) / 1000);
    if(el) el.style.width = (frac * 100) + "%";
    if(ct) ct.textContent = secsLeft > 0 ? secsLeft : "";
    if(frac >= 1) {
      clearGrace();
      beginNextSet();
      return;
    }
    graceRaf = requestAnimationFrame(tick);
  }
  graceRaf = requestAnimationFrame(tick);
}

function clearGrace() {
  if(graceRaf){ cancelAnimationFrame(graceRaf); graceRaf = null; }
  graceActive = false;
  const wt = document.getElementById("grace-wrap");
  if(wt) wt.style.display = "none";
}

function beginNextSet() {
  if(!sess.active) return;
  poseElapsed = 0;
  speakMantra(STEPS[0].mantraD, STEPS[0].breath);
  startPoseTimer();
  render();
}

function finishSession(goalDone) {
  stopClock();
  clearPoseTimer();
  // Save today's session time
  const elapsed = sessionElapsedMs();
  const today=todayKey();
  if(!data.history[today]) data.history[today]={ sets:0, timeMs:0 };
  data.history[today].timeMs = (data.history[today].timeMs||0) + elapsed;
  data.totalTimeMs = (data.totalTimeMs||0) + elapsed;
  saveAll();

  clearGrace();
  sess.active=false; sess.step=-1;
  releaseWakeLock();
  hideDndBanner();
  document.getElementById("main-label").textContent="▶ Start";

  if(goalDone) {
    const todaySets  = todayDone();
    const totalSets  = data.totalAllTime;
    const msg = "Namaste! Today's target of " + todaySets + " rounds complete. "
              + "All time total: " + totalSets + " rounds. "
              + "Now let us begin Pranayama practice.";
    setTimeout(()=>speakText(msg), 800);
    if(cfg.pranayamaAuto) {
      setTimeout(()=>showPranayama(), 3500);
    }
  }
  render(); updateClockDisplay();
}

function resetSession() {
  vib(15);
  qClear(); clearGrace();
  // Save whatever time was accumulated before reset
  if(sess.active && sess.sessionStart) {
    const elapsed = sessionElapsedMs();
    const today=todayKey();
    if(!data.history[today]) data.history[today]={ sets:0, timeMs:0 };
    data.history[today].timeMs = (data.history[today].timeMs||0) + elapsed;
    data.totalTimeMs = (data.totalTimeMs||0) + elapsed;
    saveAll();
  }
  clearPoseTimer(); stopClock();
  releaseWakeLock();
  hideDndBanner();
  sess.active=false; sess.paused=false; sess.step=-1;
  sess.sessionStart=0; sess.sessionPaused=0;
  document.getElementById("main-label").textContent="▶ Start";
  document.getElementById("tbar-wrap").style.display="none";
  render(); updateClockDisplay();
}

/* ── Break overlay ───────────────────────────────────────────── */
function showBreak(n) {
  speakText("Take rest. "+n+" sets complete. Lie in Savasana.");
  document.getElementById("break-n").textContent=n;
  document.getElementById("break-ov").classList.add("show");
}

function showRecovery(total) {
  vib([60,40,60,40,120]);
  speakText(
    "Congratulations! You have completed " + total + " Surya Namaskaras. " +
    "This is a major milestone. Take a full recovery day tomorrow. " +
    "Rest, hydrate, and let your body absorb the practice. Om Shanti."
  );
  document.getElementById("rec-total").textContent = total;
  // compute next milestone
  const RECOVERY_EVERY = 400;
  document.getElementById("rec-next").textContent = total + RECOVERY_EVERY;
  document.getElementById("rec-ov").classList.add("show");
}
document.getElementById("break-ok").addEventListener("click",()=>{
  document.getElementById("break-ov").classList.remove("show");
  sess.sessionStart=0; sess.sessionPaused=0;
  render(); updateClockDisplay();
});

document.getElementById("rec-ok").addEventListener("click",()=>{
  document.getElementById("rec-ov").classList.remove("show");
  sess.active=false; sess.step=-1;
  document.getElementById("main-label").textContent="▶ Start";
  sess.sessionStart=0; sess.sessionPaused=0;
  render(); updateClockDisplay();
});

/* ── Render ──────────────────────────────────────────────────── */
function render() {
  const done=todayDone(), goal=todayGoal(), frac=Math.min(1,done/goal);

  // Stats row
  document.getElementById("s-today").textContent  = done;
  document.getElementById("s-goal").textContent   = goal;
  document.getElementById("s-streak").textContent = computeStreak();
  document.getElementById("s-total").textContent  = data.totalAllTime;

  // Program name + day
  document.getElementById("prog-name").textContent = "वैभव - सूर्यसारथी.१ॐ८";
  const d=new Date();
  document.getElementById("day-label").textContent =
    "Day "+data.programDay+" · "+d.toLocaleDateString(undefined,{weekday:"long",month:"short",day:"numeric"});

  // Time stats
  const todayTimeMs = (data.history[todayKey()]||{}).timeMs||0;
  document.getElementById("time-today").textContent = todayTimeMs>0 ? fmtTime(todayTimeMs) : "0s";
  document.getElementById("time-total").textContent = fmtTime(data.totalTimeMs||0);

  // Ring
  document.getElementById("ring").style.strokeDashoffset=String(CIRC*(1-frac));

  const idle=sess.step===-1||!sess.active;
  if(idle) {
    document.getElementById("r-mantra").textContent     = done>=goal&&goal>0?"🎉 Goal complete!":"☀️";
    document.getElementById("r-devanagari").textContent = done>=goal&&goal>0?"नमस्ते 🙏":"";
    document.getElementById("r-meaning").textContent    = "";
    document.getElementById("r-pose").textContent       = "Ready";
    document.getElementById("r-breath").textContent     = "Tap Start";
    document.getElementById("r-breath").className       = "pose-breath";
    document.getElementById("r-pnum").textContent       = "Goal "+done+" / "+goal;
    document.getElementById("tbar-wrap").style.display  = "none";
  } else {
    const s=STEPS[sess.step];
    document.getElementById("r-mantra").textContent     = s.mantra;
    document.getElementById("r-devanagari").textContent = s.mantraD;
    document.getElementById("r-meaning").textContent    = s.meaning;
    document.getElementById("r-pose").textContent       = s.pose;
    document.getElementById("r-breath").textContent     = s.breath;
    document.getElementById("r-breath").className       = "pose-breath "+s.breathClass;
    document.getElementById("r-pnum").textContent       =
      "Set "+(done+1)+" of "+goal+" · Pose "+(sess.step+1)+"/12";
  }

  // Pace display
  document.getElementById("spd-v").textContent = cfg.poseSeconds+"s / pose";

  // Voice button
  document.getElementById("voice-btn").classList.toggle("on",!voiceMuted);

  // Dots — show yesterday base (dim) + today's 4 new (bright target)
  // yesterBase = goal - dailyIncrease (the count we came from)
  const dotsEl=document.getElementById("dots");
  dotsEl.innerHTML="";
  const yesterBase = Math.max(0, goal - cfg.dailyIncrease);
  const MAX_DOTS = 60;  // max dots before overflow label
  const showUpTo = Math.min(goal, MAX_DOTS);

  for(let i=1; i<=showUpTo; i++){
    const dot=document.createElement("div");
    const isDone    = i <= done;
    const isActive  = i === done+1 && sess.active;
    const isNewToday= i > yesterBase;  // part of today's +4 increase

    let cls = "dot";
    if(isDone && isNewToday)  cls += " done new-today";   // completed today's new ones
    else if(isDone)           cls += " done";              // completed (was yesterday's base)
    else if(isActive)         cls += " active";
    else if(isNewToday)       cls += " target";            // today's new target (not yet done)

    dot.className = cls;
    dot.textContent = i;
    dotsEl.appendChild(dot);
  }
  if(goal > MAX_DOTS){
    const more=document.createElement("div");
    more.style.cssText="font-size:10px;color:var(--muted);align-self:center;padding:4px";
    more.textContent="+"+(goal-MAX_DOTS)+" more";
    dotsEl.appendChild(more);
  }

  syncChartUI();
  renderBars();
}

/* ── History chart — bar / line / dot ────────────────────────── */
function renderBars() {
  requestAnimationFrame(_drawChart);
}

function _drawChart() {
  const wrap = document.getElementById("chart-wrap");
  if(!wrap) return;
  wrap.innerHTML = "";

  const N    = cfg.chartDays || 7;
  const mode = cfg.chartMode || "bar";
  const tk   = todayKey();

  // Build data oldest → newest
  const pts = [];
  for(let i = N-1; i >= 0; i--) {
    const d   = dayKey(i);
    const rec = data.history[d] || {};
    const sets = typeof rec === "number" ? rec : (rec.sets || 0);
    const goal = d === tk
      ? todayGoal()
      : (typeof rec === "number" ? 0 : (rec.goal || 0));
    pts.push({ d, sets, goal, isToday: d === tk });
  }

  const maxVal = Math.max(1, ...pts.map(p => Math.max(p.sets, p.goal)));
  const PW   = wrap.offsetWidth || 320;
  const GAP  = N > 14 ? 2 : 3;
  const colW = Math.max(10, Math.floor((PW - GAP * (N - 1)) / N));
  const CH   = 80;   // bar height px
  const LH   = 32;   // label area above bar (number + goal)
  const DH   = 20;   // date label below bar
  const TOT  = LH + CH + DH;

  // Colors — simple, same as before
  const barCol  = p => p.isToday ? "#1DB87F" : (p.sets > 0 ? "#5DE0A8" : "#1E2E22");
  const lblCol  = p => p.isToday ? "#5DE0A8" : (p.sets > 0 ? "#9DB8A8" : "#3A5040");
  const dateCol = p => p.isToday ? "#5DE0A8" : "#5A7065";

  /* ── BAR ──────────────────────────────────────────────────── */
  if(mode === "bar") {
    const flex = document.createElement("div");
    flex.style.cssText =
      "display:flex;gap:"+GAP+"px;width:100%;height:"+TOT+"px;align-items:flex-end";

    pts.forEach((p, idx) => {
      const col = document.createElement("div");
      col.style.cssText =
        "flex:0 0 "+colW+"px;display:flex;flex-direction:column;" +
        "align-items:center;height:"+TOT+"px";

      /* label area ------------------------------------------ */
      const la = document.createElement("div");
      la.style.cssText =
        "height:"+LH+"px;width:100%;display:flex;flex-direction:column;" +
        "align-items:center;justify-content:flex-end;gap:1px;padding-bottom:3px";

      if(p.sets > 0 || (p.isToday && p.goal > 0)) {
        // top line: completed count
        const t1 = document.createElement("div");
        t1.style.cssText =
          "font-size:"+(N>14?"8":"9")+"px;font-weight:800;color:"+lblCol(p)+
          ";line-height:1;text-align:center;white-space:nowrap";
        t1.textContent = p.sets > 0 ? String(p.sets) : "0";
        la.appendChild(t1);

        // bottom line: /goal
        if(p.goal > 0) {
          const t2 = document.createElement("div");
          t2.style.cssText =
            "font-size:7px;color:#3A5040;line-height:1;text-align:center";
          t2.textContent = "/"+p.goal;
          la.appendChild(t2);
        }
      }
      col.appendChild(la);

      /* bar ------------------------------------------------- */
      const barH = p.sets > 0
        ? Math.max(6, Math.round((p.sets / maxVal) * CH))
        : 3;
      const bar = document.createElement("div");
      bar.style.cssText =
        "width:100%;height:"+barH+"px;flex-shrink:0;" +
        "border-radius:3px 3px 2px 2px;background:"+barCol(p)+";margin-top:auto";
      col.appendChild(bar);

      /* date label ------------------------------------------ */
      const dt  = new Date(p.d + "T00:00:00");
      const dl  = document.createElement("div");
      const skip = N > 14 ? 3 : (N > 7 ? 2 : 1);
      dl.style.cssText =
        "font-size:"+(N>14?"7":"8")+"px;text-align:center;margin-top:4px;" +
        "height:"+(DH-4)+"px;line-height:"+(DH-4)+"px;color:"+dateCol(p);
      if(idx % skip === 0 || p.isToday)
        dl.textContent = dt.toLocaleDateString(undefined,{month:"numeric",day:"numeric"});
      col.appendChild(dl);

      flex.appendChild(col);
    });
    wrap.appendChild(flex);
    return;
  }

  /* ── LINE (SVG) ───────────────────────────────────────────── */
  const SW  = Math.max(PW, colW * N + GAP * (N - 1));
  const SH  = LH + CH + DH;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width",  SW);
  svg.setAttribute("height", SH);
  svg.style.cssText = "display:block;overflow:visible";

  const xOf = i => Math.round(i * (colW + GAP) + colW / 2);
  const yOf = v => Math.round(LH + CH - (v / maxVal) * (CH - 10) + 2);

  // grid
  [0.5, 1].forEach(f => {
    const gy = yOf(maxVal * f);
    const gl = document.createElementNS("http://www.w3.org/2000/svg", "line");
    gl.setAttribute("x1", 0); gl.setAttribute("x2", SW);
    gl.setAttribute("y1", gy); gl.setAttribute("y2", gy);
    gl.setAttribute("stroke", "#1E3028"); gl.setAttribute("stroke-width", "1");
    svg.appendChild(gl);
    const gv = document.createElementNS("http://www.w3.org/2000/svg", "text");
    gv.setAttribute("x", 2); gv.setAttribute("y", gy - 3);
    gv.setAttribute("fill", "#3A5040"); gv.setAttribute("font-size", "7");
    gv.textContent = Math.round(maxVal * f);
    svg.appendChild(gv);
  });

  // line path — only through days with data
  const lpts = pts
    .map((p, i) => p.sets > 0 ? `${xOf(i)},${yOf(p.sets)}` : null)
    .filter(Boolean);
  if(lpts.length > 1) {
    const pl = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    pl.setAttribute("points", lpts.join(" "));
    pl.setAttribute("fill", "none");
    pl.setAttribute("stroke", "#1DB87F");
    pl.setAttribute("stroke-width", "2");
    pl.setAttribute("stroke-linejoin", "round");
    pl.setAttribute("stroke-linecap", "round");
    svg.appendChild(pl);
  }

  // dots + labels
  pts.forEach((p, i) => {
    const cx = xOf(i);
    const cy = p.sets > 0 ? yOf(p.sets) : yOf(0) + 2;

    // dot
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", cx); c.setAttribute("cy", cy);
    c.setAttribute("r",  p.isToday ? "5" : "3.5");
    c.setAttribute("fill", p.isToday ? "#1DB87F" : (p.sets > 0 ? "#5DE0A8" : "#243328"));
    svg.appendChild(c);

    // value label above dot
    if(p.sets > 0) {
      const vt = document.createElementNS("http://www.w3.org/2000/svg", "text");
      vt.setAttribute("x", cx); vt.setAttribute("y", cy - 8);
      vt.setAttribute("text-anchor", "middle");
      vt.setAttribute("fill", p.isToday ? "#5DE0A8" : "#9DB8A8");
      vt.setAttribute("font-size", "8");
      vt.setAttribute("font-weight", "700");
      vt.textContent = p.sets + (p.goal > 0 ? "/"+p.goal : "");
      svg.appendChild(vt);
    }

    // date label
    const skip = N > 14 ? 3 : (N > 7 ? 2 : 1);
    if(i % skip === 0 || p.isToday) {
      const dt = new Date(p.d + "T00:00:00");
      const dl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      dl.setAttribute("x", cx); dl.setAttribute("y", LH + CH + DH - 2);
      dl.setAttribute("text-anchor", "middle");
      dl.setAttribute("fill", p.isToday ? "#5DE0A8" : "#5A7065");
      dl.setAttribute("font-size", "8");
      dl.textContent = dt.toLocaleDateString(undefined,{month:"numeric",day:"numeric"});
      svg.appendChild(dl);
    }
  });

  const sc = document.createElement("div");
  sc.style.cssText = "overflow-x:auto;width:100%";
  sc.appendChild(svg);
  wrap.appendChild(sc);
}



/* ═══════════════════════════════════════════════════════════════
   PRANAYAMA MODULE
   Sequence: Deep Breathing → Anulom Vilom → Nadi Shodhana
             → Kapalabhati → Bhramari → Meditation
   Total time is distributed proportionally to cfg.pranayamaMinutes
═══════════════════════════════════════════════════════════════ */

// Each step has text in 3 languages — selected by cfg.pranaLang
// dur = seconds before moving to next step (increased for comfortable following)
// Ratios add to 100 — distributed across cfg.pranayamaMinutes (default 28 min)
const PRANAYAMA_BASE = [
  {
    id:"deep", name:"Deep Breathing", nameHi:"दीर्घ श्वसन", nameMr:"दीर्घ श्वसन",
    ratio:10,
    desc:"Slow deep belly breaths to prepare the body",
    descHi:"शरीर को तैयार करने के लिए धीमी और गहरी साँसें",
    descMr:"शरीर तयार करण्यासाठी मंद आणि खोल श्वास",
    steps:[
      { en:"Sit comfortably with spine erect. Close your eyes.",
        hi:"सीधे बैठें, रीढ़ सीधी रखें। आँखें बंद करें।",
        mr:"सरळ बसा, मणका ताठ ठेवा। डोळे बंद करा.", dur:12 },
      { en:"Breathe in slowly through both nostrils for 4 counts. One... two... three... four.",
        hi:"दोनों नासिकाओं से धीरे-धीरे 4 गिनती तक श्वास लें। एक... दो... तीन... चार।",
        mr:"दोन्ही नाकपुड्यांतून हळू हळू 4 मोजेपर्यंत श्वास घ्या.", dur:10 },
      { en:"Hold the breath gently for 2 counts.",
        hi:"2 गिनती तक श्वास को आराम से रोकें।",
        mr:"2 मोजेपर्यंत श्वास हळूच थांबवा.", dur:6 },
      { en:"Exhale slowly for 6 counts. Feel the belly fall. One... two... three... four... five... six.",
        hi:"6 गिनती तक धीरे-धीरे श्वास छोड़ें। पेट को नीचे जाते महसूस करें।",
        mr:"6 मोजेपर्यंत हळू हळू श्वास सोडा. पोट खाली जाताना जाणवा.", dur:12 },
      { en:"Continue this deep rhythmic breathing. Inhale for 4, hold 2, exhale for 6.",
        hi:"इसी लय में श्वास लेते रहें। 4 गिनती लें, 2 रोकें, 6 में छोड़ें।",
        mr:"याच लयीत श्वास घेत राहा. 4 आत, 2 थांबा, 6 बाहेर.", dur:0 },
    ],
    rounds:-1,
  },
  {
    id:"anulom", name:"Anulom Vilom", nameHi:"अनुलोम विलोम", nameMr:"अनुलोम विलोम",
    ratio:28,
    desc:"Alternate nostril breathing — balances energy channels",
    descHi:"अनुलोम विलोम — ऊर्जा नाड़ियों को संतुलित करता है",
    descMr:"अनुलोम विलोम — ऊर्जा नाड्या संतुलित करते",
    steps:[
      { en:"Bring your right hand to Nasagra mudra. Use thumb to close right nostril.",
        hi:"दाहिना हाथ नासाग्र मुद्रा में लाएं। अंगूठे से दाहिनी नासिका बंद करें।",
        mr:"उजवा हात नासाग्र मुद्रेत आणा. अंगठ्याने उजवी नाकपुडी बंद करा.", dur:10 },
      { en:"Inhale slowly through LEFT nostril for 4 counts. One... two... three... four.",
        hi:"बाईं नासिका से 4 गिनती तक धीरे-धीरे श्वास लें।",
        mr:"डाव्या नाकपुडीतून 4 मोजेपर्यंत हळू श्वास घ्या.", dur:8 },
      { en:"Close both nostrils. Hold for 2 counts.",
        hi:"दोनों नासिकाएं बंद करें। 2 गिनती रोकें।",
        mr:"दोन्ही नाकपुड्या बंद करा. 2 मोजे थांबा.", dur:6 },
      { en:"Release right nostril. Exhale slowly through RIGHT for 8 counts.",
        hi:"दाहिनी नासिका खोलें। 8 गिनती में दाहिनी से धीरे श्वास छोड़ें।",
        mr:"उजवी नाकपुडी उघडा. 8 मोजेपर्यंत उजव्या नाकपुडीतून हळू श्वास सोडा.", dur:12 },
      { en:"Now inhale through RIGHT nostril for 4 counts.",
        hi:"अब दाहिनी नासिका से 4 गिनती में श्वास लें।",
        mr:"आता उजव्या नाकपुडीतून 4 मोजेपर्यंत श्वास घ्या.", dur:8 },
      { en:"Close both nostrils. Hold for 2 counts.",
        hi:"दोनों नासिकाएं बंद करें। 2 गिनती रोकें।",
        mr:"दोन्ही बंद करा. 2 मोजे थांबा.", dur:6 },
      { en:"Release left nostril. Exhale slowly through LEFT for 8 counts. One round complete.",
        hi:"बाईं नासिका खोलें। 8 गिनती में बाईं से श्वास छोड़ें। एक चक्र पूरा।",
        mr:"डावी नाकपुडी उघडा. 8 मोजेपर्यंत डाव्या नाकपुडीतून श्वास सोडा. एक फेरी पूर्ण.", dur:12 },
      { en:"Continue. Inhale left, hold, exhale right. Inhale right, hold, exhale left.",
        hi:"जारी रखें। बाईं से लें, रोकें, दाईं से छोड़ें। दाईं से लें, रोकें, बाईं से छोड़ें।",
        mr:"सुरू ठेवा. डावीकडून घ्या, थांबा, उजवीकडून सोडा.", dur:0 },
    ],
    rounds:-1,
  },
  {
    id:"nadi", name:"Nadi Shodhana", nameHi:"नाडी शोधन", nameMr:"नाडी शोधन",
    ratio:18,
    desc:"Purification of energy channels — deeper 1:4:2 ratio",
    descHi:"नाड़ी शोधन — गहरे अनुपात 1:4:2 में",
    descMr:"नाडी शोधन — खोल प्रमाण 1:4:2",
    steps:[
      { en:"Nadi Shodhana with extended ratio. Inhale through LEFT nostril for 4 counts.",
        hi:"नाडी शोधन — विस्तारित अनुपात। बाईं नासिका से 4 गिनती में श्वास लें।",
        mr:"नाडी शोधन — विस्तारित प्रमाण. डाव्या नाकपुडीतून 4 मोजेपर्यंत श्वास घ्या.", dur:8 },
      { en:"Retain breath. Both nostrils closed. Hold for 16 counts. This is internal retention.",
        hi:"श्वास रोकें। दोनों नासिकाएं बंद। 16 गिनती तक रोकें। यह आंतरिक कुंभक है।",
        mr:"श्वास थांबवा. दोन्ही नाकपुड्या बंद. 16 मोजेपर्यंत थांबा.", dur:20 },
      { en:"Exhale through RIGHT nostril for 8 counts. Slow and complete.",
        hi:"दाहिनी नासिका से 8 गिनती में पूरी तरह श्वास छोड़ें।",
        mr:"उजव्या नाकपुडीतून 8 मोजेपर्यंत पूर्णपणे श्वास सोडा.", dur:12 },
      { en:"Inhale through RIGHT for 4 counts.",
        hi:"दाहिनी से 4 गिनती में श्वास लें।",
        mr:"उजव्याकडून 4 मोजेपर्यंत श्वास घ्या.", dur:8 },
      { en:"Retain. Hold for 16 counts.",
        hi:"रोकें। 16 गिनती तक रोकें।",
        mr:"थांबा. 16 मोजेपर्यंत थांबा.", dur:20 },
      { en:"Exhale through LEFT for 8 counts. One round complete. Continue gently.",
        hi:"बाईं से 8 गिनती में छोड़ें। एक चक्र पूरा। धीरे जारी रखें।",
        mr:"डाव्याकडून 8 मोजेपर्यंत सोडा. एक फेरी पूर्ण. हळू सुरू ठेवा.", dur:12 },
      { en:"Continue the cycle. Breathe with awareness. 4 counts in, 16 hold, 8 out.",
        hi:"चक्र जारी रखें। सजगता से श्वास लें। 4 अंदर, 16 रोकें, 8 बाहर।",
        mr:"फेरी सुरू ठेवा. 4 आत, 16 थांबा, 8 बाहेर.", dur:0 },
    ],
    rounds:-1,
  },
  {
    id:"kapalabhati", name:"Kapalabhati", nameHi:"कपालभाती", nameMr:"कपालभाती",
    ratio:14,
    desc:"Skull-shining breath — forceful exhales, passive inhales",
    descHi:"कपालभाती — तेज श्वास, पेट अंदर खींचना",
    descMr:"कपालभाती — जोरदार श्वास, पोट आत ओढणे",
    steps:[
      { en:"Sit tall. Take one slow deep breath to prepare yourself.",
        hi:"सीधे बैठें। तैयारी के लिए एक धीमी और गहरी साँस लें।",
        mr:"सरळ बसा. तयारीसाठी एक मंद खोल श्वास घ्या.", dur:10 },
      { en:"Now begin. Forceful sharp exhale through nose. Pull the navel in strongly.",
        hi:"शुरू करें। नाक से तेज झटकेदार श्वास छोड़ें। नाभि को जोर से अंदर खींचें।",
        mr:"सुरुवात करा. नाकातून जोरात झटकेदार श्वास सोडा. नाभी जोरात आत ओढा.", dur:8 },
      { en:"Passive inhale follows naturally. Do not force the inhale.",
        hi:"अपने आप साँस अंदर आएगी। श्वास को जबरदस्ती मत लें।",
        mr:"श्वास आपोआप आत येईल. जबरदस्ती करू नका.", dur:8 },
      { en:"Continue the rhythm. One exhale per second. Thirty strokes per round.",
        hi:"लय बनाए रखें। हर सेकंड में एक श्वास छोड़ें। तीस स्ट्रोक प्रति राउंड।",
        mr:"लय ठेवा. प्रति सेकंद एक श्वास. तीस स्ट्रोक प्रति फेरी.", dur:0 },
      { en:"After thirty strokes, take a deep inhale and hold briefly. Then exhale completely.",
        hi:"तीस स्ट्रोक के बाद, गहरी साँस लें और थोड़ी देर रोकें। फिर पूरी तरह छोड़ें।",
        mr:"तीस स्ट्रोक नंतर, खोल श्वास घ्या आणि थोडावेळ थांबा. मग पूर्णपणे सोडा.", dur:14 },
      { en:"Rest for a moment. Breathe normally. Begin the next round when ready.",
        hi:"थोड़ा आराम करें। सामान्य साँस लें। तैयार हो जाएं तो अगला राउंड शुरू करें।",
        mr:"थोडा आराम करा. सामान्य श्वास घ्या. तयार असल्यास पुढची फेरी सुरू करा.", dur:10 },
    ],
    rounds:3, strokesPerRound:30,
  },
  {
    id:"bhramari", name:"Bhramari", nameHi:"भ्रामरी", nameMr:"भ्रामरी",
    ratio:16,
    desc:"Humming bee breath — calms the nervous system",
    descHi:"भ्रामरी — मधुमक्खी की गुनगुनाहट, नसों को शांत करती है",
    descMr:"भ्रामरी — मधमाशीचा गुणगुणाट, मज्जासंस्था शांत करते",
    steps:[
      { en:"Close both ears gently with thumbs. Place index fingers lightly on closed eyes.",
        hi:"अंगूठों से दोनों कान धीरे से बंद करें। तर्जनी उंगलियों को बंद आँखों पर हल्के से रखें।",
        mr:"अंगठ्यांनी दोन्ही कान हळुवारपणे बंद करा. तर्जनी बोटे बंद डोळ्यांवर हळूच ठेवा.", dur:12 },
      { en:"Take a slow deep inhale through both nostrils. Fill the lungs completely.",
        hi:"दोनों नासिकाओं से धीरे-धीरे गहरी साँस लें। फेफड़ों को पूरी तरह भरें।",
        mr:"दोन्ही नाकपुड्यांतून हळू खोल श्वास घ्या. फुफ्फुसे पूर्णपणे भरा.", dur:10 },
      { en:"On the exhale, make a soft continuous humming sound. Mmmmmm. Feel the vibration.",
        hi:"साँस छोड़ते हुए, धीमी लगातार गुनगुनाहट करें। म्म्म्म्म। कंपन महसूस करें।",
        mr:"श्वास सोडताना मंद सतत गुणगुणाट करा. म्म्म्म. कंपन जाणवा.", dur:14 },
      { en:"Feel the vibration in your skull, face, and chest. Let it spread through your body.",
        hi:"कपाल, चेहरे और छाती में कंपन महसूस करें। इसे पूरे शरीर में फैलने दें।",
        mr:"कपाळ, चेहरा आणि छातीमध्ये कंपन जाणवा. ते संपूर्ण शरीरात पसरू द्या.", dur:10 },
      { en:"Inhale again and continue humming on exhale. Five repetitions total.",
        hi:"फिर से साँस लें और छोड़ते हुए गुनगुनाहट जारी रखें। कुल पाँच बार।",
        mr:"पुन्हा श्वास घ्या आणि सोडताना गुणगुणाट करा. एकूण पाच वेळा.", dur:0 },
    ],
    rounds:5,
  },
  {
    id:"meditation", name:"Quiet Meditation", nameHi:"ध्यान", nameMr:"ध्यान",
    ratio:14,
    desc:"Silent awareness — let breath flow naturally",
    descHi:"मौन ध्यान — श्वास को स्वाभाविक रूप से बहने दें",
    descMr:"शांत ध्यान — श्वास नैसर्गिकरित्या वाहू द्या",
    steps:[
      { en:"Release all techniques. Rest your hands on your knees, palms facing up.",
        hi:"सभी तकनीकें छोड़ दें। हाथों को घुटनों पर रखें, हथेलियाँ ऊपर।",
        mr:"सर्व तंत्रे सोडा. हात गुडघ्यांवर ठेवा, तळवे वर.", dur:12 },
      { en:"Simply observe the natural breath. Do not control it. Just watch.",
        hi:"केवल प्राकृतिक श्वास को देखें। उसे नियंत्रित मत करें। बस देखते रहें।",
        mr:"फक्त नैसर्गिक श्वास निरीक्षण करा. नियंत्रण करू नका. फक्त पाहा.", dur:14 },
      { en:"If thoughts arise, gently bring your attention back to the breath. No force.",
        hi:"विचार आएं तो धीरे से ध्यान को श्वास पर वापस लाएं। जबरदस्ती नहीं।",
        mr:"विचार आले तर हळूच लक्ष श्वासावर परत आणा. जबरदस्ती नाही.", dur:14 },
      { en:"Rest in pure awareness. You are the witness. Breathe and simply be.",
        hi:"शुद्ध जागरूकता में विश्राम करें। आप साक्षी हैं। श्वास लें और बस रहें।",
        mr:"शुद्ध जागरूकतेत विश्रांती घ्या. तुम्ही साक्षी आहात. श्वास घ्या आणि फक्त राहा.", dur:0 },
    ],
    rounds:-1,
  },
];

// Runtime state
let pranaState = {
  active      : false,
  paused      : false,
  phaseIdx    : 0,    // which pranayama (0–5)
  stepIdx     : 0,    // which step within phase
  phaseStart  : 0,    // Date.now() when phase started
  totalStart  : 0,    // Date.now() when session started
  stepTimer   : null,
  clockTimer  : null,
  phaseDurs   : [],   // computed ms for each phase
};

function computePhaseDurations(totalMin) {
  const totalMs = totalMin * 60 * 1000;
  const total   = PRANAYAMA_BASE.reduce((s,p)=>s+p.ratio, 0);
  return PRANAYAMA_BASE.map(p => Math.round((p.ratio / total) * totalMs));
}

function showPranayama() {
  pranaState.phaseDurs  = computePhaseDurations(cfg.pranayamaMinutes || 28);
  pranaState.phaseIdx   = 0;
  pranaState.stepIdx    = 0;
  pranaState.active     = true;
  pranaState.paused     = false;
  pranaState.totalStart = Date.now();
  // Show full-screen overlay
  const ov = document.getElementById("prana-ov");
  ov.classList.add("show");
  // Scroll to top of overlay
  ov.scrollTop = 0;
  acquireWakeLock();
  startPranaPhase();
}

function startPranaPhase() {
  const phase = PRANAYAMA_BASE[pranaState.phaseIdx];
  pranaState.phaseStart = Date.now();
  pranaState.stepIdx    = 0;

  // Update header
  const totalMin = cfg.pranayamaMinutes || 28;
  document.getElementById("prana-title").textContent  = phase.name;
  document.getElementById("prana-title-hi").textContent = phase.nameHi;
  document.getElementById("prana-desc").textContent   = phase.desc;
  document.getElementById("prana-phase-num").textContent =
    "Practice " + (pranaState.phaseIdx+1) + " of " + PRANAYAMA_BASE.length;

  // Phase progress bar reset
  document.getElementById("prana-phase-bar").style.width = "0%";

  const phaseName = (cfg.pranaLang==="hi" ? phase.nameHi :
                     cfg.pranaLang==="mr" ? (phase.nameMr||phase.nameHi) :
                     phase.name) || phase.name;
  const phaseDesc = (cfg.pranaLang==="hi" ? phase.descHi :
                     cfg.pranaLang==="mr" ? (phase.descMr||phase.descHi) :
                     phase.desc) || phase.desc;
  speakPrana(phaseName + ". " + phaseDesc, 200);
  setTimeout(()=>startPranaStep(), 2000);
  startPranaClocks();
}

// Speak numbers for inhale/hold/exhale counts
function speakPranaCounts(n, word, lang) {
  const nums = {
    en: ["One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
         "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen"],
    hi: ["एक","दो","तीन","चार","पाँच","छह","सात","आठ","नौ","दस",
         "ग्यारह","बारह","तेरह","चौदह","पंद्रह","सोलह"],
    mr: ["एक","दोन","तीन","चार","पाच","सहा","सात","आठ","नऊ","दहा",
         "अकरा","बारा","तेरा","चौदा","पंधरा","सोळा"],
  };
  const numWords = nums[lang] || nums.en;
  // Queue each count number as a separate short utterance
  for(let i = 1; i <= n; i++) {
    const u = makePranaUtt(numWords[i-1] || String(i));
    u.rate  = 0.55;   // slow and deliberate for counting
    u.pitch = 1.1;
    qSpeak(u);
  }
}

// Extract count from step text (looks for "4 counts", "8 counts" etc.)
function extractCount(text) {
  const m = text.match(/(\d+)\s*count/i);
  return m ? parseInt(m[1]) : 0;
}

function startPranaStep() {
  if(!pranaState.active || pranaState.paused) return;
  clearPranaTimers();

  const phase    = PRANAYAMA_BASE[pranaState.phaseIdx];
  const steps    = phase.steps;
  const stepIdx  = pranaState.stepIdx;
  const step     = steps[stepIdx];
  const phaseDur = pranaState.phaseDurs[pranaState.phaseIdx];
  const lang     = cfg.pranaLang || "en";

  // Update UI
  document.getElementById("prana-step").textContent  = getPranaText(step);
  document.getElementById("prana-step-num").textContent =
    "Step " + (stepIdx+1) + " / " + steps.length;

  // 1. Speak instruction sentence first
  speakPrana(getPranaText(step));

  // 2. After instruction, speak number counts if this is a counting step
  const instrText = step.en || "";  // use English to extract count (reliable)
  const count = extractCount(instrText);
  if(count > 0 && step.dur > 0) {
    // Delay count by ~2.5 sec (after instruction finishes)
    setTimeout(()=>{
      if(!pranaState.active || pranaState.paused) return;
      speakPranaCounts(count, "", lang);
    }, 2500);
  }

  // If step.dur === 0 → looping step — run until phase time expires
  if(step.dur === 0) {
    // Keep cycling steps from beginning (loop)
    pranaState.stepTimer = setInterval(()=>{
      if(!pranaState.active || pranaState.paused) return;
      // Check if phase time is up
      const elapsed = Date.now() - pranaState.phaseStart;
      if(elapsed >= phaseDur) { nextPranaPhase(); return; }
      // Loop from step 0
      pranaState.stepIdx = 0;
      startPranaStep();
    }, 10000); // re-announce every 10s during loop
    return;
  }

  // Timed step
  pranaState.stepTimer = setTimeout(()=>{
    const elapsed = Date.now() - pranaState.phaseStart;
    if(elapsed >= phaseDur) { nextPranaPhase(); return; }
    // Advance to next step (or loop)
    pranaState.stepIdx = (stepIdx + 1) % steps.length;
    startPranaStep();
  }, step.dur * 1000);
}

function startPranaClocks() {
  clearInterval(pranaState.clockTimer);
  pranaState.clockTimer = setInterval(()=>{
    if(!pranaState.active || pranaState.paused) return;
    const phaseMs   = pranaState.phaseDurs[pranaState.phaseIdx] || 1;
    const phaseEl   = Date.now() - pranaState.phaseStart;
    const phaseFrac = Math.min(1, phaseEl / phaseMs);
    const totalMs   = (cfg.pranayamaMinutes||28) * 60000;
    const totalEl   = Date.now() - pranaState.totalStart;
    const totalFrac = Math.min(1, totalEl / totalMs);
    const remSec    = Math.max(0, Math.round((totalMs - totalEl) / 1000));

    document.getElementById("prana-phase-bar").style.width = (phaseFrac*100)+"%";
    document.getElementById("prana-total-bar").style.width = (totalFrac*100)+"%";
    document.getElementById("prana-time-rem").textContent  =
      "Total remaining: " + fmtTime(remSec * 1000);
  }, 500);
}

function nextPranaPhase() {
  clearPranaTimers();
  pranaState.phaseIdx++;
  if(pranaState.phaseIdx >= PRANAYAMA_BASE.length) {
    endPranayama(); return;
  }
  speakPrana("Excellent. Now we begin " + PRANAYAMA_BASE[pranaState.phaseIdx].name + ".", 300);
  setTimeout(()=>startPranaPhase(), 2500);
}

function endPranayama() {
  clearPranaTimers();
  pranaState.active = false;
  releaseWakeLock();
  speakPrana(
    "Pranayama complete. Sit quietly for a moment. Namaste. Om Shanti.",
    400
  );
  document.getElementById("prana-step").textContent    = "🙏 Practice complete. Namaste.";
  document.getElementById("prana-title").textContent   = "ध्यान";
  document.getElementById("prana-phase-bar").style.width = "100%";
  document.getElementById("prana-total-bar").style.width = "100%";
  document.getElementById("prana-time-rem").textContent  = "Complete!";
  document.getElementById("prana-close-btn").textContent = "✕ Close";
}

function clearPranaTimers() {
  if(pranaState.stepTimer) {
    clearTimeout(pranaState.stepTimer);
    clearInterval(pranaState.stepTimer);
    pranaState.stepTimer = null;
  }
  clearInterval(pranaState.clockTimer);
}

function pauseResumePrana() {
  if(!pranaState.active) return;
  pranaState.paused = !pranaState.paused;
  const btn = document.getElementById("prana-pause-btn");
  if(pranaState.paused) {
    clearPranaTimers();
    btn.textContent = "▶ Resume";
    speakText("Paused.");
  } else {
    btn.textContent = "⏸ Pause";
    pranaState.phaseStart = Date.now() -
      (pranaState.phaseDurs[pranaState.phaseIdx] * 0.05); // small overlap on resume
    startPranaStep();
    startPranaClocks();
  }
}

function skipPranaPhase() {
  if(!pranaState.active) return;
  clearPranaTimers();
  nextPranaPhase();
}

function closePranayama() {
  clearPranaTimers();
  pranaState.active = false;
  pranaState.paused = false;
  releaseWakeLock();
  qClear();
  document.getElementById("prana-ov").classList.remove("show");
}

/* ── Pranayama overlay buttons ──────────────────────────────── */
document.getElementById("prana-close-btn").addEventListener("click", closePranayama);
document.getElementById("prana-pause-btn").addEventListener("click", pauseResumePrana);
document.getElementById("prana-skip-btn").addEventListener("click",  skipPranaPhase);

// Manual start — only allowed after today's goal is complete
document.getElementById("prana-start-btn").addEventListener("click", () => {
  const done = todayDone();
  const goal = todayGoal();
  if(done < goal) {
    const btn = document.getElementById("prana-start-btn");
    const orig = btn.innerHTML;
    btn.innerHTML = "🚫 Complete " + (goal - done) + " more sets first!";
    btn.style.cssText = "background:linear-gradient(135deg,#3A1000,#1A1A0A);border-color:var(--danger);color:var(--danger)";
    setTimeout(() => { btn.innerHTML = orig; btn.style.cssText = ""; }, 2800);
    vib(100);
    speakText("Complete today's target of " + goal + " rounds first.");
    return;
  }
  showPranayama();
});

/* ── Controls ────────────────────────────────────────────────── */
document.getElementById("main-btn").addEventListener("click", handleMainBtn);
document.getElementById("reset-btn").addEventListener("click", resetSession);

document.getElementById("voice-btn").addEventListener("click",()=>{
  voiceMuted=!voiceMuted; cfg.voiceOn=!voiceMuted;
  saveAll(); render();
  if(!voiceMuted) { qClear(); speakMantra("ॐ"); } else { qClear(); }
});

// CHART TABS — 7d / 14d / 21d day-window switchers
document.querySelectorAll(".chart-tab[data-days]").forEach(btn => {
  btn.addEventListener("click", () => {
    cfg.chartDays = parseInt(btn.dataset.days) || 7;
    syncChartUI();
    saveAll();
    renderBars();
  });
});

function syncChartUI() {
  const days = cfg.chartDays || 7;
  document.querySelectorAll(".chart-tab[data-days]").forEach(b => {
    b.classList.toggle("active", parseInt(b.dataset.days) === days);
  });
  const t = document.getElementById("chart-title");
  if(t) t.textContent = "Last "+days+" days progress";
}

// PACE BUTTONS — fix: always use integer, save immediately
document.getElementById("spd-up").addEventListener("click",()=>{
  cfg.poseSeconds = Math.min(30, (cfg.poseSeconds||5)+1);
  saveAll(); render();
  // If currently running, restart pose timer with new duration
  if(sess.active&&!sess.paused){ poseTimerStart=Date.now(); }
});
document.getElementById("spd-dn").addEventListener("click",()=>{
  cfg.poseSeconds = Math.max(2, (cfg.poseSeconds||5)-1);
  saveAll(); render();
  if(sess.active&&!sess.paused){ poseTimerStart=Date.now(); }
});

// Manual advance (auto off)
document.querySelector(".ring-wrap").addEventListener("click",()=>{
  if(sess.active&&!sess.paused&&!cfg.autoOn) advanceStep();
});

/* ── Settings ────────────────────────────────────────────────── */
function openSettings() {
  document.getElementById("cfg-inc").value      = cfg.dailyIncrease;
  document.getElementById("cfg-goal").value     = todayGoal();
  document.getElementById("cfg-max").value      = cfg.maxSets;
  document.getElementById("cfg-brk").value      = cfg.breakEvery;
  document.getElementById("cfg-pace").value     = cfg.poseSeconds;
  document.getElementById("cfg-grace").value    = cfg.graceSeconds;
  document.getElementById("cfg-lifetime").value = data.totalAllTime;
  togSet("tog-voice",   cfg.voiceOn);
  togSet("tog-mantras", cfg.mantrasOn !== false);
  togSet("tog-breath",  cfg.breathOn  !== false);
  togSet("tog-auto",    cfg.autoOn);
  togSet("tog-prana",   cfg.pranayamaAuto !== false);
  document.getElementById("cfg-prana-min").value  = cfg.pranayamaMinutes || 28;
  document.getElementById("cfg-prana-lang").value = cfg.pranaLang || "en";
  togSet("tog-alarm", cfg.alarmOn !== false);
  document.getElementById("cfg-alarm-time").value =
    String(cfg.alarmHour||5).padStart(2,"0") + ":" +
    String(cfg.alarmMinute||0).padStart(2,"0");
  document.getElementById("cfg-voice-info").textContent =
    hiVoice ? "Active: "+hiVoice.name+" ("+hiVoice.lang+")"
            : "No hi-IN voice — install Hindi TTS in Android Settings → Language → Text-to-speech.";
  document.getElementById("dr").classList.add("show");
}
function closeSettings() {
  cfg.dailyIncrease = parseInt(document.getElementById("cfg-inc").value) || 4;
  const newGoal = parseInt(document.getElementById("cfg-goal").value) || 0;
  if(newGoal > 0) setTodayGoal(newGoal);  // always anchor programDay when user sets a goal
  cfg.maxSets       = parseInt(document.getElementById("cfg-max").value)   ||108;
  cfg.breakEvery    = parseInt(document.getElementById("cfg-brk").value)   ||12;
  cfg.poseSeconds   = Math.max(2, Math.min(30, parseInt(document.getElementById("cfg-pace").value)||5));
  cfg.graceSeconds  = Math.max(0, Math.min(30, parseInt(document.getElementById("cfg-grace").value)||5));
  const lt=parseInt(document.getElementById("cfg-lifetime").value);
  if(!isNaN(lt)&&lt>=0) data.totalAllTime=lt;
  cfg.voiceOn          = togGet("tog-voice");
  cfg.mantrasOn        = togGet("tog-mantras");
  cfg.breathOn         = togGet("tog-breath");
  cfg.autoOn           = togGet("tog-auto");
  cfg.pranayamaAuto    = togGet("tog-prana");
  cfg.pranayamaMinutes = parseInt(document.getElementById("cfg-prana-min").value)||28;
  cfg.pranaLang        = document.getElementById("cfg-prana-lang").value || "en";
  cfg.alarmOn          = togGet("tog-alarm");
  const aTime = document.getElementById("cfg-alarm-time").value || "05:00";
  const [aH, aM] = aTime.split(":").map(Number);
  cfg.alarmHour   = isNaN(aH) ? 5  : aH;
  cfg.alarmMinute = isNaN(aM) ? 0  : aM;
  voiceMuted      = !cfg.voiceOn;
  scheduleAlarm();   // reschedule with new time
  cfg.chartDays = parseInt(document.getElementById("cfg-chart-days").value) || 21;
  cfg.chartMode = document.getElementById("cfg-chart-mode").value || "bar";
  saveAll(); render();
  document.getElementById("dr").classList.remove("show");
}
const togSet=(id,on)=>document.getElementById(id).classList.toggle("on",on);
const togGet=id=>document.getElementById(id).classList.contains("on");
["tog-voice","tog-mantras","tog-breath","tog-auto","tog-prana","tog-alarm"].forEach(id=>{
  const el = document.getElementById(id);
  if(el) el.addEventListener("click",function(){this.classList.toggle("on");});
});
document.getElementById("settings-btn").addEventListener("click",openSettings);
document.getElementById("dr-close").addEventListener("click",closeSettings);
document.getElementById("dr-bg").addEventListener("click",closeSettings);
document.getElementById("reset-data").addEventListener("click",()=>{
  if(confirm("Reset ALL data?")){ localStorage.removeItem(KEY); location.reload(); }
});

/* ── PWA ─────────────────────────────────────────────────────── */
let deferredPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); deferredPrompt=e;
  setStatus("Tap ⋮ → Add to Home Screen to install offline"); });
window.addEventListener("appinstalled",()=>setStatus("App installed! Works offline ✓"));
if("serviceWorker" in navigator){
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("sw.js");
      // Show update banner when new SW installs
      const showBanner = () => {
        const b = document.getElementById("upd-banner");
        if(b) b.classList.add("show");
      };
      reg.addEventListener("updatefound", () => {
        const nw = reg.installing;
        nw.addEventListener("statechange", () => {
          if(nw.state==="installed" && navigator.serviceWorker.controller) showBanner();
        });
      });
      if(reg.waiting && navigator.serviceWorker.controller) showBanner();
      // Auto-reload when new SW takes over
      let refreshing=false;
      navigator.serviceWorker.addEventListener("controllerchange",()=>{
        if(!refreshing){refreshing=true;location.reload();}
      });
    } catch(e){ console.warn("SW:",e); }
  });
}

/* ═══════════════════════════════════════════════════════════════
   GOAL ROLLOVER SYSTEM — updates goal at 4:01 AM daily
   Works on OxygenOS: visibilitychange fires every time you
   open the app, so opening at 5 AM always gets fresh goal.
   Short setTimeout (< 30 min) also set when app is open near
   4:01 AM (e.g. if app open at 3:45 AM).
═══════════════════════════════════════════════════════════════ */

// Track last rollover so it fires only once per day even on multiple app opens
// Initialised to "" and set properly in loadAll() after data is loaded
function _doGoalRollover() {
  const today = todayKey();

  // Already rolled over for today in this session — skip
  if(_goalRolledDate === today) return;

  // lastDate is still today (opened and closed same day) — only skip
  // if data.lastDate === today AND lastRolledDate === today (both match)
  // This handles: app open yesterday, closed, reopened today after 4:01 AM
  if(data.lastDate === today && data.lastRolledDate === today) {
    _goalRolledDate = today; // sync runtime tracker
    return;
  }

  _goalRolledDate = today;

  const last = new Date((data.lastDate || today) + "T00:00:00");
  const cur  = new Date(today + "T00:00:00");
  const daysMissed = Math.max(0, Math.round((cur - last) / 86400000));

  // If daysMissed is 0 it means lastDate was already today but
  // lastRolledDate was a previous date — still need to advance goal
  // Use 1 as minimum advance for programDay when this happens
  const advance = Math.max(1, daysMissed);

  // Advance programDay
  data.programDay = (data.programDay || 1) + advance;

  // Fill any skipped days in history with 0-sets records
  for(let d = 1; d < daysMissed; d++) {
    const skipDate = new Date(last.getTime() + d * 86400000)
      .toISOString().slice(0, 10);
    if(!data.history[skipDate]) {
      const skipGoal = Math.min(
        (data.lastGoal || 0) + d * cfg.dailyIncrease,
        cfg.maxSets
      );
      data.history[skipDate] = { sets:0, timeMs:0, goal:skipGoal };
    }
  }

  // Determine lastGoal for tomorrow's calculation
  // +4 only if the most recent practiced day's goal was COMPLETED
  if(data.baseGoal > 0 && data.goalDate === data.lastDate) {
    // User manually set a goal yesterday — check if they completed it
    const yRec = data.history[data.lastDate] || {};
    const completed = (yRec.sets||0) >= data.baseGoal;
    if(completed) {
      data.lastGoal = data.baseGoal;  // completed manual goal → +4 tomorrow
    } else {
      data.lastGoal = data.baseGoal;  // didn't complete → keep same goal (no +4)
      // Override: tomorrow's goal = same as today (not +4)
      // We achieve this by NOT adding dailyIncrease in todayGoal()
      // Set a flag: incompleteDayGoal = yesterday's goal to repeat
      data.repeatGoal     = data.baseGoal;
      data.repeatGoalDate = todayKey();  // today should repeat yesterday's goal
    }
    data.baseGoal = 0;
  } else {
    // Walk back to find most recently COMPLETED day
    let foundCompleted = false;
    for(let d = 1; d <= daysMissed + 2; d++) {
      const check = new Date(cur.getTime() - d * 86400000)
        .toISOString().slice(0, 10);
      const rec = data.history[check];
      if(!rec || !rec.goal) continue;
      if((rec.sets||0) >= rec.goal) {
        // This day was completed — use its goal as base for +4
        data.lastGoal = rec.goal;
        foundCompleted = true;
        break;
      } else {
        // This day was NOT completed — repeat its goal (no +4)
        data.lastGoal = rec.goal;
        data.repeatGoal     = rec.goal;
        data.repeatGoalDate = todayKey();
        foundCompleted = false;
        break;
      }
    }
  }

  // Clear manual override so today uses auto formula
  data.baseGoal      = 0;
  data.goalDate      = "";
  data.lastDate      = today;
  data.lastRolledDate = today;  // persist so next app open knows rollover ran
  _goalRolledDate    = today;   // also update runtime tracker

  saveAll();
  render();

  console.log("Goal rolled over at 4:01 AM | new goal:", todayGoal(),
    "| programDay:", data.programDay);
}

function checkDayRollover() {
  const now  = new Date();
  const hour = now.getHours();
  const min  = now.getMinutes();
  const today = todayKey();

  // Rollover condition: it's 4:01 AM or later AND we haven't rolled today yet
  const pastRolloverTime = (hour > 4) || (hour === 4 && min >= 1);
  const notYetRolled     = _goalRolledDate !== today;

  if(pastRolloverTime && notYetRolled) {
    _doGoalRollover();
  }
}

let _rolloverTimer = null;

function scheduleRollover() {
  // Cancel existing timer
  if(_rolloverTimer) { clearTimeout(_rolloverTimer); _rolloverTimer = null; }

  const now  = new Date();
  const target = new Date(
    now.getFullYear(), now.getMonth(), now.getDate(),
    4, 1, 0, 0   // 4:01:00 AM today
  );
  // If 4:01 AM already passed today, schedule for tomorrow 4:01 AM
  if(target <= now) target.setDate(target.getDate() + 1);

  const ms = target.getTime() - now.getTime();

  // Only set timer if within 90 minutes — OxygenOS kills longer timers
  // visibilitychange will re-schedule when app is opened later
  if(ms <= 90 * 60 * 1000) {
    _rolloverTimer = setTimeout(() => {
      _doGoalRollover();
      scheduleRollover();  // schedule for next day's 4:01 AM
    }, ms);
    const mins = Math.round(ms / 60000);
    console.log("Goal rollover timer set: fires in", mins, "min (4:01 AM)");
  } else {
    const hrs = Math.floor(ms / 3600000);
    const rem = Math.round((ms % 3600000) / 60000);
    console.log("Goal rollover: next at 4:01 AM in", hrs + "h " + rem + "m",
      "| will re-schedule on app open");
  }
}

// visibilitychange handled in unified handler below


/* ═══════════════════════════════════════════════════════════════
   DAILY ALARM SYSTEM
   Android kills setTimeout when app is backgrounded, so we use:
   1. Service Worker showNotification (fires from SW, survives background)
   2. Android system alarm deep-link as a guaranteed fallback
   3. visibilitychange — when user opens app near alarm time, speak greeting
═══════════════════════════════════════════════════════════════ */

async function requestNotificationPermission() {
  if(!("Notification" in window)) return false;
  if(Notification.permission === "granted") return true;
  if(Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

// ── Morning greeting: fires when app opened near alarm time ─────
function checkMorningGreeting() {
  if(!cfg.alarmOn) return;
  const now      = new Date();
  const ah       = cfg.alarmHour   || 5;
  const am       = cfg.alarmMinute || 0;
  const alarmToday = new Date(now.getFullYear(),now.getMonth(),now.getDate(),ah,am,0);
  const diffMin  = (now - alarmToday) / 60000;

  // Fire within 60 min window after alarm time
  if(diffMin >= 0 && diffMin <= 60) {
    const goal = todayGoal();
    const q    = getTodayQuote();
    const qText= getQuoteText(q);
    const lang = cfg.pranaLang || "en";
    const greetings = {
      en:"Good morning Vaibhav! Today target is "+goal+" rounds. Om Mitraya Namaha.",
      hi:"सुप्रभात वैभव! आज का लक्ष्य है "+goal+" राउंड। ॐ मित्राय नमः।",
      mr:"सुप्रभात वैभव! आजचे लक्ष्य आहे "+goal+" फेऱ्या. ॐ मित्राय नमः.",
    };
    setTimeout(()=>{
      _speakAlarmGreeting(greetings[lang]||greetings.en, qText, q.lang||lang);
      showDailyQuoteCard(q);
    }, 800);
  }

  // Also check if opened via alarm notification URL param
  if(window.location.search.includes("alarm=1")) {
    history.replaceState({}, "", "./");  // clean URL
    const goal = todayGoal();
    const q    = getTodayQuote();
    const qText= getQuoteText(q);
    const lang = cfg.pranaLang || "en";
    const greetings = {
      en:"Good morning! Today target is "+goal+" rounds.",
      hi:"सुप्रभात! आज का लक्ष्य "+goal+" राउंड।",
      mr:"सुप्रभात! आजचे लक्ष्य "+goal+" फेऱ्या.",
    };
    setTimeout(()=>{
      _speakAlarmGreeting(greetings[lang]||greetings.en, qText, q.lang||lang);
      showDailyQuoteCard(q);
    }, 1200);
  }
}

function showDailyQuoteCard(q) {
  const card = document.getElementById("quote-card");
  if(!card) return;
  const lang = cfg.pranaLang || "en";
  document.getElementById("quote-text").textContent = getQuoteText(q);
  document.getElementById("quote-src").textContent  = "— " + (q.src||q.source||"");
  card.style.display = "block";
  card.classList.add("show");
}

// ── Core alarm: setTimeout fires at exact alarm time ─────────
let _alarmTimeout = null;

function msUntilAlarm(h, m) {
  const now  = new Date();
  const next = new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,m,0,0);
  if(next <= now) next.setDate(next.getDate() + 1);  // already passed → tomorrow
  return next.getTime() - now.getTime();
}

function fmtAlarmTime(h, m) {
  const ampm = h >= 12 ? "PM" : "AM";
  const hh   = h % 12 || 12;
  return hh + ":" + String(m).padStart(2,"0") + " " + ampm;
}

function fireAlarm() {
  if(!cfg.alarmOn) { scheduleAlarm(); return; }
  // Trigger goal rollover at alarm time
  checkDayRollover();
  const goal = todayGoal();
  const done = todayDone();
  const q    = getTodayQuote();
  const qText = getQuoteText(q);
  const qLang = cfg.pranaLang || "en";

  // Morning greeting in the selected language
  const greetings = {
    en: "Good morning Vaibhav! Time for Surya Namaskara. Today target is " + goal + " rounds.",
    hi: "सुप्रभात वैभव! सूर्यनमस्कार का समय है। आज का लक्ष्य है " + goal + " राउंड।",
    mr: "सुप्रभात वैभव! सूर्यनमस्काराची वेळ झाली. आजचे लक्ष्य आहे " + goal + " फेऱ्या.",
  };
  const greeting = greetings[qLang] || greetings.en;

  // Full notification body = greeting + quote + source
  const notifBody = greeting + "\n\n✨ " + qText + "\n— " + (q.src||q.source||"");

  // Show notification with quote — tap opens app automatically
  if(Notification.permission === "granted") {
    try {
      const reg = navigator.serviceWorker.controller;
      if(reg) {
        // Use SW notification — supports notificationclick for auto-open
        navigator.serviceWorker.ready.then(sw => {
          sw.showNotification("वैभव - सूर्यसारथी.१ॐ८", {
            body   : notifBody,
            icon   : "./icon-192.png",
            badge  : "./icon-192.png",
            tag    : "surya-daily-alarm",
            renotify: true,
            vibrate: [300,100,300,100,600],
            data   : { url:"./index.html?alarm=1" },
            actions: [{ action:"open", title:"Start Practice 🙏" }],
          });
        });
      } else {
        // Fallback: regular notification
        const n = new Notification("वैभव - सूर्यसारथी.१ॐ८", {
          body: notifBody, icon:"./icon-192.png", badge:"./icon-192.png",
          tag:"surya-daily-alarm", renotify:true, vibrate:[300,100,300,100,600],
        });
        n.onclick = ()=>{ window.focus(); n.close(); };
      }
    } catch(e) { console.warn("Notification error:", e); }
  }

  // Speak greeting + quote if app is visible
  if(document.visibilityState === "visible") {
    _speakAlarmGreeting(greeting, qText, q.lang || qLang);
  }

  // Store today's quote index so UI can display it
  data._todayQuoteIdx = QUOTES.indexOf(q);
  saveAll();

  scheduleAlarm();  // reschedule for tomorrow
}

function _speakAlarmGreeting(greeting, quoteText, quoteLang) {
  qClear();
  // 1. Speak greeting in selected language
  setTimeout(()=>{
    const gu = new SpeechSynthesisUtterance(greeting);
    gu.lang = cfg.pranaLang==="hi" ? "hi-IN" : cfg.pranaLang==="mr" ? "mr-IN" : "en-IN";
    gu.rate = 0.78; gu.pitch = 1.0; gu.volume = 1.0;
    const gv = speechSynthesis.getVoices().find(v=>v.lang===gu.lang)
            || speechSynthesis.getVoices().find(v=>v.lang.startsWith(cfg.pranaLang||"en"))
            || null;
    if(gv) gu.voice = gv;
    qSpeak(gu);
  }, 400);

  // 2. Speak motivational quote (600ms after greeting queued)
  setTimeout(()=>{
    const qu = new SpeechSynthesisUtterance(quoteText);
    qu.lang  = quoteLang==="hi"?"hi-IN":quoteLang==="mr"?"mr-IN":"en-IN";
    qu.rate  = 0.70; qu.pitch = 0.95; qu.volume = 1.0;
    const qv = speechSynthesis.getVoices().find(v=>v.lang===qu.lang)
            || null;
    if(qv) qu.voice = qv;
    qSpeak(qu);

    // 3. Speak source
    const su = new SpeechSynthesisUtterance("— " + quoteText.source);
    su.lang = "en-IN"; su.rate = 0.65; su.pitch = 0.9; su.volume = 0.8;
    qSpeak(su);
  }, 800);
}

function scheduleAlarm() {
  if(_alarmTimeout) { clearTimeout(_alarmTimeout); _alarmTimeout = null; }
  if(!cfg.alarmOn) return;

  const h  = cfg.alarmHour   || 5;
  const m  = cfg.alarmMinute || 0;
  const ms = msUntilAlarm(h, m);

  // Only set setTimeout if alarm is within 90 min — OxygenOS kills longer timers.
  // visibilitychange re-schedules every time you open the app, so it stays accurate.
  if(ms <= 90 * 60 * 1000) {
    _alarmTimeout = setTimeout(fireAlarm, ms);
    console.log("Alarm timer set — fires in", Math.round(ms/1000), "sec");
  } else {
    // Try Android system alarm (works in TWA; silently ignored in browser)
    _tryAndroidAlarm(h, m);
    console.log("Alarm: next at", fmtAlarmTime(h,m), "in", Math.round(ms/60000), "min");
  }
}

// ── setAndroidAlarm: called from Settings "Set Android Alarm" button ──
// Opens the Android Clock app with the alarm pre-filled.
// Works in Chrome on Android when app is added to Home Screen.
function setAndroidAlarm(h, m) {
  h = h || cfg.alarmHour   || 5;
  m = m || cfg.alarmMinute || 0;

  const label = encodeURIComponent(
    "वैभव - सूर्यसारथी.१ॐ८ | " +
    (h % 12 || 12) + ":" + String(m).padStart(2,"0") + (h>=12?" PM":" AM") +
    " — Open app for today goal"
  );

  // Method 1: Android Intent URL — opens Clock app directly (works on most Android)
  const intentUrl =
    "intent://alarm#Intent;" +
    "action=android.intent.action.SET_ALARM;" +
    "extra.android.intent.extra.alarm.HOUR=" + h + ";" +
    "extra.android.intent.extra.alarm.MINUTES=" + m + ";" +
    "extra.android.intent.extra.alarm.MESSAGE=" + label + ";" +
    "extra.android.intent.extra.alarm.SKIP_UI=true;" +
    "extra.android.intent.extra.alarm.VIBRATE=true;" +
    "end";

  // Try intent URL
  try {
    window.location.href = intentUrl;
    console.log("Android alarm intent sent:", h + ":" + String(m).padStart(2,"0"));
  } catch(e) {
    // Method 2: Fallback — open Clock app via generic intent
    try {
      window.location.href = "intent://#Intent;action=android.intent.action.MAIN;" +
        "category=android.intent.category.LAUNCHER;" +
        "package=com.google.android.deskclock;end";
    } catch(e2) {
      alert("Please open your Clock app manually and set an alarm for " +
            (h%12||12) + ":" + String(m).padStart(2,"0") + (h>=12?" PM":" AM") +
            "\nLabel: वैभव - सूर्यसारथी");
    }
  }

  // Schedule JS timer as backup (for when app is open near alarm time)
  scheduleAlarm();
}

function _tryAndroidAlarm(h, m) {
  // Internal alias — used by fireAlarm for background attempt
  setAndroidAlarm(h, m);
}

function cancelAlarm() {
  if(_alarmTimeout) { clearTimeout(_alarmTimeout); _alarmTimeout = null; }
  setStatus("Alarm cancelled");
}

// visibilitychange handled in unified handler below

// SW message: alarm notification was tapped → greet + quote
navigator.serviceWorker && navigator.serviceWorker.addEventListener("message", e=>{
  if(e.data && e.data.type === "ALARM_FIRED") {
    checkMorningGreeting();
  }
});

// ── UNIFIED visibilitychange — one handler, no duplicates ──────
document.addEventListener("visibilitychange", async () => {
  if(document.visibilityState !== "visible") return;
  // 1. Re-acquire wake lock if session active
  if(sess.active && !sess.paused) await acquireWakeLock();
  // 2. Check if goal needs rolling over (4:01 AM rule)
  checkDayRollover();
  // 3. Re-schedule rollover timer (OxygenOS may have killed it)
  scheduleRollover();
  // 4. Reschedule alarm timer
  if(cfg.alarmOn) scheduleAlarm();
  // 5. Greet if opened near alarm time
  checkMorningGreeting();
});



/* ═══════════════════════════════════════════════════════════════
   MOTIVATIONAL QUOTES — Bhagavad Gita, documentaries, Hollywood,
   Marathi proverbs, life wisdom. Rotates daily by day-of-year.
═══════════════════════════════════════════════════════════════ */
const QUOTES = [
  // ── Bhagavad Gita (Shree Krishna) ───────────────────────────
  { text:"कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
    trans:"You have the right to perform your duties, but never to the fruits of action.",
    src:"Bhagavad Gita 2.47" },
  { text:"योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनंजय।",
    trans:"Be steadfast in yoga, O Arjuna. Perform your duty and abandon all attachment.",
    src:"Bhagavad Gita 2.48" },
  { text:"उद्धरेदात्मनाऽत्मानं नात्मानमवसादयेत्।",
    trans:"Let a man lift himself by himself; let him not degrade himself.",
    src:"Bhagavad Gita 6.5" },
  { text:"नायमात्मा बलहीनेन लभ्यः।",
    trans:"This Self cannot be attained by one without strength.",
    src:"Mundaka Upanishad" },
  { text:"Change is the law of the universe. You can be a millionaire or a pauper in an instant.",
    trans:"बदलाव सृष्टीचा नियम आहे. क्षणात राजा होता येते, क्षणात रंक.",
    src:"Shree Krishna, Bhagavad Gita" },
  { text:"श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्।",
    trans:"Better is one's own dharma, though imperfectly performed, than the dharma of another.",
    src:"Bhagavad Gita 3.35" },
  { text:"मन एव मनुष्याणां कारणं बन्धमोक्षयोः।",
    trans:"The mind alone is the cause of bondage and liberation for human beings.",
    src:"Amritabindu Upanishad" },

  // ── Hollywood / Documentary dialogs ─────────────────────────
  { text:"In every day, there are 1,440 minutes. That means we have 1,440 daily opportunities to make a positive impact.",
    trans:"प्रत्येक दिवसात 1,440 मिनिटे असतात. म्हणजे सकारात्मक प्रभाव पाडण्याच्या 1,440 संधी.",
    src:"Les Brown" },
  { text:"It does not matter how slowly you go as long as you do not stop.",
    trans:"तुम्ही किती हळू जाता हे महत्त्वाचे नाही, जोपर्यंत थांबत नाही.",
    src:"Confucius" },
  { text:"The only way to do great work is to love what you do.",
    trans:"महान काम करण्याचा एकच मार्ग आहे — जे करतो ते प्रेमाने करा.",
    src:"Steve Jobs" },
  { text:"You are enough. You have enough. You do enough.",
    trans:"तुम्ही पुरेसे आहात. तुमच्याकडे पुरेसे आहे. तुम्ही पुरेसे करतो.",
    src:"Brené Brown" },
  { text:"Life is not measured by the number of breaths we take, but by the moments that take our breath away.",
    trans:"आयुष्य श्वासांच्या संख्येने नाही, तर ज्या क्षणांनी श्वास अडतो त्याने मोजले जाते.",
    src:"Maya Angelou" },
  { text:"Do or do not. There is no try.",
    trans:"कर किंवा करू नकोस. 'प्रयत्न' असे काही नसते.",
    src:"Yoda, Star Wars" },
  { text:"With great power comes great responsibility.",
    trans:"मोठ्या शक्तीसोबत मोठी जबाबदारीही येते.",
    src:"Spider-Man / Voltaire" },
  { text:"Every morning you have two choices: continue to sleep with your dreams, or wake up and chase them.",
    trans:"प्रत्येक सकाळी दोन निवडी असतात: स्वप्नांसोबत झोपत राहा, किंवा उठा आणि त्यांचा पाठलाग करा.",
    src:"Unknown" },
  { text:"The body achieves what the mind believes.",
    trans:"मन जे मानते, शरीर ते साध्य करते.",
    src:"Napoleon Hill" },

  // ── Marathi proverbs & wisdom ────────────────────────────────
  { text:"उद्योगाला लक्ष्मी साथ देते.",
    trans:"Lakshmi accompanies those who work hard.",
    src:"Marathi proverb" },
  { text:"केल्याने होत आहे रे, आधी केलेची पाहिजे.",
    trans:"It happens by doing — one must first begin.",
    src:"Kavi Sripad Krishna Kolhatkar" },
  { text:"मनी वसे ते स्वप्नी दिसे.",
    trans:"What resides in the mind appears in dreams. Think big.",
    src:"Marathi proverb" },
  { text:"शरीर हे देवाचे मंदिर आहे, त्याची काळजी घ्या.",
    trans:"The body is God's temple — take care of it.",
    src:"Marathi wisdom" },
  { text:"अपयश हे यशाची पहिली पायरी आहे.",
    trans:"Failure is the first step to success.",
    src:"Marathi proverb" },
  { text:"आरोग्य हीच संपत्ती.",
    trans:"Health is wealth.",
    src:"Marathi proverb" },

  // ── Hindi wisdom ─────────────────────────────────────────────
  { text:"कोशिश करने वालों की कभी हार नहीं होती।",
    trans:"Those who keep trying never lose.",
    src:"Harivansh Rai Bachchan" },
  { text:"जो बीत गई सो बात गई। अब का सोचो, कल का बनाओ।",
    trans:"What's gone is gone. Think of now, build for tomorrow.",
    src:"Hindi wisdom" },
  { text:"मन के हारे हार है, मन के जीते जीत।",
    trans:"If the mind loses, you lose. If the mind wins, you win.",
    src:"Kabir Das" },
  { text:"सवेरे जो जागे, उनके लिए सफलता दरवाजे पर होती है।",
    trans:"For those who wake early, success stands at the door.",
    src:"Hindi proverb" },

  // ── Documentary / Science inspiration ────────────────────────
  { text:"We are made of star-stuff. We are a way for the cosmos to know itself.",
    trans:"आपण तारकांपासून बनलेलो आहोत. आपण ब्रह्मांडाचा स्वतःला जाणण्याचा मार्ग आहोत.",
    src:"Carl Sagan, Cosmos" },
  { text:"Somewhere, something incredible is waiting to be known.",
    trans:"कुठेतरी, काहीतरी अविश्वसनीय तुम्हाला जाणून घेण्याची वाट पाहत आहे.",
    src:"Carl Sagan" },
  { text:"The nitrogen in our DNA, the calcium in our teeth, the iron in our blood were made in collapsing stars.",
    trans:"आपल्या डीएनएतील नायट्रोजन, दातांतील कॅल्शियम — सारे तार्यांनी निर्माण केले.",
    src:"Carl Sagan" },

  // ── Bhagavad Gita — Shree Krishna (additional) ──────────────
  { text:"ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते।",
    trans:"While contemplating sense objects, attachment is born. Control the mind — it is your greatest ally.",
    src:"Bhagavad Gita 2.62, Shree Krishna" },
  { text:"न त्वेवाहं जातु नासं न त्वं नेमे जनाधिपाः।",
    trans:"Never was there a time when I did not exist, nor you, nor these kings. Nor shall any of us cease to be.",
    src:"Bhagavad Gita 2.12, Shree Krishna" },
  { text:"हतो वा प्राप्स्यसि स्वर्गं जित्वा वा भोक्ष्यसे महीम्।",
    trans:"Slay and you shall win heaven. Conquer and you shall enjoy the earth. Rise up, O Arjuna, determined to fight.",
    src:"Bhagavad Gita 2.37, Shree Krishna" },
  { text:"सुखदुःखे समे कृत्वा लाभालाभौ जयाजयौ।",
    trans:"Treat pleasure and pain, gain and loss, victory and defeat alike. Then engage in battle — you will not incur sin.",
    src:"Bhagavad Gita 2.38, Shree Krishna" },
  { text:"तस्मादसक्तः सततं कार्यं कर्म समाचर।",
    trans:"Therefore, always perform your duty efficiently without attachment. By doing work without attachment, man attains the Supreme.",
    src:"Bhagavad Gita 3.19, Shree Krishna" },
  { text:"यद्यदाचरति श्रेष्ठस्तत्तदेवेतरो जनः।",
    trans:"Whatever a great man does, others follow. Whatever standard he sets, the world follows.",
    src:"Bhagavad Gita 3.21, Shree Krishna" },
  { text:"क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः।",
    trans:"From anger comes delusion; from delusion comes loss of memory; from that comes destruction of intelligence — and then ruin.",
    src:"Bhagavad Gita 2.63, Shree Krishna" },

  // ── Hollywood famous dialogs ─────────────────────────────────
  { text:"Get busy living, or get busy dying.",
    trans:"एकतर जगण्यात गुंतून जा, नाहीतर मरण्यात. मधला रस्ता नाही.",
    src:"The Shawshank Redemption (1994)" },
  { text:"After all, tomorrow is another day!",
    trans:"शेवटी, उद्या एक नवा दिवस आहे!",
    src:"Gone with the Wind — Scarlett O'Hara" },
  { text:"To infinity and beyond!",
    trans:"अनंताच्या पलीकडे आणि त्याहीपुढे!",
    src:"Toy Story — Buzz Lightyear" },
  { text:"Life is like a box of chocolates — you never know what you're gonna get.",
    trans:"आयुष्य चॉकलेटच्या पेटीसारखे आहे — काय मिळेल ते कधी कळत नाही.",
    src:"Forrest Gump (1994)" },
  { text:"Why so serious? Let's put a smile on that face!",
    trans:"इतके गंभीर का? त्या चेहऱ्यावर हसू आणूया!",
    src:"The Dark Knight — The Joker" },
  { text:"May the Force be with you.",
    trans:"शक्ती तुमच्यासोबत असो.",
    src:"Star Wars" },
  { text:"You shall not pass!",
    trans:"तुम्ही पुढे जाणार नाही! अडथळ्यांसमोर ठाम उभे राहा.",
    src:"The Lord of the Rings — Gandalf" },
  { text:"I am the master of my fate; I am the captain of my soul.",
    trans:"मी माझ्या नशिबाचा स्वामी आहे; मी माझ्या आत्म्याचा नाविक आहे.",
    src:"Invictus (W.E. Henley) — Invictus film" },
  { text:"Every strike brings me closer to the next home run.",
    trans:"प्रत्येक अपयश मला पुढच्या यशाच्या जवळ आणते.",
    src:"Babe Ruth" },
  { text:"Pain is temporary. It may last a minute, or an hour, or a day, but eventually it will subside — and something else will take its place. But if you quit, it lasts forever.",
    trans:"वेदना तात्पुरती असते. पण हार मानली तर ती कायमची राहते.",
    src:"Lance Armstrong" },

  // ── Career & Life wisdom ──────────────────────────────────────
  { text:"Your time is limited, so don't waste it living someone else's life.",
    trans:"तुमचा वेळ मर्यादित आहे, तो दुसऱ्याचे आयुष्य जगण्यात वाया घालवू नका.",
    src:"Steve Jobs, Stanford 2005" },
  { text:"Success is not final, failure is not fatal: it is the courage to continue that counts.",
    trans:"यश अंतिम नाही, अपयश घातक नाही: महत्त्वाची आहे ती सुरू ठेवण्याची हिम्मत.",
    src:"Winston Churchill" },
  { text:"The secret of getting ahead is getting started.",
    trans:"पुढे जाण्याचे रहस्य म्हणजे सुरुवात करणे.",
    src:"Mark Twain" },
  { text:"Discipline is the bridge between goals and accomplishment.",
    trans:"शिस्त हा ध्येय आणि यश यांच्यातला पूल आहे.",
    src:"Jim Rohn" },
  { text:"The harder I work, the luckier I get.",
    trans:"मी जितका कठोर परिश्रम करतो, तितका मला नशीब साथ देते.",
    src:"Samuel Goldwyn" },
  { text:"Don't watch the clock; do what it does. Keep going.",
    trans:"घड्याळाकडे पाहत बसू नका; त्याचे अनुकरण करा. सुरू ठेवा.",
    src:"Sam Levenson" },
  { text:"It always seems impossible until it's done.",
    trans:"ते करेपर्यंत नेहमीच अशक्य वाटते.",
    src:"Nelson Mandela" },

  // ── Marathi saints & wisdom (additional) ─────────────────────
  { text:"ज्ञानदेव म्हणे आता। सर्व सुखाचा विसावा। माझा विठ्ठलु देव जाणावा।",
    trans:"Sant Dnyaneshwar says: know my Lord Vitthal as the resting place of all joy.",
    src:"Sant Dnyaneshwar" },
  { text:"तुका म्हणे असे जाले। मन माझे निवाले।",
    trans:"Sant Tukaram says: my mind has found peace. Seek inner peace in practice.",
    src:"Sant Tukaram" },
  { text:"परमार्थाची माय लाज। देव आहे दावीत काज।",
    trans:"God shows the way to those who seek the highest truth with dedication.",
    src:"Samarth Ramdas" },
  { text:"मना सज्जना भक्तिपंथेचि जावे।",
    trans:"O noble mind, walk the path of devotion. That is the only true path.",
    src:"Samarth Ramdas, Manache Shlok" },
];

function getDailyQuote() {
  const d   = new Date();
  const day = Math.floor((d - new Date(d.getFullYear(),0,0)) / 86400000);
  return QUOTES[day % QUOTES.length];
}

// Compatibility aliases for older code references
function getTodayQuote()       { return getDailyQuote(); }
function getQuoteText(q)       {
  const lang = cfg.pranaLang || "en";
  if(lang==="hi" && q.trans) return q.trans;
  if(lang==="mr" && q.trans) return q.trans;
  return q.text;
}

function buildMotivationalMsg(goal, done) {
  const q   = getDailyQuote();
  const rem = Math.max(0, goal - done);
  const lang = cfg.pranaLang || "en";

  // Goal line in selected language
  let goalLine = "";
  if(lang === "hi")
    goalLine = "नमस्ते वैभव! आज का लक्ष्य " + goal + " सूर्यनमस्कार है।";
  else if(lang === "mr")
    goalLine = "नमस्कार वैभव! आजचे लक्ष्य " + goal + " सूर्यनमस्कार आहे.";
  else
    goalLine = "Good morning Vaibhav! Today's target: " + goal + " Surya Namaskara.";

  if(done > 0) goalLine += (lang==="mr" ? " आधीच " + done + " केले!" :
                             lang==="hi" ? " अब तक " + done + " हो गए!" :
                             " You've already done " + done + "!");

  // Quote text — use translation if Hindi/Marathi
  const qText = (lang === "mr" && q.trans && !q.trans.startsWith("http")) ? q.trans
              : (lang === "hi" && q.trans && !q.trans.startsWith("http")) ? q.trans
              : q.text;

  return { goalLine, qText, src: q.src, fullText: goalLine + " " + qText };
}

// Launch alarm: sets Android alarm + opens app on trigger
function launchAlarmAndOpen() {
  const h = cfg.alarmHour   || 5;
  const m = cfg.alarmMinute || 0;
  // Set Android system alarm via intent (works in installed PWA/TWA)
  _tryAndroidAlarm(h, m);
  // Also use Web Notification with deep-link back to app
  if(Notification.permission === "granted") {
    const goal = todayGoal();
    const q    = getDailyQuote();
    try {
      const n = new Notification("वैभव - सूर्यसारथी.१ॐ८", {
        body   : "🌅 " + goal + " rounds await. " + q.text.slice(0,80) + "…",
        icon   : "./icon-192.png",
        badge  : "./icon-192.png",
        tag    : "surya-daily",
        renotify: true,
        vibrate: [300,100,300,100,600],
        data   : { url: "./" },
      });
      n.onclick = () => { window.focus(); n.close(); speakDailyMotivation(); };
    } catch(e) {}
  }
}

function speakDailyMotivation() {
  const goal = todayGoal();
  const done = todayDone();
  const { goalLine, qText, src } = buildMotivationalMsg(goal, done);
  // Queue: goal announcement then quote
  setTimeout(()=>{
    qClear();
    qSpeak(makePranaUtt(goalLine));
    setTimeout(()=>{ qSpeak(makePranaUtt(qText)); }, 2000);
    setTimeout(()=>{
      const srcUtt = makeEnUtt(src);
      srcUtt.rate  = 0.75;
      srcUtt.pitch = 0.9;
      qSpeak(srcUtt);
    }, 6000);
  }, 600);
}

/* ── Data Recovery Scanner ─────────────────────────────────────
   Scans every possible localStorage key and shows what's found.
   Called from Settings "Scan & Recover" button.
──────────────────────────────────────────────────────────────── */
function scanAndRecover() {
  const ALL_KEYS = [
    "surya-v36","surya-v33","surya-v32","surya-v31","surya-v30","surya-v29",
    "surya-v28","surya-v27","surya-v26","surya-v25","surya-v24","surya-v23",
    "surya-v22","surya-v21","surya-v20","surya-v19","surya-v18","surya-v17",
    "surya-v16","surya-v15","surya-v14","surya-v13","surya-v12","surya-v11",
    "surya-v10","surya-v9","surya-v8","surya-v7","surya-v6","surya-v5",
    "surya-v4","surya-v3","surya-v2","surya-v1","surya-namaskara-data-v1","surya-v0"
  ];

  const found = [];
  for(const k of ALL_KEYS) {
    const raw = localStorage.getItem(k);
    if(!raw) continue;
    try {
      const sv  = JSON.parse(raw);
      const d   = sv.data || sv;  // handle flat and nested formats
      const sets = d.totalAllTime || 0;
      const days = Object.keys(d.history || {}).length;
      const timeMs = d.totalTimeMs || 0;
      found.push({ key:k, sets, days, timeMs });
    } catch(e) { found.push({ key:k, sets:"?", days:"?", timeMs:0 }); }
  }

  if(found.length === 0) {
    alert("No saved data found in any version key.\nAll data appears to have been cleared.");
    return;
  }

  // Show found keys
  let msg = "Found data in " + found.length + " version key(s):\n\n";
  found.forEach(f => {
    const mins = Math.round(f.timeMs / 60000);
    msg += f.key + "\n  Sets: " + f.sets + " | Days: " + f.days + " | Time: " + mins + "min\n\n";
  });

  // Find best (most sets)
  const best = found.reduce((a,b) => (b.sets > a.sets ? b : a), found[0]);
  msg += "Best record: " + best.key + " (" + best.sets + " sets)\n\n";
  msg += "Tap OK to RESTORE from " + best.key + " and save as current version.";

  if(confirm(msg)) {
    try {
      const raw = localStorage.getItem(best.key);
      const sv  = JSON.parse(raw);
      const d   = sv.data || sv;
      const c   = sv.cfg  || {};

      // Load into current data
      Object.assign(cfg,  c);
      Object.assign(data, d);

      // Normalise history
      Object.keys(data.history).forEach(k => {
        const v = data.history[k];
        if(typeof v === "number") data.history[k] = {sets:v,timeMs:0,goal:0};
        if(!data.history[k].timeMs) data.history[k].timeMs = 0;
        if(!data.history[k].goal)   data.history[k].goal   = 0;
      });

      // Save under current key
      localStorage.setItem(KEY, JSON.stringify({cfg, data}));
      alert("Restored! Sets: " + data.totalAllTime + " | History days: " + Object.keys(data.history).length);
      location.reload();
    } catch(e) {
      alert("Restore failed: " + e.message);
    }
  }
}

/* ── Init ────────────────────────────────────────────────────── */
loadAll();
saveAll();
render();
updateClockDisplay();
scheduleRollover();   // schedule goal update at 4:01 AM
scheduleAlarm();      // schedule 5 AM alarm
checkMorningGreeting(); // greet if user opens app near alarm time
