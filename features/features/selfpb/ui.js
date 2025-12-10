// features/features/selfpb/ui.js
// UI: styles + panel DOM + wiring to the core
// UPDATED: Light theme color cleanup and added "Toast" error message and safety guards for Play button.

import { initSelfPBCore } from "./core.js";

function ensureStyles() {
  const STYLE_ID = "selfpb-lite-style";
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    /* Removed inline dark theme styling; now using self-playback.css variables */
    #selfpb-lite{position:fixed;top:12px;left:12px;z-index:9999;border-radius:14px;padding:10px 12px;font:600 14px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25)}
    #selfpb-lite .row{display:flex;align-items:center;gap:8px}
    #selfpb-lite .btn{padding:6px 10px;border-radius:8px;border:0;background:#2d6cdf;color:#fff;cursor:pointer}
    #selfpb-lite .btn[disabled]{opacity:.5;cursor:not-allowed}
    #selfpb-lite .pill{border-radius:999px;padding:6px 10px}
    #selfpb-lite .meta{opacity:.85}
    #selfpb-lite input[type="range"]{accent-color:#2d6cdf}
    #selfpb-lite .ab{display:flex;gap:6px}
    #selfpb-lite .tiny{font-weight:700;opacity:.8}
    #selfpb-lite .scrub{flex:1;min-width:180px}
    #selfpb-lite .spacer{flex:1}
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
          display:none; 
          position:absolute; 
          right:0; 
          top:0; 
          background:#ef4444; 
          border-color:#b91c1c; 
          color:#fff;
          z-index:10;
          box-shadow: 0 2px 10px rgba(0,0,0,0.5);
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
      <button class="btn" id="spb-play">Play</button>
      <button class="btn" id="spb-pause">Pause</button>

      <div class="pill" title="Playback speed">
        <span class="tiny">Speed</span>
        <input id="spb-rate" type="range" min="0.5" max="1.5" step="0.05" value="1" style="vertical-align:middle;width:120px;margin-left:8px">
        <span class="tiny" id="spb-rate-val">1.00×</span>
      </div>
    </div>

    <div class="row">
      <div class="pill ab" title="Mark loop region">
        <button class="btn" id="spb-mark-a" title="I">A</button>
        <button class="btn" id="spb-mark-b" title="O">B</button>
        <button class="btn" id="spb-loop" title="L">Loop ▢</button>
        <button class="btn" id="spb-clear">Clear</button>
        <span class="tiny" id="spb-ab-label" style="margin-left:4px">A:—  B:—</span>
      </div>
    </div>
  `;
  document.body.appendChild(host);
  return {
    host,
    toast: host.querySelector("#spb-toast"), // <--- New reference for toast
    playBtn: host.querySelector("#spb-play"),
    pauseBtn: host.querySelector("#spb-pause"),
    backBtn: host.querySelector("#spb-back"),
    fwdBtn: host.querySelector("#spb-fwd"),
    scrub: host.querySelector("#spb-scrub"),
    rate: host.querySelector("#spb-rate"),
    rateVal: host.querySelector("#spb-rate-val"),
    timeLab: host.querySelector("#spb-time"),
    markA: host.querySelector("#spb-mark-a"),
    markB: host.querySelector("#spb-mark-b"),
    loopBtn: host.querySelector("#spb-loop"),
    clearBtn: host.querySelector("#spb-clear"),
    abLabel: host.querySelector("#spb-ab-label"),
    refLabel: host.querySelector("#spb-ref"),
  };
}

export function mountSelfPlaybackLite() {
  // core (audio + API)
  const { api, audio, refAudio, st } = initSelfPBCore();

  // styles + DOM
  ensureStyles();
  const ui = buildUI();

  // --- Helper: Show a temporary message (from previous step) ---
  const showToast = (msg, duration = 2000) => {
    ui.toast.textContent = msg;
    ui.toast.style.display = "inline-block";
    
    // Shake animation for attention
    ui.host.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-4px)' },
      { transform: 'translateX(4px)' },
      { transform: 'translateX(0)' }
    ], { duration: 200 });

    setTimeout(() => {
      ui.toast.style.display = "none";
    }, duration);
  };

  // wire helpers
  const syncTime = () => {
    ui.timeLab.textContent = `${api.fmt(audio.currentTime || 0)} / ${api.fmt(
      audio.duration || 0
    )}`;
  };
  const syncScrub = () => {
    if (st.scrubbing) return;
    const dur = audio.duration || 0;
    const cur = audio.currentTime || 0;
    const p = dur ? Math.floor((cur / dur) * 1000) : 0;
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
    ui.refLabel.textContent = ready
      ? `Ref: ${r.toFixed(2)}× · ${d}${v}`
      : "Ref: —";
  };
  const syncButtons = () => {
    ui.playBtn.disabled = st.playing;
    ui.pauseBtn.disabled = !st.playing;
    ui.loopBtn.textContent = st.looping ? "Loop ■" : "Loop ▢";
    ui.abLabel.textContent = `A:${st.a == null ? "—" : api.fmt(st.a)}  B:${
      st.b == null ? "—" : api.fmt(st.b)
    }`;
  };

  // controls
  ui.playBtn.addEventListener("click", async () => {
    // --- CHECK 1: Is there audio? (Guard from previous step) ---
    if (!audio.currentSrc && !audio.src) {
      showToast("No recording yet!");
      return;
    }
    
    // --- CHECK 2: Is it valid? ---
    if (audio.duration === 0 || isNaN(audio.duration)) {
        showToast("Audio empty/loading...");
        return;
    }
    
    try {
      if (st.looping && st.a != null && st.b != null && st.b > st.a) {
        const inside = (t) => t >= st.a && t <= st.b;
        if (!inside(audio.currentTime)) audio.currentTime = st.a;
      }
      await api.play();
    } catch (err) {
       console.warn("[selfpb] Play failed:", err);
       showToast("Playback failed");
    } finally {
      syncButtons();
    }
  });

  ui.pauseBtn.addEventListener("click", () => {
    api.pause();
    syncButtons();
  });

  ui.backBtn.addEventListener("click", () => {
    audio.currentTime = api.clamp(
      (audio.currentTime || 0) - 5,
      0,
      audio.duration || 0
    );
    syncTime();
    syncScrub();
  });
  ui.fwdBtn.addEventListener("click", () => {
    const dur = audio.duration || 0;
    audio.currentTime = api.clamp((audio.currentTime || 0) + 5, 0, dur);
    syncTime();
    syncScrub();
  });

  // scrubbing
  ui.scrub.addEventListener("input", () => {
    api._setScrubbingOn();
    const p = Number(ui.scrub.value) / 1000;
    const dur = audio.duration || 0;
    audio.currentTime = api.clamp(p * dur, 0, dur);
    syncTime();
  });
  ui.scrub.addEventListener("change", () => api._setScrubbingOff());

  // speed
  syncRateUI();
  ui.rate.addEventListener("input", () => {
    const v = api.clamp(Number(ui.rate.value) || 1, 0.5, 1.5);
    api.setRate(v);
    syncRateUI();
  });

  // AB loop
  ui.markA.addEventListener("click", () => {
    st.a = audio.currentTime || 0;
    syncButtons();
  });
  ui.markB.addEventListener("click", () => {
    st.b = audio.currentTime || 0;
    syncButtons();
  });
  ui.clearBtn.addEventListener("click", () => {
    api.clearAB();
    syncButtons();
  });
  ui.loopBtn.addEventListener("click", () => {
    st.looping = !st.looping;
    syncButtons();
  });

  // audio events → UI
  audio.addEventListener("timeupdate", () => {
    syncTime();
    syncScrub();
  });
  audio.addEventListener("play", () => {
    st.playing = true;
    syncButtons();
  });
  audio.addEventListener("pause", () => {
    st.playing = false;
    syncButtons();
  });
  audio.addEventListener("loadedmetadata", () => {
    syncTime();
    syncScrub();
  });
  audio.addEventListener("ratechange", syncRateUI);

  // reference pill stays fresh
  refAudio.addEventListener("loadedmetadata", syncRefUI);
  refAudio.addEventListener("ratechange", syncRefUI);

  // shortcuts (ignore when typing)
  const isTypingTarget = (el) => {
    const t = el && el.tagName ? el.tagName.toLowerCase() : "";
    return t === "input" || t === "textarea" || el?.isContentEditable;
  };
  window.addEventListener(
    "keydown",
    (e) => {
      if (isTypingTarget(document.activeElement)) return;
      if (e.code === "Space") {
        e.preventDefault();
        audio.paused ? ui.playBtn.click() : ui.pauseBtn.click();
      } else if (e.key === ",") {
        e.preventDefault();
        ui.backBtn.click();
      } else if (e.key === ".") {
        e.preventDefault();
        ui.fwdBtn.click();
      } else if (e.key === "[") {
        e.preventDefault();
        const v = api.clamp((audio.playbackRate || 1) - 0.05, 0.5, 1.5);
        api.setRate(v);
        syncRateUI();
      } else if (e.key === "]") {
        e.preventDefault();
        const v = api.clamp((audio.playbackRate || 1) + 0.05, 0.5, 1.5);
        api.setRate(v);
        syncRateUI();
      } else if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        ui.loopBtn.click();
      } else if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        ui.markA.click();
      } else if (e.key.toLowerCase() === "o") {
        e.preventDefault();
        ui.markB.click();
      }
    },
    { passive: false }
  );

  // initial sync
  syncTime();
  syncScrub();
  syncButtons();
  syncRefUI();

  // expose the element, for parity with old build
  window.LuxSelfPB = Object.assign(window.LuxSelfPB || {}, { el: ui.host });
  console.info("[self-pb] lite UI mounted");
}

export { mountSelfPlaybackLite as default };