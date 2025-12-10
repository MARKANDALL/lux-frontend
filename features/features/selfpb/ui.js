// features/features/selfpb/ui.js
// UI: styles + panel DOM + wiring to the core
// UPDATED: Light Theme, Unified Play, Smart Loop Button, Error Toast

import { initSelfPBCore } from "./core.js";

function ensureStyles() {
  const STYLE_ID = "selfpb-lite-style";
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    /* Light Theme + Layout Styles */
    #selfpb-lite{position:fixed;top:12px;left:12px;z-index:9999;border-radius:14px;padding:10px 12px;font:600 14px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25)}
    #selfpb-lite .row{display:flex;align-items:center;gap:8px}
    #selfpb-lite .btn{padding:6px 10px;border-radius:8px;border:0;background:#2d6cdf;color:#fff;cursor:pointer;transition:background 0.15s, transform 0.1s;}
    #selfpb-lite .btn:hover{filter:brightness(1.1);}
    #selfpb-lite .btn:active{transform:scale(0.96);}
    #selfpb-lite .btn[disabled]{opacity:.5;cursor:not-allowed}
    #selfpb-lite .pill{border-radius:999px;padding:6px 10px}
    #selfpb-lite .meta{opacity:.85}
    #selfpb-lite input[type="range"]{accent-color:#2d6cdf}
    #selfpb-lite .ab{display:flex;gap:6px;position:relative;} /* Relative for floating tip */
    #selfpb-lite .tiny{font-weight:700;opacity:.8}
    #selfpb-lite .scrub{flex:1;min-width:180px}
    #selfpb-lite .spacer{flex:1}
    
    /* Specific Button Tweaks */
    #spb-main { width: 140px; font-weight: 800; font-size: 1.05em; }
    #spb-loop-action { min-width: 100px; background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
    #spb-loop-action.active { background: #4338ca; color: #fff; border-color: #312e81; }

    /* Floating "Coach Mark" Bubble */
    .spb-bubble {
        position: absolute;
        top: -38px;
        left: 0;
        background: rgba(0,0,0,0.85);
        color: #fff;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 11px;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.4s;
    }
    .spb-bubble.visible { opacity: 1; }
    .spb-bubble::after {
        content: ''; position: absolute; bottom: -4px; left: 16px;
        border-left: 4px solid transparent; border-right: 4px solid transparent;
        border-top: 4px solid rgba(0,0,0,0.85);
    }
  `;
  document.head.appendChild(s);
}

function buildUI() {
  const host = document.createElement("div");
  host.id = "selfpb-lite";
  host.innerHTML = `
    <div class="row" style="margin-bottom:6px; position:relative;">
      <span class="meta">👂 Self Playback</span>
      
      <span id="spb-toast" class="pill tiny" style="
          display:none; position:absolute; right:0; top:0; 
          background:#ef4444; border-color:#b91c1c; color:#fff;
          z-index:10; box-shadow: 0 2px 10px rgba(0,0,0,0.5);
      "></span>

      <div class="spacer"></div>
      <span class="pill tiny" id="spb-ref">Ref: —</span>
      <span class="pill tiny" id="spb-time">0:00 / 0:00</span>
    </div>

    <div class="row" style="margin-bottom:6px">
      <button class="btn" id="spb-back">−5s</button>
      <input id="spb-scrub" class="scrub" type="range" min="0" max="1000" step="1" value="0" title="Seek">
      <button class="btn" id="spb-fwd">+5s</button>
    </div>

    <div class="row" style="margin-bottom:8px">
      <button class="btn" id="spb-main">▶ Play</button>

      <div class="pill" title="Playback speed">
        <span class="tiny">Speed</span>
        <input id="spb-rate" type="range" min="0.5" max="1.5" step="0.05" value="1" style="vertical-align:middle;width:120px;margin-left:8px">
        <span class="tiny" id="spb-rate-val">1.00×</span>
      </div>
    </div>

    <div class="row">
      <div class="pill ab" style="flex:1;">
        <div id="spb-loop-tip" class="spb-bubble">
           Tap <b>A</b> then <b>B</b> to loop. Double-tap to clear.
        </div>

        <button class="btn" id="spb-loop-action">⟳ Set Loop A</button>
        
        <span class="tiny" id="spb-ab-label" style="margin-left:12px; color:#666;">Loop: Off</span>
      </div>
    </div>
  `;
  document.body.appendChild(host);
  return {
    host,
    toast: host.querySelector("#spb-toast"),
    mainBtn: host.querySelector("#spb-main"),
    backBtn: host.querySelector("#spb-back"),
    fwdBtn: host.querySelector("#spb-fwd"),
    scrub: host.querySelector("#spb-scrub"),
    rate: host.querySelector("#spb-rate"),
    rateVal: host.querySelector("#spb-rate-val"),
    timeLab: host.querySelector("#spb-time"),
    
    // Updated Loop Elements
    loopAction: host.querySelector("#spb-loop-action"),
    loopTip: host.querySelector("#spb-loop-tip"),
    abLabel: host.querySelector("#spb-ab-label"),
    refLabel: host.querySelector("#spb-ref"),
  };
}

export function mountSelfPlaybackLite() {
  const { api, audio, refAudio, st } = initSelfPBCore();
  ensureStyles();
  const ui = buildUI();

  // --- Helper: Toast ---
  const showToast = (msg, duration = 2000) => {
    ui.toast.textContent = msg;
    ui.toast.style.display = "inline-block";
    ui.host.animate([
      { transform: 'translateX(0)' }, { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }
    ], { duration: 200 });
    setTimeout(() => { ui.toast.style.display = "none"; }, duration);
  };

  // --- Helper: Hint Bubble ---
  const showLoopHint = () => {
    ui.loopTip.classList.add("visible");
    setTimeout(() => ui.loopTip.classList.remove("visible"), 4000);
  };

  // --- Sync UI ---
  const syncButtons = () => {
    // 1. Play Button
    ui.mainBtn.textContent = st.playing ? "⏸ Pause" : "▶ Play";

    // 2. Loop Button State
    if (st.a == null) {
        ui.loopAction.textContent = "⟳ Set Loop A";
        ui.loopAction.classList.remove("active");
        ui.abLabel.textContent = "Loop: Off";
    } else if (st.b == null) {
        ui.loopAction.textContent = "⟳ Set Loop B";
        ui.loopAction.classList.add("active");
        ui.abLabel.textContent = `A: ${api.fmt(st.a)} …`;
    } else {
        ui.loopAction.textContent = "× Clear Loop";
        ui.loopAction.classList.remove("active"); // Optional: style distinction for "Clear"
        ui.abLabel.textContent = `A: ${api.fmt(st.a)}  B: ${api.fmt(st.b)}`;
    }
  };

  const syncTime = () => {
    ui.timeLab.textContent = `${api.fmt(audio.currentTime || 0)} / ${api.fmt(audio.duration || 0)}`;
  };
  const syncScrub = () => {
    if (st.scrubbing) return;
    const dur = audio.duration || 0;
    const p = dur ? Math.floor(((audio.currentTime || 0) / dur) * 1000) : 0;
    ui.scrub.value = String(api.clamp(p, 0, 1000));
  };
  const syncRateUI = () => {
    ui.rateVal.textContent = `${Number(audio.playbackRate).toFixed(2)}×`;
    ui.rate.value = String(audio.playbackRate || 1);
  };
  const syncRefUI = () => {
    const ready = !!refAudio.src;
    const r = refAudio.playbackRate || 1;
    const d = isFinite(refAudio.duration) ? api.fmt(refAudio.duration) : "—:—";
    const meta = api.getRefMeta();
    const v = meta && (meta.voice || meta.style) ? ` ${meta.voice || ""}` : "";
    ui.refLabel.textContent = ready ? `Ref: ${r.toFixed(2)}× · ${d}${v}` : "Ref: —";
  };

  // --- Loop Logic ---
  const handleLoopClick = () => {
    if (!audio.duration) {
        showToast("No audio to loop!");
        return;
    }

    if (st.a == null) {
        // Set A
        st.a = audio.currentTime || 0;
        st.looping = false; // Not looping yet
        showLoopHint(); // Show hint after first interaction
    } else if (st.b == null) {
        // Set B
        st.b = audio.currentTime || 0;
        // Auto-correct if B < A
        if (st.b < st.a) { const temp = st.a; st.a = st.b; st.b = temp; }
        st.looping = true; // Auto-enable loop
        audio.currentTime = st.a; // Jump to start of loop
        if (!st.playing) api.play(); // Auto-play
    } else {
        // Clear
        api.clearAB();
    }
    syncButtons();
  };

  // --- Main Play Logic ---
  const handlePlayAction = async (isRestart = false) => {
    if (!audio.currentSrc && !audio.src) { showToast("No recording yet!"); return; }
    if (audio.duration === 0 || isNaN(audio.duration)) { showToast("Audio empty/loading..."); return; }

    try {
      if (isRestart) {
        audio.currentTime = (st.looping && st.a != null) ? st.a : 0;
        if (!st.playing) await api.play();
      } else {
        if (st.playing) {
          api.pause();
        } else {
          // Check loop bounds
          if (st.looping && st.a != null && st.b != null && st.b > st.a) {
            const inside = (t) => t >= st.a && t <= st.b;
            if (!inside(audio.currentTime)) audio.currentTime = st.a;
          }
          await api.play();
        }
      }
    } catch (err) {
       console.warn("[selfpb] Action failed:", err);
       showToast("Playback failed");
    } finally {
      syncButtons();
    }
  };

  // --- Listeners ---
  ui.mainBtn.addEventListener("click", (e) => { if (e.detail !== 2) handlePlayAction(false); });
  ui.mainBtn.addEventListener("dblclick", (e) => { e.preventDefault(); handlePlayAction(true); });

  ui.backBtn.addEventListener("click", () => {
    audio.currentTime = api.clamp((audio.currentTime || 0) - 5, 0, audio.duration || 0);
    syncTime(); syncScrub();
  });
  ui.fwdBtn.addEventListener("click", () => {
    audio.currentTime = api.clamp((audio.currentTime || 0) + 5, 0, audio.duration || 0);
    syncTime(); syncScrub();
  });

  ui.scrub.addEventListener("input", () => {
    api._setScrubbingOn();
    const p = Number(ui.scrub.value) / 1000;
    audio.currentTime = api.clamp(p * (audio.duration || 0), 0, audio.duration || 0);
    syncTime();
  });
  ui.scrub.addEventListener("change", () => api._setScrubbingOff());

  ui.rate.addEventListener("input", () => {
    const v = api.clamp(Number(ui.rate.value) || 1, 0.5, 1.5);
    api.setRate(v); syncRateUI();
  });

  // Smart Loop Button
  ui.loopAction.addEventListener("click", handleLoopClick);
  // Double-click to clear immediately
  ui.loopAction.addEventListener("dblclick", (e) => {
      e.preventDefault();
      api.clearAB();
      syncButtons();
      showToast("Loop cleared");
  });

  // Audio Events
  audio.addEventListener("timeupdate", () => { syncTime(); syncScrub(); });
  audio.addEventListener("play", () => { st.playing = true; syncButtons(); });
  audio.addEventListener("pause", () => { st.playing = false; syncButtons(); });
  audio.addEventListener("loadedmetadata", () => { syncTime(); syncScrub(); });
  audio.addEventListener("ratechange", syncRateUI);
  audio.addEventListener("ended", () => { st.playing = false; syncButtons(); });

  refAudio.addEventListener("loadedmetadata", syncRefUI);
  refAudio.addEventListener("ratechange", syncRefUI);

  // Shortcuts
  const isTypingTarget = (el) => {
    const t = el && el.tagName ? el.tagName.toLowerCase() : "";
    return t === "input" || t === "textarea" || el?.isContentEditable;
  };
  window.addEventListener("keydown", (e) => {
    if (isTypingTarget(document.activeElement)) return;
    if (e.code === "Space") { e.preventDefault(); ui.mainBtn.click(); }
    else if (e.key === ",") { e.preventDefault(); ui.backBtn.click(); }
    else if (e.key === ".") { e.preventDefault(); ui.fwdBtn.click(); }
    else if (e.key === "[") { 
        e.preventDefault(); 
        api.setRate(api.clamp((audio.playbackRate || 1) - 0.05, 0.5, 1.5)); 
        syncRateUI(); 
    }
    else if (e.key === "]") { 
        e.preventDefault(); 
        api.setRate(api.clamp((audio.playbackRate || 1) + 0.05, 0.5, 1.5)); 
        syncRateUI(); 
    }
    // Map L/I/O to new single button logic if desired, or keep specific markers
    // Keeping logic consistent: 'L' toggles/cycles through the main button logic
    else if (e.key.toLowerCase() === "l") { e.preventDefault(); ui.loopAction.click(); }
  }, { passive: false });

  // Init
  initialSync();
  window.LuxSelfPB = Object.assign(window.LuxSelfPB || {}, { el: ui.host });
  console.info("[self-pb] lite UI mounted");

  function initialSync() {
    syncTime(); syncScrub(); syncButtons(); syncRefUI();
  }
}

export { mountSelfPlaybackLite as default };