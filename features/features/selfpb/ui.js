// features/features/selfpb/ui.js
// FINAL PIVOT: Using WaveSurfer.js for reliable waveforms.

import { initSelfPBCore } from "./core.js";
import { initWaveSurfer } from "./waveform-logic.js";

function ensureStyles() {
  const STYLE_ID = "selfpb-lite-style";
  if (document.getElementById(STYLE_ID)) return;

  const s = document.createElement("style");
  s.id = STYLE_ID;

  s.textContent = `
    /* Light Theme + Layout Styles */

    /* ✅ OUTER bezel: always hugs inner width perfectly */
    #selfpb-lite{
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 9999;

      /* 🔒 lock inner width into a variable so outer can wrap it */
      --spbW: min(390px, calc(100vw - 48px));

      width: calc(var(--spbW) + 24px);  /* ✅ inner + bezel */
      max-width: calc(100vw - 24px);

      padding: 10px 14px 14px 10px;     /* bezel (extra right/bottom) */
      border-radius: 18px;

      /* ✅ make bezel visible */
      background: rgba(15,23,42,0.06);
      border: 1px solid rgba(15,23,42,0.10);
      box-shadow: 0 10px 26px rgba(0,0,0,0.22);

      box-sizing: border-box;
      overflow: visible; /* ✅ don’t clip the bezel */
    }

    #selfpb-lite *{ box-sizing:border-box; }

    /* ✅ INNER panel always matches spbW */
    #selfpb-lite .spb-body{
      width: var(--spbW);
      background: #fff;
      border-radius: 16px;
      padding: 12px;
      overflow: hidden;
    }

    #selfpb-lite .row{
      display:flex;
      align-items:center;
      gap:8px;
      min-width:0;
    }

    #selfpb-lite .scrubFull{
      width:100%;
      min-width:0;
    }

    #selfpb-lite .btn{
      padding:6px 10px;
      border-radius:8px;
      border:0;
      background:#2d6cdf;
      color:#fff;
      cursor:pointer;
      transition:background 0.15s, transform 0.1s;
    }

    #selfpb-lite .btn:hover{filter:brightness(1.1);}
    #selfpb-lite .btn:active{transform:scale(0.96);}
    #selfpb-lite .btn[disabled]{opacity:.5;cursor:not-allowed}

    #selfpb-lite .btn.icon{
      width:44px;
      padding:6px 0;
      display:grid;
      place-items:center;
    }

    #selfpb-lite .pill{border-radius:999px;padding:6px 10px}
    #selfpb-lite .meta{opacity:.85}

    :is(#selfpb-lite, #spb-float) input[type="range"]{accent-color:#2d6cdf}

    #selfpb-lite .ab{display:flex;gap:6px;position:relative;}
    #selfpb-lite .tiny{font-weight:700;opacity:.8}

    /* Layout Fixes */
    #selfpb-lite .spacer{flex:1}
    #spb-main { width: 110px; font-weight: 800; font-size: 1.05em; flex-shrink: 0; }
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
      content: '';
      position: absolute;
      bottom: -4px;
      left: 16px;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 4px solid rgba(0,0,0,0.85);
    }

    /* ✅ In expanded mode, body fills floating card */
    #spb-float .spb-body{
      width: 100% !important;
    }

    /* ✅ Prevent waveform/canvas from forcing overflow */
    :is(#selfpb-lite, #spb-float) canvas,
    :is(#selfpb-lite, #spb-float) .spb-wave,
    :is(#selfpb-lite, #spb-float) #spb-wavebox{
      max-width: 100% !important;
    }

    :is(#selfpb-lite, #spb-float) .spb-wave{
      height:92px;
      border-radius:12px;
      background: rgba(15,23,42,0.04);
      border:1px solid rgba(15,23,42,0.10);
      overflow:hidden;
      display:flex;
      align-items:center;
      justify-content:center;
    }

    /* rows */
    :is(#selfpb-lite, #spb-float) .spb-row{
      display:flex;
      align-items:center;
      gap:10px;
      min-width:0;
      width:100%;
    }

    :is(#selfpb-lite, #spb-float) .spb-row + .spb-row{ margin-top:8px; }

    :is(#selfpb-lite, #spb-float) .spb-scrub{
      width:100%;
      min-width:0;
    }

    :is(#selfpb-lite, #spb-float) .spb-btn{
      border:0;
      border-radius:10px;
      padding:8px 12px;
      font-weight:800;
      cursor:pointer;
      background:#2f6fe4;
      color:#fff;
      box-shadow:0 6px 16px rgba(0,0,0,0.12);
      white-space:nowrap;
    }

    :is(#selfpb-lite, #spb-float) .spb-btn.secondary{
      background: rgba(15,23,42,0.08);
      color: rgba(15,23,42,0.85);
      box-shadow:none;
    }

    :is(#selfpb-lite, #spb-float) .spb-btn.icon{
      width:44px;
      display:grid;
      place-items:center;
      padding:8px 0;
    }

    /* ✅ Download arrow matches TTS (blue link-style) */
    #selfpb-lite #spb-dl{
      background: transparent !important;
      box-shadow: none !important;
      border: 0 !important;

      color: #0078d7 !important;   /* ✅ same as .tts-link */
      font-size: 1.8rem;
      line-height: 1;
      padding: 6px 10px;
    }

    #selfpb-lite #spb-dl:hover{
      filter: brightness(0.9);
    }

    /* ✅ Scrubber: looks like a real timeline */
    :is(#selfpb-lite, #spb-float) #spb-scrub{
      -webkit-appearance: none;
      appearance: none;
      height: 18px;
    }

    :is(#selfpb-lite, #spb-float) #spb-scrub::-webkit-slider-runnable-track{
      height: 10px;
      border-radius: 999px;
      background: rgba(15,23,42,0.14);
    }

    :is(#selfpb-lite, #spb-float) #spb-scrub::-webkit-slider-thumb{
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #2f6fe4;
      border: 2px solid #fff;
      margin-top: -4px;
      box-shadow: 0 6px 14px rgba(0,0,0,0.18);
    }

    /* ✅ Speed stays slimmer + quieter */
    :is(#selfpb-lite, #spb-float) #spb-rate::-webkit-slider-runnable-track{
      height: 6px;
      border-radius: 999px;
      background: rgba(15,23,42,0.10);
    }
    :is(#selfpb-lite, #spb-float) #spb-rate::-webkit-slider-thumb{
      -webkit-appearance:none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: rgba(15,23,42,0.60);
      margin-top: -4px;
    }

    /* bottom row: -2s ⬇ +2s */
    :is(#selfpb-lite, #spb-float) .spb-bottom{
      justify-content:space-between;
    }

    /* ✅ Expand button (header) */
    #selfpb-lite .spb-miniBtn{
      border: 0;
      border-radius: 999px;
      padding: 6px 10px;
      font-weight: 900;
      cursor: pointer;
      background: rgba(255,255,255,0.22);
      color: rgba(15,23,42,0.85);
      transition: transform .12s ease, filter .12s ease;
    }

    #selfpb-lite .spb-miniBtn:hover{
      transform: scale(1.10);  /* ✅ “big bulge” hover */
      filter: brightness(1.12);
    }

    /* ✅ Floating expanded window (non-modal) */
    #spb-float{
      position: fixed;
      z-index: 200000;
      display: none;

      width: min(920px, calc(100vw - 40px));
      max-height: min(720px, calc(100vh - 40px));

      left: 50%;
      top: 90px;
      transform: translateX(-50%);

      border-radius: 22px;
      background: rgba(255,255,255,0.96);
      border: 1px solid rgba(15,23,42,0.12);
      box-shadow: 0 18px 52px rgba(0,0,0,0.30);
      overflow: hidden;
    }

    #spb-float.is-open{ display:block; }

    #spb-floatHead{
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding: 10px 12px;
      font-weight: 900;
      cursor: grab;            /* ✅ draggable */
      user-select: none;
      background: rgba(15,23,42,0.04);
    }

    #spb-floatHead:active{ cursor: grabbing; }

    #spb-floatMount{
      padding: 12px;
    }

    /* ✅ bigger waveform in expanded mode */
    #spb-float #spb-wavebox{
      height: 240px;
    }

    /* ✅ expanded mode: speed slider not absurdly wide */
    #spb-float #spb-rate{
      max-width: 320px;
    }
  `;

  document.head.appendChild(s);
}

