// features/features/selfpb/ui.js
// FINAL LAYOUT: "Hero" Waveform at top, controls below.

import { initSelfPBCore } from "./core.js";
import { initWaveformVisualizer } from "./waveform-logic.js";

function ensureStyles() {
  const STYLE_ID = "selfpb-lite-style";
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    #selfpb-lite {
      position: fixed; top: 12px; left: 12px; z-index: 9999;
      border-radius: 12px; padding: 12px;
      font: 600 13px system-ui,-apple-system,sans-serif;
      box-shadow: 0 8px 30px rgba(0,0,0,0.25);
      width: 380px; /* Fixed width for better layout control */
    }
    #selfpb-lite .row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    #selfpb-lite .btn {
      padding: 6px 12px; border-radius: 6px; border: 0;
      background: #2d6cdf; color: #fff; cursor: pointer;
      transition: all 0.1s; font-weight: 600;
    }
    #selfpb-lite .btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
    #selfpb-lite .btn:active { transform: translateY(0); }
    #selfpb-lite .btn[disabled] { opacity: 0.5; cursor: not-allowed; }
    
    #selfpb-lite .pill { border-radius: 999px; padding: 4px 10px; background: #f1f5f9; border: 1px solid #cbd5e1; }
    #selfpb-lite input[type="range"] { accent-color: #2d6cdf; cursor: pointer; }
    
    /* Layout Specifics */
    #spb-main { flex: 1; font-size: 1.1em; padding: 8px; }
    #spb-loop-action { flex: 1; background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
    
    /* Floating Tip */
    .spb-bubble {
        position: absolute; top: -40px; left: 0; right: 0;
        background: #1e293b; color: #fff; padding: 6px 10px;
        border-radius: 6px; text-align: center; font-size: 12px;
        pointer-events: none; opacity: 0; transition: opacity 0.3s;
    }
    .spb-bubble.visible { opacity: 1; }
  `;
  document.head.appendChild(s);
}

function buildUI() {
  const host = document.createElement("div");
  host.id = "selfpb-lite";
  
  // HTML STRUCTURE: Header -> Waveform (Hero) -> Scrubber -> Controls
  host.innerHTML = `
    <div class="row" style="justify-content: space-between; margin-bottom: 10px;">
      <span style="opacity:0.6; font-size: 0.9em; font-weight: 700;">SELF PLAYBACK</span>
      <span id="spb-toast" style="color:#ef4444; font-weight:700; display:none;"></span>
      <span class="pill" id="spb-time" style="font-family:monospace;">0:00 / 0:00</span>
    </div>

    <div id="spb-waveform-container" style="position: relative; margin-bottom: 12px;">
       <canvas id="spb-wave-learner" width="380" height="64"></canvas>
       <canvas id="spb-wave-ref" width="380" height="64"></canvas>
       
       <div id="spb-playhead-line" style="position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: #ef4444; pointer-events: none; transform: translateX(0);"></div>
    </div>

    <div class="row">
       <button class="btn" id="spb-back" style="padding:4px 8px; font-size:0.9em;">-2.5s</button>
       <input id="spb-scrub" class="scrub" type="range" min="0" max="1000" step="1" value="0" style="flex:1;">
       <button class="btn" id="spb-fwd" style="padding:4px 8px; font-size:0.9em;">+2.5s</button>
    </div>

    <div class="row">
      <button class="btn" id="spb-main">▶ Play</button>
      <div class="pill" style="display:flex; align-items:center; gap:6px;">
        <small>Speed</small>
        <input id="spb-rate" type="range" min="0.5" max="1.5" step="0.1" value="1" style="width: 80px;">
        <small id="spb-rate-val" style="width:36px; text-align:right;">1.0×</small>
      </div>
    </div>

    <div class="row" style="position: relative;">
      <div id="spb-loop-tip" class="spb-bubble">Tap A then B to loop. Double-tap to clear.</div>
      <button class="btn" id="spb-loop-action">⟳ Set Loop A</button>
      <span id="spb-ab-label" style="margin-left: auto; font-family: monospace; color: #64748b;">-- : --</span>
    </div>
  `;
  
  document.body.appendChild(host);

  return {
    host,
    toast: host.querySelector("#spb-toast"),
    playhead: host.querySelector("#spb-playhead-line"), // Direct ref to CSS playhead
    waveContainer: host.querySelector("#spb-waveform-container"),
    waveLearner: host.querySelector("#spb-wave-learner"),
    waveRef: host.querySelector("#spb-wave-ref"),
    
    // Controls
    mainBtn: host.querySelector("#spb-main"),
    backBtn: host.querySelector("#spb-back"),
    fwdBtn: host.querySelector("#spb-fwd"),
    scrub: host.querySelector("#spb-scrub"),
    rate: host.querySelector("#spb-rate"),
    rateVal: host.querySelector("#spb-rate-val"),
    timeLab: host.querySelector("#spb-time"),
    loopAction: host.querySelector("#spb-loop-action"),
    loopTip: host.querySelector("#spb-loop-tip"),
    abLabel: host.querySelector("#spb-ab-label"),
  };
}

export function mountSelfPlaybackLite() {
  const { api, audio, refAudio, st } = initSelfPBCore();
  ensureStyles();
  const ui = buildUI();

  // Initialize Waveform Logic
  initWaveformVisualizer({
    waveLearner: ui.waveLearner,
    waveRef: ui.waveRef,
    playhead: ui.playhead, // Pass the DIV playhead instead of redrawing canvas
    containerWidth: 380
  });

  // --- Logic Helpers ---
  const showToast = (msg) => {
    ui.toast.textContent = msg; ui.toast.style.display = "inline";
    setTimeout(() => ui.toast.style.display = "none", 2000);
  };
  const syncTime = () => {
    ui.timeLab.textContent = `${api.fmt(audio.currentTime)} / ${api.fmt(audio.duration)}`;
  };
  const syncScrub = () => {
    if (!st.scrubbing) {
       const p = (audio.currentTime / (audio.duration || 1)) * 1000;
       ui.scrub.value = p || 0;
    }
  };
  const syncButtons = () => {
    ui.mainBtn.textContent = st.playing ? "⏸ Pause" : "▶ Play";
    if (st.a == null) {
       ui.loopAction.textContent = "⟳ Set Loop A";
       ui.loopAction.classList.remove("active");
       ui.abLabel.textContent = "-- : --";
    } else if (st.b == null) {
       ui.loopAction.textContent = "⟳ Set Loop B";
       ui.loopAction.classList.add("active");
       ui.abLabel.textContent = `A ${api.fmt(st.a)}`;
    } else {
       ui.loopAction.textContent = "× Clear Loop";
       ui.loopAction.classList.remove("active");
       ui.abLabel.textContent = `${api.fmt(st.a)} - ${api.fmt(st.b)}`;
    }
  };

  // --- Listeners ---
  const togglePlay = async () => {
    if (!audio.src) return showToast("No Audio");
    if (st.playing) api.pause();
    else await api.play();
    syncButtons();
  };

  ui.mainBtn.onclick = togglePlay;
  ui.loopAction.onclick = () => {
    if (st.a == null) { st.a = audio.currentTime; }
    else if (st.b == null) { st.b = audio.currentTime; st.looping = true; api.play(); }
    else { api.clearAB(); }
    syncButtons();
  };
  
  // Audio Events
  audio.ontimeupdate = () => { syncTime(); syncScrub(); };
  audio.onplay = () => { st.playing = true; syncButtons(); };
  audio.onpause = () => { st.playing = false; syncButtons(); };
  audio.onloadedmetadata = () => { syncTime(); };

  // Init
  window.LuxSelfPB = Object.assign(window.LuxSelfPB || {}, { el: ui.host });
  syncButtons(); syncTime();
  console.info("[self-pb] Hero Layout Mounted");
}

export { mountSelfPlaybackLite as default };