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
const KEY  = "surya-v19";

/* ── Config ─────────────────────────────────────────────────── */
let cfg = {
  programName   : "Vaibhav's SuryaNamskara Challenge 108",
  dailyIncrease : 4,
  maxSets       : 108,
  breakEvery    : 12,
  voiceOn       : true,
  mantrasOn     : true,
  breathOn      : true,
  autoOn        : true,
  poseSeconds   : 5,
  graceSeconds  : 5,
  chartDays     : 21,   // history window: 7 / 14 / 21
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
  // Save a manual goal for today; tomorrow it auto-adds dailyIncrease on top
  data.baseGoal = Math.max(1, Math.min(n, cfg.maxSets));
  data.goalDate = todayKey();
  // Align programDay so auto-formula gives the right number next day:
  // next day goal = (programDay+1)*dailyIncrease
  // we want that = data.baseGoal + dailyIncrease
  // so programDay = data.baseGoal / dailyIncrease (rounded)
  data.programDay = Math.max(1, Math.round(data.baseGoal / cfg.dailyIncrease));
  saveAll();
}

/* ── Persist ─────────────────────────────────────────────────── */
function loadAll() {
  const OLD_KEYS = [
    "surya-v15","surya-v14","surya-v13","surya-v12","surya-v11",
    "surya-v10","surya-v9","surya-v8","surya-v7","surya-v6",
    "surya-v5","surya-v4","surya-v3","surya-v2","surya-v1"
  ];
  try {
    // Find best available saved data (current key first, then older)
    let raw = localStorage.getItem(KEY);
    let migratedFrom = null;
    if(!raw) {
      for(const ok of OLD_KEYS) {
        const oldRaw = localStorage.getItem(ok);
        if(oldRaw) { raw = oldRaw; migratedFrom = ok; break; }
      }
    }

    if(raw) {
      const sv = JSON.parse(raw);

      // Handle TWO old save formats:
      // Format A (v3-v5): { history:{}, totalAllTime:0, programDay:1, lastDate:"" }  (flat)
      // Format B (v6+):   { cfg:{...}, data:{...} }  (nested)
      if(sv.data && typeof sv.data === "object") {
        // Format B — nested
        Object.assign(cfg,  sv.cfg  || {});
        Object.assign(data, sv.data || {});
      } else if(sv.history) {
        // Format A — flat root
        data.history      = sv.history      || {};
        data.totalAllTime = sv.totalAllTime || 0;
        data.totalTimeMs  = sv.totalTimeMs  || 0;
        data.programDay   = sv.programDay   || 1;
        data.lastDate     = sv.lastDate     || "";
        data.baseGoal     = sv.baseGoal     || 0;
        data.goalDate     = sv.goalDate     || "";
        data.lastGoal     = sv.lastGoal     || 0;
      }

      // Migrate old history entries: plain number → object
      Object.keys(data.history).forEach(k => {
        const v = data.history[k];
        if(typeof v === "number") data.history[k] = { sets: v, timeMs: 0, goal: 0 };
        if(!data.history[k].timeMs) data.history[k].timeMs = 0;
        if(!data.history[k].goal)   data.history[k].goal   = 0;
      });

      // Recompute totalAllTime from history if it looks wrong (0 but history has data)
      const histTotal = Object.values(data.history).reduce((s,r)=> s+(r.sets||0), 0);
      if(histTotal > 0 && data.totalAllTime === 0) {
        data.totalAllTime = histTotal;
        console.log("Recomputed totalAllTime from history:", histTotal);
      }
      // Recompute totalTimeMs from history if missing
      const histTime = Object.values(data.history).reduce((s,r)=> s+(r.timeMs||0), 0);
      if(histTime > 0 && data.totalTimeMs === 0) {
        data.totalTimeMs = histTime;
        console.log("Recomputed totalTimeMs from history:", histTime);
      }

      if(migratedFrom) {
        console.log("Migrated data from", migratedFrom,
          "| sets:", data.totalAllTime, "| timeMs:", data.totalTimeMs);
        // Save under new key immediately so next load is fast
        try { localStorage.setItem(KEY, JSON.stringify({cfg, data})); } catch(e){}
      }
    }
  } catch(e) { console.error("loadAll error:", e); }

  const today = todayKey();
  if(data.lastDate && data.lastDate !== today) {
    data.programDay = (data.programDay||1) + 1;
    const yRec = data.history[data.lastDate];
    if(yRec && yRec.goal) data.lastGoal = yRec.goal;
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
  // Queue: Om (Sanskrit) → "Round N" (English) — played back-to-back
  setTimeout(()=>{
    qClear();                           // cancel any leftover pose speech
    qSpeak(makeMantraUtt("ॐ"));
    qSpeak(makeEnUtt("Round " + done));
  }, 300);

  // Break reminder
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
              + "Today total: " + todaySets + " rounds. "
              + "All time total: " + totalSets + " rounds. Well done!";
    setTimeout(()=>speakText(msg), 800);
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
document.getElementById("break-ok").addEventListener("click",()=>{
  document.getElementById("break-ov").classList.remove("show");
  // Reset session timer for next block
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
  document.getElementById("prog-name").textContent = cfg.programName;
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
  // Defer until DOM has painted so clientWidth is real
  requestAnimationFrame(() => _drawChart());
}

function _drawChart() {
  const wrap = document.getElementById("chart-wrap");
  if(!wrap) return;
  wrap.innerHTML = "";

  const N    = cfg.chartDays || 21;
  const mode = cfg.chartMode || "bar";
  const tk   = todayKey();

  // Build data points oldest → newest
  const pts = [];
  for(let i=N-1; i>=0; i--) {
    const d   = dayKey(i);
    const rec = data.history[d] || {};
    const sets = typeof rec === "number" ? rec : (rec.sets || 0);
    const goal = d === tk ? todayGoal() : (typeof rec === "number" ? 0 : (rec.goal || 0));
    const incomplete = d === tk && sets < goal && goal > 0;
    pts.push({ d, sets, goal, isToday: d===tk, incomplete });
  }

  // Scale: base on max of either sets or goal so bars are proportional
  const maxVal = Math.max(1, ...pts.map(p => Math.max(p.sets, p.goal)));

  // ── COLORS ──────────────────────────────────────────────────
  const C_GOAL_PAST  = "#1E3D28";   // past day goal bar (dark green)
  const C_SETS_PAST  = "#5DE0A8";   // past day sets bar (light green)
  const C_GOAL_TODAY = "#0F6E56";   // today goal bar (mid green)
  const C_SETS_TODAY = "#1DB87F";   // today sets bar (bright green)
  const C_INCOMPLETE = "#E8A030";   // today incomplete remaining (amber)
  const C_EMPTY      = "#1A2820";   // no data
  const C_TEXT_TODAY = "#5DE0A8";
  const C_TEXT_PAST  = "#5A7065";
  const C_TEXT_MUTED = "#3A5040";

  const CH = 100; // chart column height in px

  // Width — use offsetWidth (reliable after rAF)
  const PW   = wrap.offsetWidth || 320;
  const GAP  = N > 14 ? 2 : 3;
  const colW = Math.max(10, Math.floor((PW - GAP*(N-1)) / N));

  // ════════════════════════════════════════════════════════════
  // BAR chart
  // ════════════════════════════════════════════════════════════
  if(mode === "bar") {
    const LABEL_H = 30;  // space above bar for numbers
    const DATE_H  = 22;  // space below bar for date
    const TOTAL_H = CH + LABEL_H + DATE_H;

    const flex = document.createElement("div");
    flex.style.cssText = [
      "display:flex", "gap:"+GAP+"px", "width:100%",
      "height:"+TOTAL_H+"px", "overflow-x:auto", "align-items:flex-end",
    ].join(";");

    pts.forEach(p => {
      const col = document.createElement("div");
      col.style.cssText = [
        "flex:0 0 "+colW+"px",
        "display:flex", "flex-direction:column",
        "align-items:center", "height:"+TOTAL_H+"px",
        "position:relative",
      ].join(";");

      // ── Label area (top LABEL_H px) ──
      const labelArea = document.createElement("div");
      labelArea.style.cssText = [
        "height:"+LABEL_H+"px", "display:flex",
        "flex-direction:column", "align-items:center",
        "justify-content:flex-end", "gap:1px", "width:100%",
      ].join(";");

      if(p.sets > 0 || p.goal > 0) {
        // Sets count (top)
        const sLbl = document.createElement("div");
        sLbl.style.cssText = "font-size:"+(N>14?"8":"9")+"px;font-weight:700;color:"+
          (p.isToday ? C_TEXT_TODAY : C_SETS_PAST)+";line-height:1.1;text-align:center";
        if(p.sets > 0) sLbl.textContent = p.sets;
        labelArea.appendChild(sLbl);

        // Goal count (below sets)
        if(p.goal > 0) {
          const gLbl = document.createElement("div");
          gLbl.style.cssText = "font-size:7px;color:"+C_TEXT_MUTED+";line-height:1;text-align:center";
          gLbl.textContent = "/"+p.goal;
          labelArea.appendChild(gLbl);
        }
      }
      col.appendChild(labelArea);

      // ── Bar area ──────────────────────────────────────────
      // We draw a stacked bar: [sets done] + [remaining to goal if incomplete]
      const barWrap = document.createElement("div");
      barWrap.style.cssText = [
        "width:100%", "height:"+CH+"px",
        "display:flex", "flex-direction:column",
        "justify-content:flex-end", "align-items:center",
        "gap:0", "position:relative",
      ].join(";");

      if(p.goal > 0) {
        // Ghost bar = full goal height (background)
        const goalH = Math.round((p.goal / maxVal) * CH);
        const ghostBar = document.createElement("div");
        ghostBar.style.cssText = [
          "position:absolute", "bottom:0", "width:100%",
          "height:"+goalH+"px",
          "background:"+(p.isToday ? C_GOAL_TODAY : C_GOAL_PAST),
          "border-radius:3px 3px 2px 2px",
        ].join(";");
        barWrap.appendChild(ghostBar);

        // If incomplete today — amber top portion (remaining)
        if(p.incomplete) {
          const remH = Math.round(((p.goal - p.sets) / maxVal) * CH);
          const remBar = document.createElement("div");
          remBar.style.cssText = [
            "position:absolute", "bottom:"+(goalH - remH)+"px", "width:100%",
            "height:"+remH+"px",
            "background:"+C_INCOMPLETE,
            "border-radius:3px 3px 0 0",
            "opacity:0.85",
            "animation:incompletePulse 1.5s ease-in-out infinite",
          ].join(";");
          barWrap.appendChild(remBar);
        }

        // Sets done bar (foreground, on top of ghost)
        if(p.sets > 0) {
          const setsH = Math.round((p.sets / maxVal) * CH);
          const setsBar = document.createElement("div");
          setsBar.style.cssText = [
            "position:absolute", "bottom:0", "width:100%",
            "height:"+setsH+"px",
            "background:"+(p.isToday ? C_SETS_TODAY : C_SETS_PAST),
            "border-radius:3px 3px 2px 2px",
          ].join(";");
          barWrap.appendChild(setsBar);
        }
      } else if(p.sets > 0) {
        // No goal stored (old data) — just show sets bar
        const setsH = Math.max(6, Math.round((p.sets / maxVal) * CH));
        const setsBar = document.createElement("div");
        setsBar.style.cssText = [
          "position:absolute", "bottom:0", "width:100%",
          "height:"+setsH+"px",
          "background:"+C_SETS_PAST,
          "border-radius:3px 3px 2px 2px",
        ].join(";");
        barWrap.appendChild(setsBar);
      } else {
        // Empty day — thin line
        const emptyBar = document.createElement("div");
        emptyBar.style.cssText = [
          "position:absolute", "bottom:0", "width:100%",
          "height:3px", "background:"+C_EMPTY,
          "border-radius:2px",
        ].join(";");
        barWrap.appendChild(emptyBar);
      }

      col.appendChild(barWrap);

      // ── Date label ─────────────────────────────────────────
      const dt  = new Date(p.d + "T00:00:00");
      const lbl = document.createElement("div");
      lbl.style.cssText = [
        "font-size:"+(N>14?"7":"8")+"px",
        "text-align:center", "margin-top:4px",
        "color:"+(p.isToday ? C_TEXT_TODAY : C_TEXT_PAST),
        "height:"+(DATE_H-4)+"px", "line-height:1.2",
        "display:flex", "flex-direction:column", "align-items:center",
      ].join(";");

      const skip = N > 14 ? 3 : 1;
      const idx  = pts.indexOf(p);
      if(idx % skip === 0 || p.isToday) {
        lbl.innerHTML = dt.toLocaleDateString(undefined,{month:"numeric",day:"numeric"});
      }
      col.appendChild(lbl);
      flex.appendChild(col);
    });

    wrap.appendChild(flex);
    return;
  }

  // ════════════════════════════════════════════════════════════
  // LINE chart (SVG)
  // ════════════════════════════════════════════════════════════
  const SVG_H  = CH + 55;
  const SVG_W  = colW * N + GAP * (N-1);
  const svg    = document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("width",  Math.max(SVG_W, PW));
  svg.setAttribute("height", SVG_H);
  svg.style.display = "block";
  svg.style.overflow = "visible";

  const xOf = i  => Math.round(i * (colW + GAP) + colW/2);
  const yOf = v  => Math.round(CH - (v / maxVal) * (CH - 12) + 6);

  // Grid lines
  [0.25,0.5,0.75,1].forEach(f => {
    const gy = yOf(maxVal * f);
    const gl = document.createElementNS("http://www.w3.org/2000/svg","line");
    gl.setAttribute("x1",0); gl.setAttribute("x2",Math.max(SVG_W,PW));
    gl.setAttribute("y1",gy); gl.setAttribute("y2",gy);
    gl.setAttribute("stroke","#1E3028"); gl.setAttribute("stroke-width","1");
    svg.appendChild(gl);
    // Grid value label
    const gv = document.createElementNS("http://www.w3.org/2000/svg","text");
    gv.setAttribute("x",2); gv.setAttribute("y",gy-2);
    gv.setAttribute("fill","#3A5040"); gv.setAttribute("font-size","7");
    gv.textContent = Math.round(maxVal * f);
    svg.appendChild(gv);
  });

  // Goal line (dashed)
  const goalPts = pts.map((p,i)=>p.goal>0?`${xOf(i)},${yOf(p.goal)}`:null).filter(Boolean);
  if(goalPts.length > 1) {
    const gl = document.createElementNS("http://www.w3.org/2000/svg","polyline");
    gl.setAttribute("points", goalPts.join(" "));
    gl.setAttribute("fill","none");
    gl.setAttribute("stroke",C_GOAL_TODAY);
    gl.setAttribute("stroke-width","1.5");
    gl.setAttribute("stroke-dasharray","4,3");
    svg.appendChild(gl);
  }

  // Sets line (solid)
  const setsPts = pts.filter(p=>p.sets>0).map((p,i)=>{
    const ri = pts.indexOf(p);
    return `${xOf(ri)},${yOf(p.sets)}`;
  });
  if(setsPts.length > 1) {
    const sl = document.createElementNS("http://www.w3.org/2000/svg","polyline");
    sl.setAttribute("points", setsPts.join(" "));
    sl.setAttribute("fill","none");
    sl.setAttribute("stroke","#1DB87F");
    sl.setAttribute("stroke-width","2");
    sl.setAttribute("stroke-linejoin","round");
    sl.setAttribute("stroke-linecap","round");
    svg.appendChild(sl);
  }

  // Dots + labels + date
  pts.forEach((p, i) => {
    const cx = xOf(i);

    // Goal dot (small, dim)
    if(p.goal > 0) {
      const gc = document.createElementNS("http://www.w3.org/2000/svg","circle");
      gc.setAttribute("cx",cx); gc.setAttribute("cy",yOf(p.goal));
      gc.setAttribute("r","2"); gc.setAttribute("fill",C_GOAL_TODAY);
      svg.appendChild(gc);
    }

    // Sets dot
    const col = p.incomplete ? C_INCOMPLETE : (p.isToday ? C_SETS_TODAY : (p.sets>0 ? C_SETS_PAST : C_EMPTY));
    const sc = document.createElementNS("http://www.w3.org/2000/svg","circle");
    sc.setAttribute("cx",cx); sc.setAttribute("cy",p.sets>0?yOf(p.sets):yOf(0));
    sc.setAttribute("r", p.isToday ? "5" : "3.5");
    sc.setAttribute("fill", col);
    svg.appendChild(sc);

    // Value label
    if(p.sets > 0) {
      const vt = document.createElementNS("http://www.w3.org/2000/svg","text");
      vt.setAttribute("x",cx); vt.setAttribute("y",yOf(p.sets)-7);
      vt.setAttribute("text-anchor","middle");
      vt.setAttribute("fill", p.isToday ? C_TEXT_TODAY : C_TEXT_PAST);
      vt.setAttribute("font-size","8"); vt.setAttribute("font-weight","700");
      vt.textContent = p.sets+(p.goal>0?"/"+p.goal:"");
      svg.appendChild(vt);
    }

    // Date label (every Nth)
    const skip = N > 14 ? 3 : 2;
    if(i % skip === 0 || p.isToday) {
      const dt = new Date(p.d+"T00:00:00");
      const dl = document.createElementNS("http://www.w3.org/2000/svg","text");
      dl.setAttribute("x",cx); dl.setAttribute("y",CH+20);
      dl.setAttribute("text-anchor","middle");
      dl.setAttribute("fill", p.isToday ? C_TEXT_TODAY : C_TEXT_PAST);
      dl.setAttribute("font-size","8");
      dl.textContent = dt.toLocaleDateString(undefined,{month:"numeric",day:"numeric"});
      svg.appendChild(dl);
    }
  });

  // Legend
  const mkLegend = (x,y,col,label) => {
    const r = document.createElementNS("http://www.w3.org/2000/svg","rect");
    r.setAttribute("x",x); r.setAttribute("y",y-6);
    r.setAttribute("width",10); r.setAttribute("height",6);
    r.setAttribute("rx","2"); r.setAttribute("fill",col);
    svg.appendChild(r);
    const t = document.createElementNS("http://www.w3.org/2000/svg","text");
    t.setAttribute("x",x+13); t.setAttribute("y",y);
    t.setAttribute("fill","#5A7065"); t.setAttribute("font-size","8");
    t.textContent = label;
    svg.appendChild(t);
  };
  mkLegend(4, CH+38, "#1DB87F", "Sets done");
  mkLegend(80, CH+38, C_GOAL_TODAY, "Daily goal");
  mkLegend(156, CH+38, C_INCOMPLETE, "Remaining");

  const scroller = document.createElement("div");
  scroller.style.cssText = "overflow-x:auto;width:100%";
  scroller.appendChild(svg);
  wrap.appendChild(scroller);
}


/* ── Controls ────────────────────────────────────────────────── */
document.getElementById("main-btn").addEventListener("click", handleMainBtn);
document.getElementById("reset-btn").addEventListener("click", resetSession);

document.getElementById("voice-btn").addEventListener("click",()=>{
  voiceMuted=!voiceMuted; cfg.voiceOn=!voiceMuted;
  saveAll(); render();
  if(!voiceMuted) { qClear(); speakMantra("ॐ"); } else { qClear(); }
});

// CHART TAB BUTTONS
document.querySelectorAll(".chart-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    cfg.chartMode = btn.dataset.mode;
    document.querySelectorAll(".chart-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("chart-title").textContent = "Last "+(cfg.chartDays||21)+" days";
    saveAll();
    renderBars();
  });
});

// CHART DAYS — update title when changed in settings
function syncChartUI() {
  const mode = cfg.chartMode || "bar";
  document.querySelectorAll(".chart-tab").forEach(b => {
    b.classList.toggle("active", b.dataset.mode === mode);
  });
  const t = document.getElementById("chart-title");
  if(t) t.textContent = "Last "+(cfg.chartDays||21)+" days";
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
  document.getElementById("cfg-name").value     = cfg.programName;
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
  document.getElementById("cfg-voice-info").textContent =
    hiVoice ? "Active: "+hiVoice.name+" ("+hiVoice.lang+")"
            : "No hi-IN voice — install Hindi TTS in Android Settings → Language → Text-to-speech.";
  document.getElementById("dr").classList.add("show");
}
function closeSettings() {
  cfg.programName   = document.getElementById("cfg-name").value.trim() || cfg.programName;
  cfg.dailyIncrease = parseInt(document.getElementById("cfg-inc").value) || 4;
  const newGoal = parseInt(document.getElementById("cfg-goal").value) || 0;
  if(newGoal > 0) setTodayGoal(newGoal);  // always anchor programDay when user sets a goal
  cfg.maxSets       = parseInt(document.getElementById("cfg-max").value)   ||108;
  cfg.breakEvery    = parseInt(document.getElementById("cfg-brk").value)   ||12;
  cfg.poseSeconds   = Math.max(2, Math.min(30, parseInt(document.getElementById("cfg-pace").value)||5));
  cfg.graceSeconds  = Math.max(0, Math.min(30, parseInt(document.getElementById("cfg-grace").value)||5));
  const lt=parseInt(document.getElementById("cfg-lifetime").value);
  if(!isNaN(lt)&&lt>=0) data.totalAllTime=lt;
  cfg.voiceOn   = togGet("tog-voice");
  cfg.mantrasOn = togGet("tog-mantras");
  cfg.breathOn  = togGet("tog-breath");
  cfg.autoOn    = togGet("tog-auto");
  voiceMuted    = !cfg.voiceOn;
  cfg.chartDays = parseInt(document.getElementById("cfg-chart-days").value) || 21;
  cfg.chartMode = document.getElementById("cfg-chart-mode").value || "bar";
  saveAll(); render();
  document.getElementById("dr").classList.remove("show");
}
const togSet=(id,on)=>document.getElementById(id).classList.toggle("on",on);
const togGet=id=>document.getElementById(id).classList.contains("on");
["tog-voice","tog-mantras","tog-breath","tog-auto"].forEach(id=>{
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

/* ── Init ────────────────────────────────────────────────────── */
loadAll();
saveAll();
render();
updateClockDisplay();
