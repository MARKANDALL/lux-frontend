// features/features/selfpb/dom.js

export function buildUI() {
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

  <!-- ✅ TOP ZONE (full width in expanded): Waves + Word Sync + Scrubber -->
  <div class="spb-top">

    <!-- ✅ Wave box (top) -->
    <div class="spb-wave" id="spb-wavebox">
      <div id="spb-waveform-container" style="width:100%; height:100%; display:flex; flex-direction:column;">
        <div id="spb-wave-learner" style="height: 50%; width: 100%;"></div>
        <div id="spb-wave-ref" style="height: 50%; width: 100%; border-top: 1px solid #eee;"></div>
      </div>
    </div>

    <!-- ✅ Karaoke Timeline -->
    <div id="spb-karaokeWrap">
      <div class="spb-karaokeTitle">Word Sync</div>
      <div id="spb-karaokeLaneWrap" title="Click a word to seek • Click the lane to jump">
        <div id="spb-karaokeLane"></div>
        <div id="spb-karaokeCursor"></div>
      </div>
    </div>

    <!-- ✅ Scrubber row -->
    <div class="spb-row">
      <input id="spb-scrub" class="spb-scrub" type="range" min="0" max="1000" step="1" value="0" title="Seek">
    </div>

  </div>

  <!-- ✅ BOTTOM LEFT (Self Playback controls) -->
  <div class="spb-controls spb-controls--self">

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

  <!-- ✅ BOTTOM RIGHT (TTS mount) — hidden in drawer, shown in expanded via CSS -->
  <div class="spb-controls spb-controls--tts">
    <div id="spb-ttsMount"></div>
  </div>

    </div>

    <!-- blank mini placeholder shown only while expanded is open -->
    <div class="spb-body spb-miniPlaceholder" aria-hidden="true" style="display:none;"></div>

  `;

  document.body.appendChild(host);

  // ✅ Expanded floating window (create once)
  let float = document.getElementById("spb-float");
  if (!float) {
    float = document.createElement("div");
    float.id = "spb-float";
    float.innerHTML = `
      <div id="spb-floatHead">
        <div id="spb-floatHeadLabel">
          <div id="spb-floatDragHint" title="Drag to move">🖐️</div>
          <div>Self Playback + Text-to-Speech (Expanded)</div>
        </div>
         <span id="spb-toast-float" class="pill tiny" style="display:none; position:absolute; right:52px; top:10px; background:#ef4444; border-color:#b91c1c; color:#fff; z-index:10; box-shadow: 0 2px 10px rgba(0,0,0,0.5);"></span>
        <button id="spb-floatClose" class="spb-btn secondary icon" title="Close">✕</button>
      </div>

      <div id="spb-floatMount"></div>
    `;
    document.body.appendChild(float);
  }

  const floatHead = float.querySelector("#spb-floatHead");
  const floatClose = float.querySelector("#spb-floatClose");
  const floatMount = float.querySelector("#spb-floatMount");
  const ttsMount = host.querySelector("#spb-ttsMount");

  const expandBtn = host.querySelector("#spb-expand");
  const body = host.querySelector(".spb-body");
  const bodyHome = body.parentElement;
  let bodyNext = body.nextSibling;

  const loopLabel = host.querySelector("#spb-ab-label");
  const loopRow = host.querySelector("#spb-loop-row");
  const loopSlot = host.querySelector("#spb-loop-slot");

  const spbTtsMount = host.querySelector("#spb-ttsMount");
  let ttsWrapHome = null;
  let ttsWrapNext = null;
  let ttsShell = null;

  const setTtsShellEmpty = (on) => {
    try {
      // Primary (your current DOM)
      const shellById = document.getElementById("tts-shell");
      if (shellById) shellById.classList.toggle("tts-shell--empty", !!on);

      // Compat with earlier patch wording (if present elsewhere)
      const shellByClass = document.querySelector(".lux-tts-shell");
      if (shellByClass) shellByClass.classList.toggle("lux-tts-shell--empty", !!on);
    } catch {}
  };

  let isExpandedOpen = false;
  function setExpandedOpen(on) {
    try {
      document.documentElement.classList.toggle("lux-selfpb-expanded-open", !!on);
    } catch (_) {}
  }

  async function openExpanded() {
    if (isExpandedOpen) return;
    isExpandedOpen = true;
    setExpandedOpen(true);

    bodyNext = body.nextSibling; // ✅ re-capture in case DOM changes
    host.classList.add("spb-mini-empty");
    float.classList.add("is-open");
    floatMount.appendChild(body);

    // Nudge WaveSurfer / layout-dependent renders after mount
    requestAnimationFrame(() => {
      try { window.dispatchEvent(new Event("resize")); } catch (_) {}
      setTimeout(() => { try { window.dispatchEvent(new Event("resize")); } catch (_) {} }, 120);
    });

    // Ensure TTS player exists even if the drawer was never opened
    try {
      if (!document.getElementById("tts-wrap")) {
        const ttsBoot = await import("../tts/boot-tts.js");
        await ttsBoot.ensureTTSPlayerMounted?.();
      }
    } catch (_) {}

    // move TTS controls into expanded bottom-right mount
    try {
      const ttsWrap = document.getElementById("tts-wrap");
      ttsShell = document.getElementById("tts-shell");

      if (ttsWrap && ttsMount) {
        // capture original home only if we're not already in the expanded mount
        if (ttsWrap.parentElement !== ttsMount) {
          ttsWrapHome = ttsWrap.parentElement;
          ttsWrapNext = ttsWrap.nextSibling;
          ttsMount.appendChild(ttsWrap);
          ttsWrap.dataset.luxInSelfPB = "1";
        }
      }
    } catch (_) {}

    // show placeholder in the TTS drawer while controls are moved out
    setTtsShellEmpty(true);

    // move Loop label into speed row slot (expanded only)
    if (loopSlot && loopLabel) loopSlot.appendChild(loopLabel);
    if (loopRow) loopRow.style.display = "none";

    // ✅ Karaoke refresh hook
    try {
      window.dispatchEvent(new CustomEvent("lux:selfpbExpandedOpen"));
    } catch {}
  }

  function closeExpanded() {
    if (!isExpandedOpen) return;
    isExpandedOpen = false;
    setExpandedOpen(false);

    float.classList.remove("is-open");
    bodyHome.insertBefore(body, bodyNext || null);
    host.classList.remove("spb-mini-empty");

    // restore TTS controls back into its drawer home
    const ttsWrap = document.getElementById("tts-wrap");
    if (ttsWrapHome && ttsWrap) {
      ttsWrapHome.insertBefore(ttsWrap, ttsWrapNext || null);
      delete ttsWrap.dataset.luxInSelfPB;
    }

    // hide placeholder again
    setTtsShellEmpty(false);

    // put Loop label back into its normal row
    if (loopRow && loopLabel) loopRow.appendChild(loopLabel);
    if (loopRow) loopRow.style.display = "";
  }

  expandBtn?.addEventListener("click", () => {
    try { openExpanded(); } catch (_) {}
  });
  floatClose?.addEventListener("click", closeExpanded);

  // ✅ Robust external trigger (used by TTS expand)
  window.addEventListener("lux:openSelfPBExpanded", () => {
    try {
      openExpanded();
    } catch (_) {}
  });

  // ✅ Drag floating expanded window
  let dragOn = false;
  let dragOffX = 0;
  let dragOffY = 0;

  floatHead.addEventListener("pointerdown", (e) => {
    // prevent dragging when clicking the close button
    if (e.target && e.target.id === "spb-floatClose") return;

    // ✅ Swap to grab fist
    const dragHint = float.querySelector("#spb-floatDragHint");
    if (dragHint) dragHint.textContent = "✊";

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
    // ✅ Restore open hand
    const dragHint = float.querySelector("#spb-floatDragHint");
    if (dragHint) dragHint.textContent = "🖐️";

    dragOn = false;
  });

  // ✅ Wiggle close button when user clicks blank space outside the expanded modal
  document.addEventListener("click", (e) => {
    if (!isExpandedOpen) return;

    // If click is inside the float, ignore
    if (float.contains(e.target)) return;

    // If click is on an interactive element (button, input, select, a, label, [role]), ignore
    const interactive = e.target.closest(
      "button, a, input, select, textarea, label, [role='button'], [role='tab'], [tabindex]"
    );
    if (interactive) return;

    // It's a click on blank space — wiggle the close button
    const closeBtn = float.querySelector("#spb-floatClose");
    if (!closeBtn) return;
    closeBtn.classList.remove("wiggle");
    // Force reflow so re-triggering works
    void closeBtn.offsetWidth;
    closeBtn.classList.add("wiggle");
    closeBtn.addEventListener("animationend", () => {
      closeBtn.classList.remove("wiggle");
    }, { once: true });
  }, true); // ← useCapture so it fires before other handlers

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
    karaokeWrap: host.querySelector("#spb-karaokeWrap"),
    karaokeLaneWrap: host.querySelector("#spb-karaokeLaneWrap"),
    karaokeLane: host.querySelector("#spb-karaokeLane"),
    karaokeCursor: host.querySelector("#spb-karaokeCursor"),
  };
}