function buildUI() {
  const host = document.createElement("div");
  host.id = "selfpb-lite";

  host.innerHTML = `
    <div class="row" style="margin-bottom:6px; position:relative;">
      <span
        id="spb-toast"
        class="pill tiny"
        style="display:none; position:absolute; right:0; top:0; background:#ef4444; border-color:#b91c1c; color:#fff; z-index:10; box-shadow: 0 2px 10px rgba(0,0,0,0.5);"
      ></span>

      <button id="spb-expand" class="spb-miniBtn" title="Expand Self Playback">
        Expand
      </button>

      <div class="spacer"></div>
      <span class="pill tiny" id="spb-ref">Ref: —</span>
      <span class="pill tiny" id="spb-time">0:00 / 0:00</span>
    </div>

    <div class="spb-body">

      <!-- ✅ Wave box (top) -->
      <div class="spb-wave" id="spb-wavebox">
        <div id="spb-waveform-container" style="width:100%; height:100%; display:flex; flex-direction:column;">
          <div id="spb-wave-learner" style="height: 50%; width: 100%;"></div>
          <div id="spb-wave-ref" style="height: 50%; width: 100%; border-top: 1px solid #eee;"></div>
        </div>
      </div>

      <!-- ✅ Scrubber row -->
      <div class="spb-row">
        <input id="spb-scrub" class="spb-scrub" type="range" min="0" max="1000" step="1" value="0" title="Seek">
      </div>

      <!-- ✅ Speed row -->
      <div class="spb-row">
        <div style="min-width:54px; font-weight:800; opacity:.75;">Speed</div>
        <input id="spb-rate" type="range" min="0.5" max="1.5" step="0.05" value="1" style="flex:1; min-width:0;">
        <div id="spb-rate-val" style="min-width:54px; text-align:right; font-weight:900;">1.00×</div>
        <div id="spb-loop-slot" style="min-width:110px; text-align:right; font-weight:900; opacity:.75;"></div>
      </div>

      <!-- ✅ Loop status text -->
      <div class="spb-row" id="spb-loop-row">
        <div id="spb-ab-label" style="font-weight:800; opacity:.75;">Loop: Off</div>
      </div>

      <!-- ✅ Play + Set Loop row -->
      <div class="spb-row">
        <button class="spb-btn" id="spb-main" style="flex:1; min-width:0;">▶ Play</button>
        <div class="ab" style="flex:1; min-width:0; display:flex; justify-content:flex-end; position:relative;">
          <div id="spb-loop-tip" class="spb-bubble">Tap <b>A</b> then <b>B</b> to loop.</div>
          <button class="spb-btn" id="spb-loop-action" style="flex:1; min-width:0;">⟳ Set Loop A</button>
        </div>
      </div>

      <!-- ✅ Bottommost row: -2s  ⬇  +2s -->
      <div class="spb-row spb-bottom">
        <button class="spb-btn" id="spb-back">−2s</button>
        <button class="spb-btn secondary icon" id="spb-dl" type="button" disabled title="Record something first">⬇</button>
        <button class="spb-btn" id="spb-fwd">+2s</button>
      </div>

    </div>
  `;

  document.body.appendChild(host);

  // ✅ Expanded floating window (create once)
  let float = document.getElementById("spb-float");
  if (!float) {
    float = document.createElement("div");
    float.id = "spb-float";
    float.innerHTML = `
      <div id="spb-floatHead">
        <div>Self Playback (Expanded)</div>
        <button id="spb-floatClose" class="spb-btn secondary icon" title="Close">✕</button>
      </div>
      <div id="spb-floatMount"></div>
    `;
    document.body.appendChild(float);
  }

  const floatHead = float.querySelector("#spb-floatHead");
  const floatClose = float.querySelector("#spb-floatClose");
  const floatMount = float.querySelector("#spb-floatMount");

  const expandBtn = host.querySelector("#spb-expand");
  const body = host.querySelector(".spb-body");
  const bodyHome = body.parentElement;
  let bodyNext = body.nextSibling;

  const loopLabel = host.querySelector("#spb-ab-label");
  const loopRow = host.querySelector("#spb-loop-row");
  const loopSlot = host.querySelector("#spb-loop-slot");

  function openExpanded() {
    bodyNext = body.nextSibling; // ✅ re-capture in case DOM changes
    float.classList.add("is-open");
    floatMount.appendChild(body);

    // move Loop label into speed row slot (expanded only)
    if (loopSlot && loopLabel) loopSlot.appendChild(loopLabel);
    if (loopRow) loopRow.style.display = "none";
  }

  function closeExpanded() {
    float.classList.remove("is-open");
    bodyHome.insertBefore(body, bodyNext || null);

    // put Loop label back into its normal row
    if (loopRow && loopLabel) loopRow.appendChild(loopLabel);
    if (loopRow) loopRow.style.display = "";
  }

  expandBtn?.addEventListener("click", openExpanded);
  floatClose?.addEventListener("click", closeExpanded);

  // ✅ Drag floating expanded window
  let dragOn = false;
  let dragOffX = 0;
  let dragOffY = 0;

  floatHead.addEventListener("pointerdown", (e) => {
    // prevent dragging when clicking the close button
    if (e.target && e.target.id === "spb-floatClose") return;

    dragOn = true;
    const r = float.getBoundingClientRect();

    // convert from centered transform layout -> absolute px positioning
    float.style.transform = "none";
    float.style.left = r.left + "px";
    float.style.top = r.top + "px";

    dragOffX = e.clientX - r.left;
    dragOffY = e.clientY - r.top;

    floatHead.setPointerCapture(e.pointerId);
  });

  floatHead.addEventListener("pointermove", (e) => {
    if (!dragOn) return;
    float.style.left = e.clientX - dragOffX + "px";
    float.style.top = e.clientY - dragOffY + "px";
  });

  floatHead.addEventListener("pointerup", () => {
    dragOn = false;
  });

  return {
    host,
    toast: host.querySelector("#spb-toast"),
    mainBtn: host.querySelector("#spb-main"),
    dlBtn: host.querySelector("#spb-dl"),
    backBtn: host.querySelector("#spb-back"),
    fwdBtn: host.querySelector("#spb-fwd"),
    scrub: host.querySelector("#spb-scrub"),
    rate: host.querySelector("#spb-rate"),
    rateVal: host.querySelector("#spb-rate-val"),
    timeLab: host.querySelector("#spb-time"),
    loopAction: host.querySelector("#spb-loop-action"),
    loopTip: host.querySelector("#spb-loop-tip"),
    abLabel: host.querySelector("#spb-ab-label"),
    refLabel: host.querySelector("#spb-ref"),
    // Containers
    waveLearner: host.querySelector("#spb-wave-learner"),
    waveRef: host.querySelector("#spb-wave-ref"),
  };
}

