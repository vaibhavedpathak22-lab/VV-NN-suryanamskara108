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
const KEY  = "surya-v30";

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
  chartDays     : 7,    // history window: 7 → 14 → 21 (cycles)
  chartMode     : "bar", // "bar" | "line"
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
  lastGoal      : 0,    // goal of last completed day — used for exact +4 calc
  lastRecoveryAt: 0,    // totalAllTime count at which last recovery was triggered
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
  // If a manual goal was set for today, use it
  if(data.baseGoal > 0 && data.goalDate === todayKey())
    return Math.min(data.baseGoal, cfg.maxSets);
  // Use exact last goal + increase (avoids drift on non-multiples of 4)
  if(data.lastGoal > 0)
    return Math.min(data.lastGoal + cfg.dailyIncrease, cfg.maxSets);
  // Fallback for Day 1
  return Math.min(data.programDay * cfg.dailyIncrease, cfg.maxSets);
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
  const OLD_KEYS = [
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
    // ── Step 1: collect every save that exists on this device ──────
    const allRaws = [];
    const curRaw = localStorage.getItem(KEY);
    if(curRaw) allRaws.push({ key:KEY, raw:curRaw });
    for(const ok of OLD_KEYS) {
      const r = localStorage.getItem(ok);
      if(r && r !== curRaw) allRaws.push({ key:ok, raw:r });
    }

    if(allRaws.length > 0) {
      // ── Step 2: parse all saves ─────────────────────────────────
      const parsed = [];
      for(const s of allRaws) {
        try { const p = parseSave(s.raw); if(p) parsed.push({ key:s.key, ...p }); }
        catch(e) { console.warn("Could not parse", s.key, e); }
      }

      if(parsed.length > 0) {
        // ── Step 3: pick best base (most recent programDay / totalAllTime)
        parsed.sort((a,b) => {
          const ad = a.data, bd = b.data;
          if((bd.programDay||0) !== (ad.programDay||0))
            return (bd.programDay||0) - (ad.programDay||0);
          return (bd.totalAllTime||0) - (ad.totalAllTime||0);
        });
        const base = parsed[0];
        Object.assign(cfg,  base.cfg);
        Object.assign(data, base.data);
        // Normalise base history
        Object.keys(data.history).forEach(k => { data.history[k] = normRec(data.history[k]); });

        // ── Step 4: merge history from every other save ──────────
        for(let i = 1; i < parsed.length; i++) {
          mergeHistory(parsed[i].data.history || {});
          // Also take higher totals if somehow this save is more complete
          if((parsed[i].data.totalAllTime||0) > data.totalAllTime)
            data.totalAllTime = parsed[i].data.totalAllTime;
          if((parsed[i].data.totalTimeMs||0) > data.totalTimeMs)
            data.totalTimeMs = parsed[i].data.totalTimeMs;
        }

        // ── Step 5: recompute totals from merged history (most accurate) ─
        const histSets = Object.values(data.history).reduce((s,r)=>s+(r.sets||0),0);
        const histTime = Object.values(data.history).reduce((s,r)=>s+(r.timeMs||0),0);
        if(histSets > 0) data.totalAllTime = Math.max(data.totalAllTime, histSets);
        if(histTime > 0) data.totalTimeMs  = Math.max(data.totalTimeMs,  histTime);

        console.log("Migration complete | sources:", parsed.length,
          "| total sets:", data.totalAllTime,
          "| history days:", Object.keys(data.history).length);

        // ── Step 6: save merged result immediately ───────────────
        try { localStorage.setItem(KEY, JSON.stringify({cfg, data})); } catch(e){}
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
  voiceMuted = !cfg.voiceOn;
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
document.addEventListener('visibilitychange', async () => {
  // Re-acquire wake lock when returning to app during active session
  if (sess.active && !sess.paused && document.visibilityState === 'visible') {
    await acquireWakeLock();
  }
});

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
  data.history[today].goal = todayGoal();
  data.lastGoal = todayGoal();   // keep lastGoal current within the day
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

// Base proportions (add to 100)
const PRANAYAMA_BASE = [
  {
    id:"deep",
    name:"Deep Breathing",
    nameHi:"दीर्घ श्वसन",
    ratio:10,   // 10% of total time
    desc:"Slow deep belly breaths to prepare the body",
    steps:[
      { text:"Sit comfortably with spine erect. Close your eyes.", dur:8 },
      { text:"Breathe in slowly through both nostrils for 4 counts.", dur:6 },
      { text:"Hold the breath gently for 2 counts.", dur:4 },
      { text:"Exhale slowly for 6 counts. Feel the belly fall.", dur:8 },
      { text:"Continue this deep rhythmic breathing.", dur:0 }, // loops
    ],
    inhale:4, hold:2, exhale:6, rounds:-1, // -1 = time-based
  },
  {
    id:"anulom",
    name:"Anulom Vilom",
    nameHi:"अनुलोम विलोम",
    ratio:32,
    desc:"Alternate nostril breathing — balances left and right energy channels",
    steps:[
      { text:"Right hand in Nasagra mudra. Close right nostril with thumb.", dur:6 },
      { text:"Inhale through LEFT nostril for 4 counts.", dur:5 },
      { text:"Close both nostrils. Hold for 2 counts.", dur:4 },
      { text:"Release right nostril. Exhale through RIGHT for 8 counts.", dur:9 },
      { text:"Inhale through RIGHT nostril for 4 counts.", dur:5 },
      { text:"Close both. Hold for 2 counts.", dur:4 },
      { text:"Release left nostril. Exhale through LEFT for 8 counts.", dur:9 },
      { text:"This completes one round. Continue.", dur:0 },
    ],
    inhale:4, hold:2, exhale:8, rounds:-1,
  },
  {
    id:"nadi",
    name:"Nadi Shodhana",
    nameHi:"नाडी शोधन",
    ratio:18,
    desc:"Purification of energy channels — deeper ratio 1:4:2",
    steps:[
      { text:"Nadi Shodhana — extended ratio. Inhale through LEFT for 4 counts.", dur:5 },
      { text:"Retain breath with both nostrils closed for 16 counts.", dur:17 },
      { text:"Exhale through RIGHT nostril for 8 counts.", dur:9 },
      { text:"Inhale RIGHT for 4 counts.", dur:5 },
      { text:"Retain for 16 counts.", dur:17 },
      { text:"Exhale LEFT for 8 counts.", dur:9 },
      { text:"One round complete. Continue gently.", dur:0 },
    ],
    inhale:4, hold:16, exhale:8, rounds:-1,
  },
  {
    id:"kapalabhati",
    name:"Kapalabhati",
    nameHi:"कपालभाती",
    ratio:12,
    desc:"Skull-shining breath — forceful exhales, passive inhales",
    steps:[
      { text:"Sit tall. Take one deep breath in to prepare.", dur:5 },
      { text:"Forceful sharp exhale through nose — pull navel in fast.", dur:3 },
      { text:"Passive inhale — let breath come in naturally.", dur:2 },
      { text:"Continue at a steady rhythmic pace — one stroke per second.", dur:0 },
      { text:"After 30 strokes, take a deep breath and retain briefly.", dur:8 },
      { text:"Exhale slowly. Rest. Begin next round when ready.", dur:6 },
    ],
    rounds:3, strokesPerRound:30, // 3 rounds of 30 strokes
  },
  {
    id:"bhramari",
    name:"Bhramari",
    nameHi:"भ्रामरी",
    ratio:15,
    desc:"Humming bee breath — calms the nervous system",
    steps:[
      { text:"Close ears with thumbs, eyes with index fingers gently.", dur:6 },
      { text:"Take a deep inhale through both nostrils.", dur:5 },
      { text:"On exhale, make a soft humming sound — like a bee. Mmmmm.", dur:8 },
      { text:"Feel the vibration in your skull and chest.", dur:5 },
      { text:"Inhale again and repeat the humming exhale.", dur:0 },
    ],
    rounds:5,
  },
  {
    id:"meditation",
    name:"Quiet Meditation",
    nameHi:"ध्यान",
    ratio:13,
    desc:"Silent awareness — let breath flow naturally",
    steps:[
      { text:"Release all techniques. Rest your hands on your knees.", dur:6 },
      { text:"Observe the natural breath without controlling it.", dur:8 },
      { text:"If thoughts arise, gently return attention to the breath.", dur:8 },
      { text:"Rest in pure awareness. You are the witness.", dur:0 },
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
  pranaState.phaseDurs  = computePhaseDurations(cfg.pranayamaMinutes || 20);
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
  const totalMin = cfg.pranayamaMinutes || 20;
  document.getElementById("prana-title").textContent  = phase.name;
  document.getElementById("prana-title-hi").textContent = phase.nameHi;
  document.getElementById("prana-desc").textContent   = phase.desc;
  document.getElementById("prana-phase-num").textContent =
    "Practice " + (pranaState.phaseIdx+1) + " of " + PRANAYAMA_BASE.length;

  // Phase progress bar reset
  document.getElementById("prana-phase-bar").style.width = "0%";

  speakText(phase.name + ". " + phase.desc, 200);
  setTimeout(()=>startPranaStep(), 2000);
  startPranaClocks();
}

function startPranaStep() {
  if(!pranaState.active || pranaState.paused) return;
  clearPranaTimers();

  const phase    = PRANAYAMA_BASE[pranaState.phaseIdx];
  const steps    = phase.steps;
  const stepIdx  = pranaState.stepIdx;
  const step     = steps[stepIdx];
  const phaseDur = pranaState.phaseDurs[pranaState.phaseIdx];

  // Update UI
  document.getElementById("prana-step").textContent  = step.text;
  document.getElementById("prana-step-num").textContent =
    "Step " + (stepIdx+1) + " / " + steps.length;

  // Speak the instruction
  speakText(step.text);

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
    const totalMs   = (cfg.pranayamaMinutes||20) * 60000;
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
  speakText("Excellent. Now we begin " + PRANAYAMA_BASE[pranaState.phaseIdx].name + ".", 300);
  setTimeout(()=>startPranaPhase(), 2500);
}

function endPranayama() {
  clearPranaTimers();
  pranaState.active = false;
  releaseWakeLock();
  speakText(
    "Pranayama complete. Sit quietly for a moment. " +
    "Feel the stillness within. Namaste. Om Shanti Shanti Shanti.",
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
  document.getElementById("cfg-prana-min").value  = cfg.pranayamaMinutes || 20;
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
  cfg.pranayamaMinutes = parseInt(document.getElementById("cfg-prana-min").value)||20;
  cfg.alarmOn          = togGet("tog-alarm");
  const aTime = document.getElementById("cfg-alarm-time").value || "05:00";
  const [aH, aM] = aTime.split(":").map(Number);
  cfg.alarmHour   = isNaN(aH) ? 5  : aH;
  cfg.alarmMinute = isNaN(aM) ? 0  : aM;
  voiceMuted      = !cfg.voiceOn;
  scheduleAlarm();   // reschedule with new time immediately
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

/* ── Midnight rollover — runs every 60 sec while app is open ── */
let _lastCheckedDate = todayKey();

function checkDayRollover() {
  const now = todayKey();
  if(now !== _lastCheckedDate) {
    console.log("Day changed:", _lastCheckedDate, "→", now);
    _lastCheckedDate = now;

    // Run the day-advance logic (same as loadAll does on open)
    const last = new Date(data.lastDate + "T00:00:00");
    const cur  = new Date(now          + "T00:00:00");
    const daysMissed = Math.max(1, Math.round((cur - last) / 86400000));

    data.programDay = (data.programDay||1) + daysMissed;

    // Fill skipped days in history
    for(let d = 1; d < daysMissed; d++) {
      const skipDate = new Date(last.getTime() + d * 86400000)
        .toISOString().slice(0, 10);
      if(!data.history[skipDate]) {
        const skipGoal = Math.min(
          (data.lastGoal||0) + d * cfg.dailyIncrease,
          cfg.maxSets
        );
        data.history[skipDate] = { sets:0, timeMs:0, goal:skipGoal };
      }
    }

    // Save lastGoal: manual baseGoal takes priority over history walk
    if(data.baseGoal > 0 && data.goalDate === data.lastDate) {
      data.lastGoal = data.baseGoal;   // e.g. set 12 today → tomorrow = 16
    } else {
      for(let d = 1; d <= daysMissed + 1; d++) {
        const check = new Date(cur.getTime() - d * 86400000)
          .toISOString().slice(0, 10);
        const rec = data.history[check];
        if(rec && rec.goal) { data.lastGoal = rec.goal; break; }
      }
    }

    // Clear manual override — tomorrow auto = lastGoal + 4
    data.baseGoal = 0;
    data.goalDate = "";
    data.lastDate = now;

    saveAll();
    render();  // re-render with new goal immediately

    // Announce new day's goal via voice
    const newGoal = todayGoal();
    setTimeout(()=>speakText(
      "Good morning! New day target is " + newGoal + " rounds. Om."
    ), 1000);
  }
}

// Re-check ONLY when user opens / returns to the app — zero battery drain
document.addEventListener("visibilitychange", ()=>{
  if(document.visibilityState === "visible") checkDayRollover();
});
// No setInterval — visibilitychange + midnight setTimeout covers everything

// Schedule exact midnight trigger
function scheduleMidnight() {
  const now  = new Date();
  const msToMidnight =
    new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0, 0, 5)
      .getTime() - now.getTime();   // 5 sec after midnight for safety
  setTimeout(()=>{
    checkDayRollover();
    scheduleMidnight();   // reschedule for next midnight
  }, msToMidnight);
  console.log("Next midnight rollover in", Math.round(msToMidnight/60000), "minutes");
}


/* ═══════════════════════════════════════════════════════════════
   DAILY ALARM — motivational notification at user-set time
   Uses Web Notifications + setTimeout (no service worker push needed)
═══════════════════════════════════════════════════════════════ */

let alarmTimeout = null;

async function requestNotificationPermission() {
  if(!("Notification" in window)) return false;
  if(Notification.permission === "granted") return true;
  if(Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function msUntilAlarm(hour, minute) {
  const now  = new Date();
  const next = new Date(
    now.getFullYear(), now.getMonth(), now.getDate(),
    hour, minute, 0, 0
  );
  // If alarm time already passed today, schedule for tomorrow
  if(next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

function fmtAlarmTime(h, m) {
  const ampm = h >= 12 ? "PM" : "AM";
  const hh   = h % 12 || 12;
  const mm   = String(m).padStart(2, "0");
  return hh + ":" + mm + " " + ampm;
}

function fireAlarm() {
  if(!cfg.alarmOn) { scheduleAlarm(); return; }

  const goal = todayGoal();
  const done = todayDone();
  const rem  = Math.max(0, goal - done);

  // Motivational messages rotation
  const msgs = [
    "🌅 ॐ सूर्यनमस्कार! Rise and shine, Vaibhav! Today's target: " + goal + " rounds.",
    "☀️ Surya awaits! " + goal + " rounds today. You've done " + done + " already. " + rem + " to go!",
    "🙏 वैभव — सूर्यसारथी! Time for your " + goal + " Surya Namaskara rounds.",
    "🌞 ॐ मित्राय नमः! Start strong today — " + goal + " rounds await you.",
    "💪 Good morning! Your mat is waiting. " + goal + " rounds, one breath at a time.",
  ];
  const msg = msgs[Math.floor(Math.random() * msgs.length)];

  // Show notification if permission granted
  if(Notification.permission === "granted") {
    try {
      const n = new Notification("वैभव - सूर्यसारथी.१ॐ८", {
        body   : msg,
        icon   : "./icon-192.png",
        badge  : "./icon-192.png",
        tag    : "surya-alarm",          // replaces previous alarm notif
        renotify: true,
        vibrate: [200, 100, 200, 100, 400],
        silent : false,
      });
      n.onclick = () => { window.focus(); n.close(); };
    } catch(e) { console.warn("Notification failed:", e); }
  }

  // Also speak motivational message if app is visible
  if(document.visibilityState === "visible") {
    setTimeout(()=>speakText(
      "Good morning Vaibhav! Time for Surya Namaskara. Today's target is " +
      goal + " rounds. Om Mitraya Namaha."
    ), 500);
  }

  // Schedule next day's alarm
  scheduleAlarm();
}

function scheduleAlarm() {
  if(alarmTimeout) { clearTimeout(alarmTimeout); alarmTimeout = null; }
  if(!cfg.alarmOn) return;

  const ms = msUntilAlarm(cfg.alarmHour || 5, cfg.alarmMinute || 0);
  alarmTimeout = setTimeout(fireAlarm, ms);
  console.log("Alarm set for", fmtAlarmTime(cfg.alarmHour, cfg.alarmMinute),
    "— in", Math.round(ms/60000), "minutes");
}

function cancelAlarm() {
  if(alarmTimeout) { clearTimeout(alarmTimeout); alarmTimeout = null; }
}

/* ── Init ────────────────────────────────────────────────────── */
loadAll();
saveAll();
render();
updateClockDisplay();
scheduleMidnight();   // set exact midnight alarm
scheduleAlarm();      // set daily morning alarm