export function mountSelfPlaybackLite() {
  const { api, audio, refAudio, st } = initSelfPBCore();

  ensureStyles();
  const ui = buildUI();

  // Initialize WaveSurfer
  initWaveSurfer({
    learnerContainer: ui.waveLearner,
    refContainer: ui.waveRef,
    masterAudio: audio,
  });

  // ✅ Download Latest Recording button wiring
  const dlBtn = ui.dlBtn;
  let _lastBlob = null;
  let _lastMeta = null;

  function extFromBlob(blob) {
    const t = blob?.type || "";
    if (t.includes("wav")) return "wav";
    if (t.includes("webm")) return "webm";
    if (t.includes("ogg")) return "ogg";
    return "audio";
  }

  function downloadBlob(blob, meta) {
    if (!blob) return;

    const mode = (meta?.mode || "normal").toLowerCase();
    const ts = new Date(meta?.ts || Date.now())
      .toISOString()
      .replaceAll(":", "-")
      .replaceAll(".", "-");

    const ext = extFromBlob(blob);
    const name = `lux-recording_${mode}_${ts}.${ext}`;

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  function setLatest(blob, meta) {
    _lastBlob = blob || null;
    _lastMeta = meta || null;

    if (dlBtn) {
      dlBtn.disabled = !_lastBlob;
      dlBtn.title = _lastBlob
        ? "Download your latest recording"
        : "Record something first";
    }
  }

  if (dlBtn) {
    dlBtn.addEventListener("click", () => {
      if (!_lastBlob) return;
      downloadBlob(_lastBlob, _lastMeta);
    });
  }

  // Pull from global if it exists already
  if (window.LuxLastRecordingBlob) {
    setLatest(window.LuxLastRecordingBlob, window.LuxLastRecordingMeta || null);
  }

  // Listen for new recordings
  window.addEventListener("lux:lastRecording", (e) => {
    setLatest(e?.detail?.blob, e?.detail?.meta || null);
  });

  // --- Logic helpers ---
  const showToast = (msg, duration = 2000) => {
    ui.toast.textContent = msg;
    ui.toast.style.display = "inline-block";
    ui.host.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-4px)" },
        { transform: "translateX(4px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 200 }
    );
    setTimeout(() => {
      ui.toast.style.display = "none";
    }, duration);
  };

  const showLoopHint = () => {
    if (localStorage.getItem("spb-hint-seen") !== "true") {
      ui.loopTip.classList.add("visible");
      setTimeout(() => {
        ui.loopTip.classList.remove("visible");
        localStorage.setItem("spb-hint-seen", "true");
      }, 4000);
    }
  };

  const syncButtons = () => {
    ui.mainBtn.textContent = st.playing ? "⏸ Pause" : "▶ Play";

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
      ui.loopAction.classList.remove("active");
      ui.abLabel.textContent = `A: ${api.fmt(st.a)}  B: ${api.fmt(st.b)}`;
    }
  };

  const syncTime = () => {
    ui.timeLab.textContent = `${api.fmt(audio.currentTime || 0)} / ${api.fmt(
      audio.duration || 0
    )}`;
  };

  const syncScrub = () => {
    if (!st.scrubbing) {
      const dur = audio.duration || 0;
      const p = dur ? Math.floor((audio.currentTime / dur) * 1000) : 0;
      ui.scrub.value = String(api.clamp(p, 0, 1000));
    }
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

  const handlePlayAction = async (isRestart = false) => {
    if (!audio.currentSrc && !audio.src) {
      showToast("No recording yet!");
      return;
    }
    if (audio.duration === 0 || isNaN(audio.duration)) {
      showToast("Audio empty/loading...");
      return;
    }

    try {
      if (isRestart) {
        audio.currentTime = st.looping && st.a != null ? st.a : 0;
        if (!st.playing) await api.play();
      } else {
        if (st.playing) {
          api.pause();
        } else {
          if (st.looping && st.a != null && st.b != null && st.b > st.a) {
            if (audio.currentTime < st.a || audio.currentTime > st.b)
              audio.currentTime = st.a;
          }
          await api.play();
        }
      }
    } catch (err) {
      console.warn("[selfpb] Play failed", err);
      showToast("Playback failed");
    } finally {
      syncButtons();
    }
  };

  const handleLoopClick = () => {
    if (!audio.duration) {
      showToast("No audio to loop!");
      return;
    }

    if (st.a == null) {
      st.a = audio.currentTime || 0;
      st.looping = false;
      showLoopHint();
    } else if (st.b == null) {
      st.b = audio.currentTime || 0;
      if (st.b < st.a) {
        const t = st.a;
        st.a = st.b;
        st.b = t;
      }
      st.looping = true;
      audio.currentTime = st.a;
      if (!st.playing) api.play();
    } else {
      api.clearAB();
    }

    syncButtons();
  };

  ui.mainBtn.addEventListener("click", (e) => {
    if (e.detail !== 2) handlePlayAction(false);
  });

  ui.mainBtn.addEventListener("dblclick", (e) => {
    e.preventDefault();
    handlePlayAction(true);
  });

  // 2.0 seconds skip
  ui.backBtn.addEventListener("click", () => {
    audio.currentTime = api.clamp(
      (audio.currentTime || 0) - 2.0,
      0,
      audio.duration || 0
    );
    syncTime();
    syncScrub();
  });

  ui.fwdBtn.addEventListener("click", () => {
    audio.currentTime = api.clamp(
      (audio.currentTime || 0) + 2.0,
      0,
      audio.duration || 0
    );
    syncTime();
    syncScrub();
  });

  // ✅ If user grabs scrubber while playing -> PAUSE (pro behavior)
  ui.scrub.addEventListener("pointerdown", () => {
    if (!audio.paused) {
      audio.pause();
    }
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
    api.setRate(v);
    syncRateUI();
  });

  ui.loopAction.addEventListener("click", handleLoopClick);

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
  audio.addEventListener("ended", () => {
    st.playing = false;
    syncButtons();
  });

  refAudio.addEventListener("loadedmetadata", syncRefUI);
  refAudio.addEventListener("ratechange", syncRefUI);

  // Shortcuts logic (unchanged)
  window.addEventListener(
    "keydown",
    (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      )
        return;

      if (e.code === "Space") {
        e.preventDefault();
        ui.mainBtn.click();
      } else if (e.key === ",") {
        e.preventDefault();
        ui.backBtn.click();
      } else if (e.key === ".") {
        e.preventDefault();
        ui.fwdBtn.click();
      } else if (e.key === "[") {
        e.preventDefault();
        api.setRate(api.clamp((audio.playbackRate || 1) - 0.05, 0.5, 1.5));
        syncRateUI();
      } else if (e.key === "]") {
        e.preventDefault();
        api.setRate(api.clamp((audio.playbackRate || 1) + 0.05, 0.5, 1.5));
        syncRateUI();
      } else if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        ui.loopAction.click();
      }
    },
    { passive: false }
  );

  initialSync();
  window.LuxSelfPB = Object.assign(window.LuxSelfPB || {}, { el: ui.host });
  console.info("[self-pb] WaveSurfer UI Mounted");

  function initialSync() {
    syncTime();
    syncScrub();
    syncButtons();
    syncRefUI();
  }
}

export { mountSelfPlaybackLite as default };
