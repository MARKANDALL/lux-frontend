// features/interactions/ph-hover.js
// Global phoneme tooltip + header phoneme preview behavior.
//
// Goals:
// 1) Row chips: hover shows global tooltip, click plays tooltip video with sound.
// 2) Header pill: hover shows preview box, click toggles audio ON/OFF reliably.
// 3) CRITICAL: capture-phase click "trap door" must NOT swallow header clicks
//    or clicks for chips without tooltip videos.
// 4) Idempotent boot: safe if loaded twice.

import { safePlay } from "./utils.js";

/* ====================== State ====================== */

let globalTooltip = null;
let tooltipContent = null; // inner container so we don't wipe styles
let currentChip = null;
let hideTimeout = null;
let isInitialized = false;

// Header preview state (persist across hover show/hide)
let headerAudioOn = false;

// Pinned tooltip (mobile tap behavior / desktop click pin)
let tooltipPinned = false;
let outsideCloseBound = false;

/* ====================== Public API ====================== */

export function setupPhonemeHover() {
  if (isInitialized) {
    console.warn("[LUX] Phoneme Hover System already active. Skipping re-init.");
    return;
  }

  ensureGlobalTooltip();
  installChipEvents();
  installHeaderPreview();

  isInitialized = true;
  console.log("[LUX] Phoneme Hover System Active (Robust Mode)");
}

/* ====================== 1. Global Tooltip DOM ====================== */

function ensureGlobalTooltip() {
  if (globalTooltip) return globalTooltip;

  // Put the CSS in <head> ONCE (do not attach inside tooltip,
  // because tooltipContent.innerHTML updates would wipe it).
  injectTooltipCSS();

  globalTooltip = document.createElement("div");
  globalTooltip.id = "lux-global-ph-tooltip";

  globalTooltip.style.cssText = `
    position: fixed;
    z-index: var(--z-popover);
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.15s ease, transform 0.15s ease;
    background: #1e293b;
    color: #fff;
    padding: 0;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    width: min(560px, calc(100vw - 20px));
    pointer-events: auto;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    overflow: hidden;
  `;

  tooltipContent = document.createElement("div");
  tooltipContent.id = "lux-global-ph-tooltip-content";
  globalTooltip.appendChild(tooltipContent);

  // Hover bridge: keep tooltip open while mouse is over it
  globalTooltip.addEventListener("mouseenter", () => clearTimeout(hideTimeout));
  globalTooltip.addEventListener("mouseleave", () => scheduleHide());

  document.body.appendChild(globalTooltip);
  return globalTooltip;
}

function injectTooltipCSS() {
  if (document.getElementById("lux-global-ph-tooltip-style")) return;

  const style = document.createElement("style");
  style.id = "lux-global-ph-tooltip-style";
  style.textContent = `
    #lux-global-ph-tooltip video::-webkit-media-controls { display:none !important; }
    #lux-global-ph-tooltip video::-webkit-media-controls-enclosure { display:none !important; }
    #lux-global-ph-tooltip video::-webkit-media-controls-panel { display:none !important; }

    /* ---- Text carousel (Plain / Technical / Common mix-ups) ---- */
    #lux-global-ph-tooltip .lux-ph-text-head{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:8px;
      padding:8px 10px;
      background:#0f172a;
      border-bottom:1px solid #334155;
    }
    #lux-global-ph-tooltip .lux-ph-nav-btn{
      width:28px;
      height:28px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,0.12);
      background: rgba(255,255,255,0.06);
      color:#e2e8f0;
      cursor:pointer;
      line-height: 1;
      display:flex;
      align-items:center;
      justify-content:center;
      user-select:none;
    }
    #lux-global-ph-tooltip .lux-ph-nav-btn:disabled{
      opacity:0.35;
      cursor:default;
    }
    #lux-global-ph-tooltip .lux-ph-title{
      flex:1;
      text-align:center;
      font-size:12px;
      letter-spacing:0.02em;
      color:#cbd5e1;
      font-weight:800;
    }
    #lux-global-ph-tooltip .lux-ph-viewport{ overflow:hidden; }
    #lux-global-ph-tooltip .lux-ph-track{
      display:flex;
      width:300%;
      transition: transform 220ms ease;
    }
    #lux-global-ph-tooltip .lux-ph-panel{
      flex: 0 0 100%;
      padding: 10px 12px 12px;
      color:#e2e8f0;
    }
    #lux-global-ph-tooltip .lux-ph-panel.is-empty{
      color:#94a3b8;
      font-style:italic;
    }
    #lux-global-ph-tooltip .lux-ph-dots{
      display:flex;
      justify-content:center;
      gap:6px;
      padding: 8px 0 10px;
      background:#0f172a;
      border-bottom:1px solid #334155;
    }
    #lux-global-ph-tooltip .lux-ph-dot{
      width:6px;
      height:6px;
      border-radius:999px;
      background: rgba(255,255,255,0.55);
      opacity:0.55;
      transform: scale(1);
      transition: transform 180ms ease, opacity 180ms ease;
    }
    #lux-global-ph-tooltip .lux-ph-dot.is-active{
      opacity:1;
      transform: scale(1.25);
      background: rgba(255,255,255,0.9);
    }
    #lux-global-ph-tooltip .lux-ph-words{
      padding: 10px 12px 12px;
      font-size: 12px;
      color:#94a3b8;
      border-bottom:1px solid #334155;
    }
    #lux-global-ph-tooltip .lux-ph-words b{ color:#cbd5e1; }

    /* ---- Video block (bigger + clickable play system) ---- */
    #lux-global-ph-tooltip .lux-ph-vidBox{
      background:#000;
      padding: 8px;
    }

    #lux-global-ph-tooltip .lux-ph-vidControls{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:10px;
    }

    #lux-global-ph-tooltip .lux-ph-vidBtns{
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      align-items:center;
    }

    #lux-global-ph-tooltip .lux-ph-miniBtn{
      border:0;
      background:rgba(255,255,255,0.10);
      color:#e2e8f0;
      border-radius:999px;
      padding:6px 10px;
      font-size:12px;
      font-weight:800;
      cursor:pointer;
    }

    #lux-global-ph-tooltip .lux-ph-miniBtn.is-primary{
      background:rgba(96,165,250,0.35);
    }

    #lux-global-ph-tooltip .lux-ph-miniBtn:active{
      transform: translateY(1px);
    }

    #lux-global-ph-tooltip .lux-ph-speed{
      background: rgba(255,255,255,0.10);
      color:#e2e8f0;
      border: 0;
      border-radius: 999px;
      padding: 6px 10px;
      font-weight: 800;
      font-size: 12px;
      cursor: pointer;
    }

    #lux-global-ph-tooltip .lux-ph-vidGrid{
      display:grid;
      gap: 6px;
    }

    #lux-global-ph-tooltip .lux-ph-vidGrid[data-cols="1"]{
      grid-template-columns:1fr;
    }

    #lux-global-ph-tooltip .lux-ph-vidGrid[data-cols="2"]{
      grid-template-columns:repeat(2, minmax(0, 1fr));
    }

    #lux-global-ph-tooltip .lux-ph-vidTile{
      position:relative;
      border-radius:12px;
      overflow:hidden;
      background:#05070f;
      aspect-ratio: 16 / 10;
      cursor:pointer;
    }

    #lux-global-ph-tooltip .lux-ph-vidTile video{
      position:absolute;
      inset:0;
      width:100%;
      height:100%;
      object-fit: cover;
      transform: scale(1.06);
    }

    #lux-global-ph-tooltip .lux-ph-vidOverlay{
      position:absolute;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
      background:rgba(0,0,0,0.25);
      font-size:34px;
      opacity:0.88;
      transition: opacity 140ms ease;
      pointer-events:none;
    }

    #lux-global-ph-tooltip .lux-ph-vidTile.is-playing .lux-ph-vidOverlay{
      opacity:0;
    }

    #lux-global-ph-tooltip .lux-ph-vidLabel{
      position:absolute;
      left:8px;
      bottom:8px;
      background:rgba(0,0,0,0.55);
      color:#e2e8f0;
      font-size:11px;
      padding:4px 8px;
      border-radius:999px;
      font-weight:800;
    }

    #lux-global-ph-tooltip .lux-ph-vidHint{
      margin-top:10px;
      background:#0f172a;
      color:#94a3b8;
      font-size:11px;
      text-align:center;
      padding:7px;
      border-radius:10px;
    }
  `;
  document.head.appendChild(style);
}

function scheduleHide() {
  if (tooltipPinned) return;
  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => hideTooltip(), 200);
}

function bindOutsideCloseOnce() {
  if (outsideCloseBound) return;
  outsideCloseBound = true;

  // Close if you click/tap outside tooltip AND outside any phoneme chip
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!tooltipPinned) return;

      const t = e.target;
      if (!t) return;

      // Click inside tooltip -> keep open
      if (globalTooltip && (t === globalTooltip || globalTooltip.contains(t))) return;

      // Click on a chip -> let chip handler decide
      const chip = t.closest?.(".phoneme-chip[data-hydrated]");
      if (chip && chip.id !== "phonemeTitle") return;

      // Otherwise close
      hideTooltip();
    },
    { capture: true }
  );
}

/* ====================== 2. Event Wiring (Row Chips) ====================== */

function installChipEvents() {
  const root = document.body;

  // Hover in: show tooltip for row chips
  root.addEventListener("mouseover", (e) => {
    if (tooltipPinned) return;

    const chip = e.target.closest(".phoneme-chip[data-hydrated]");
    if (!chip) return;
    if (chip.id === "phonemeTitle") return;

    clearTimeout(hideTimeout);
    showTooltip(chip, { pinned: false });
  });

  // Hover out: hide tooltip (but DON'T hide if moving into tooltip itself)
  root.addEventListener("mouseout", (e) => {
    if (tooltipPinned) return;

    const chip = e.target.closest(".phoneme-chip[data-hydrated]");
    if (!chip) return;
    if (chip.id === "phonemeTitle") return;

    const to = e.relatedTarget;
    if (to && (to === globalTooltip || globalTooltip.contains(to))) return;

    scheduleHide();
  });

  // === CRITICAL: Capture-phase click handler ("trap door") ===
  // Never swallow header pill clicks.
  // For row chips: click pins the tooltip (mobile-friendly) and NEVER autoplays.
  root.addEventListener(
    "click",
    (e) => {
      const chip = e.target.closest(".phoneme-chip[data-hydrated]");
      if (!chip) return;

      // Let header pill clicks pass through (ph-audio.js and/or header preview click)
      if (chip.id === "phonemeTitle") return;

      // We handle row-chip clicks -> pin tooltip
      e.preventDefault();
      e.stopPropagation();

      // Toggle behavior: clicking the same chip while pinned closes it
      if (tooltipPinned && currentChip === chip) {
        hideTooltip();
        return;
      }

      clearTimeout(hideTimeout);
      handleChipClick(chip);
    },
    { capture: true }
  );

  // Ensure outside-close exists (once)
  bindOutsideCloseOnce();
}

/* ====================== 3. Header Preview ====================== */

function installHeaderPreview() {
  const preview = document.getElementById("phPreview");
  const demoVid = document.getElementById("phDemo");
  const phHeader = document.getElementById("phonemeHeader");
  const pill = phHeader?.querySelector(".phoneme-chip");
  const tip = document.getElementById("phUnmuteTip");

  if (!preview || !demoVid || !phHeader || !pill) return;

  if (pill._hoverBound) return;
  pill._hoverBound = true;

  function positionPreview() {
    const rect = phHeader.getBoundingClientRect();

    let left = rect.left - 560 - 10;
    if (left < 10) left = 10;

    let top = rect.top;
    if (top + 390 > window.innerHeight) top = window.innerHeight - 390 - 10;

    preview.style.left = left + "px";
    preview.style.top = top + "px";
  }

  function showPreview() {
    if (preview.style.display === "block") return;

    preview.style.display = "block";
    positionPreview();

    // IMPORTANT: do NOT force-mute on hover.
    // Respect current headerAudioOn state.
    demoVid.muted = !headerAudioOn;
    demoVid.volume = 1.0;

    // Start/restart muted or unmuted based on state.
    // If you want it to always restart when opened, keep restart:true.
    safePlay(demoVid, demoVid.getAttribute("src"), {
      muted: demoVid.muted,
      restart: true,
    });

    pill.classList.toggle("is-playing", headerAudioOn);

    if (tip) tip.style.display = "none";
  }

  function hidePreview() {
    preview.style.display = "none";
    demoVid.pause();
    demoVid.currentTime = 0;

    // IMPORTANT: do NOT force demoVid.muted=true here;
    // leaving state intact makes click-toggle feel consistent.
    pill.classList.remove("is-playing");

    if (tip) tip.style.display = "none";
  }

  // Hover behavior: pill <-> preview bridge
  pill.addEventListener("mouseover", showPreview);

  pill.addEventListener("mouseout", (e) => {
    const to = e.relatedTarget;
    if (to && (to === preview || preview.contains(to))) return;
    hidePreview();
  });

  preview.addEventListener("mouseout", (e) => {
    const to = e.relatedTarget;
    if (to && (to === pill || pill.contains(to))) return;
    hidePreview();
  });
}

/* ====================== 4. Tooltip Render ====================== */

function showTooltip(chip, { pinned = false } = {}) {
  // If same chip is already showing, do nothing
  if (currentChip === chip && globalTooltip.style.visibility === "visible") {
    tooltipPinned = !!pinned || tooltipPinned;
    return;
  }

  currentChip = chip;
  tooltipPinned = !!pinned;

  const ipa = chip.getAttribute("data-ipa") || "?";

  const tipPlain =
    chip.getAttribute("data-tip-plain") ||
    chip.getAttribute("data-tip-text") ||
    "";

  const tipTech = chip.getAttribute("data-tip-tech") || "";
  const tipMistake = chip.getAttribute("data-tip-mistake") || "";

  const vidSrc = chip.getAttribute("data-video-src") || chip.dataset.videoSrc;
  const vidFrontSrc = chip.getAttribute("data-video-front-src") || chip.dataset.videoFrontSrc;

  const poster = chip.getAttribute("data-poster-src") || "";
  const displayLabel = chip.getAttribute("data-display-ipa") || "";

  // Examples (optional)
  let words = [];
  const wordsRaw = chip.getAttribute("data-tip-words") || "";
  if (wordsRaw) {
    try {
      const parsed = JSON.parse(wordsRaw);
      if (Array.isArray(parsed)) words = parsed.filter(Boolean).slice(0, 3);
    } catch (_) {}
  }

  const panels = [
    {
      title: "Plain",
      text: tipPlain,
      empty: `No details available for /${ipa}/ yet.`,
    },
    {
      title: "Technical",
      text: tipTech,
      empty: "Technical note coming soon.",
    },
    {
      title: "Common mix-ups",
      text: tipMistake,
      empty: "No common mistakes recorded yet.",
    },
  ];

  let html = `
    <div style="background:#0f172a; padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
      <div>
        <span style="font-weight:800; font-size:1.2em; color:#fff;">/${escapeHTML(ipa)}/</span>
        ${
          displayLabel
            ? `<span style="color:#94a3b8; font-size:0.95em; margin-left:8px;">${escapeHTML(displayLabel)}</span>`
            : ""
        }
      </div>

      <button id="lux-ph-close" type="button"
        style="border:0; background:rgba(255,255,255,0.08); color:#e2e8f0; border-radius:10px; width:30px; height:30px; cursor:pointer; font-size:16px; line-height:30px;">
        ✕
      </button>
    </div>

    <div class="lux-ph-text-head">
      <button id="lux-ph-text-prev" class="lux-ph-nav-btn" type="button" aria-label="Previous panel">‹</button>
      <div id="lux-ph-text-title" class="lux-ph-title"></div>
      <button id="lux-ph-text-next" class="lux-ph-nav-btn" type="button" aria-label="Next panel">›</button>
    </div>

    <div class="lux-ph-viewport">
      <div id="lux-ph-text-track" class="lux-ph-track">
        ${panels
          .map((p) => {
            const has = (p.text || "").trim().length > 0;
            const t = has ? p.text : p.empty;
            return `<div class="lux-ph-panel${has ? "" : " is-empty"}">${escapeHTML(t)}</div>`;
          })
          .join("")}
      </div>
    </div>

    <div id="lux-ph-text-dots" class="lux-ph-dots">
      ${panels.map((_, i) => `<span class="lux-ph-dot${i === 0 ? " is-active" : ""}"></span>`).join("")}
    </div>
  `;

  if (words.length) {
    html += `<div class="lux-ph-words"><b>Examples:</b> ${words.map(escapeHTML).join(" • ")}</div>`;
  }

  html += `
    ${
      vidSrc || vidFrontSrc
        ? `
  <div class="lux-ph-vidBox">
    <div class="lux-ph-vidControls">
      <div class="lux-ph-vidBtns">
        ${vidSrc ? `<button id="lux-ph-play-side" class="lux-ph-miniBtn" type="button">Side</button>` : ``}
        ${vidFrontSrc ? `<button id="lux-ph-play-front" class="lux-ph-miniBtn" type="button">Front</button>` : ``}
        ${vidSrc && vidFrontSrc ? `<button id="lux-ph-play-both" class="lux-ph-miniBtn is-primary" type="button">Both</button>` : ``}
        <button id="lux-ph-stop" class="lux-ph-miniBtn" type="button">Stop</button>
        <button id="lux-ph-loop" class="lux-ph-miniBtn" type="button" data-loop="0">Repeat Off</button>
        <select id="lux-ph-speed" class="lux-ph-speed">
          <option value="0.5">0.5×</option>
          <option value="0.75">0.75×</option>
          <option value="1" selected>1×</option>
          <option value="1.25">1.25×</option>
          <option value="1.5">1.5×</option>
        </select>
      </div>

      <button id="lux-ph-sound" class="lux-ph-miniBtn" type="button" data-sound="1" aria-label="Toggle sound">
        🔊
      </button>
    </div>

    <div class="lux-ph-vidGrid" data-cols="${vidFrontSrc ? 2 : 1}">
      ${
        vidSrc
          ? `
      <div class="lux-ph-vidTile" data-vid="side">
        <video id="lux-global-video-side"
          data-vid="side"
          src="${vidSrc}"
          playsinline
          preload="metadata">
        </video>
        <div class="lux-ph-vidOverlay" aria-hidden="true"><span>▶</span></div>
        <div class="lux-ph-vidLabel">Side</div>
      </div>`
          : ``
      }

      ${
        vidFrontSrc
          ? `
      <div class="lux-ph-vidTile" data-vid="front">
        <video id="lux-global-video-front"
          data-vid="front"
          src="${vidFrontSrc}"
          playsinline
          preload="metadata">
        </video>
        <div class="lux-ph-vidOverlay" aria-hidden="true"><span>▶</span></div>
        <div class="lux-ph-vidLabel">Front</div>
      </div>`
          : ``
      }
    </div>

    <div class="lux-ph-vidHint">
      Tap a video to play • Use “Both” to sync • Sound optional
    </div>
  </div>
`
        : ``
    }
  `;

  tooltipContent.innerHTML = html;

  // Wire the carousel now that DOM exists
  initTooltipTextCarousel(panels);

  // Wire the new video controls
  initTooltipVideoControls();

  // Close button
  const closeBtn = globalTooltip?.querySelector("#lux-ph-close");
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideTooltip();
    };
  }

  // Position (zero gap)
  // We clamp using actual tooltip width (responsive)
  globalTooltip.style.visibility = "hidden";
  globalTooltip.style.opacity = "0";
  globalTooltip.style.top = `0px`;
  globalTooltip.style.left = `0px`;

  // Force a layout pass so we can measure
  const rect = chip.getBoundingClientRect();
  const tipRect = globalTooltip.getBoundingClientRect();
  const tipW = tipRect.width || Math.min(560, window.innerWidth - 20);
  const tipH = tipRect.height || 320;

  const winH = window.innerHeight;

  let top = rect.bottom;
  let left = rect.left + rect.width / 2 - tipW / 2;

  if (top + tipH > winH - 10) top = rect.top - tipH;

  if (left < 10) left = 10;
  if (left + tipW > window.innerWidth - 10) left = window.innerWidth - tipW - 10;

  globalTooltip.style.top = `${Math.max(10, top)}px`;
  globalTooltip.style.left = `${left}px`;
  globalTooltip.style.visibility = "visible";
  globalTooltip.style.opacity = "1";
}

function initTooltipTextCarousel(panels) {
  const track = globalTooltip?.querySelector("#lux-ph-text-track");
  const title = globalTooltip?.querySelector("#lux-ph-text-title");
  const prev = globalTooltip?.querySelector("#lux-ph-text-prev");
  const next = globalTooltip?.querySelector("#lux-ph-text-next");
  const dotsWrap = globalTooltip?.querySelector("#lux-ph-text-dots");

  if (!track || !title || !prev || !next || !dotsWrap) return;

  const dots = [...dotsWrap.querySelectorAll(".lux-ph-dot")];
  const max = panels.length;

  let idx = 0;

  function render() {
    track.style.transform = `translateX(-${idx * 100}%)`;
    title.textContent = panels[idx]?.title || "";

    dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));

    const disabled = max <= 1;
    prev.disabled = disabled;
    next.disabled = disabled;
  }

  function step(delta) {
    if (max <= 1) return;
    idx = (idx + delta + max) % max;
    render();
  }

  prev.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    step(-1);
  };

  next.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    step(1);
  };

  render();
}

function initTooltipVideoControls() {
  const sideVid = globalTooltip?.querySelector("#lux-global-video-side");
  const frontVid = globalTooltip?.querySelector("#lux-global-video-front");

  const tileSide = globalTooltip?.querySelector('.lux-ph-vidTile[data-vid="side"]');
  const tileFront = globalTooltip?.querySelector('.lux-ph-vidTile[data-vid="front"]');

  const btnSide = globalTooltip?.querySelector("#lux-ph-play-side");
  const btnFront = globalTooltip?.querySelector("#lux-ph-play-front");
  const btnBoth = globalTooltip?.querySelector("#lux-ph-play-both");
  const btnStop = globalTooltip?.querySelector("#lux-ph-stop");
  const btnSound = globalTooltip?.querySelector("#lux-ph-sound");
  const btnLoop = globalTooltip?.querySelector("#lux-ph-loop");
  const speedSel = globalTooltip?.querySelector("#lux-ph-speed");

  if (!sideVid && !frontVid) return;

  // Default sound ON
  let soundOn = true;

  // Default loop OFF
  let loopOn = false;

  function applySound() {
    const txt = soundOn ? "🔊" : "🔇";
    if (btnSound) {
      btnSound.textContent = txt;
      btnSound.setAttribute("data-sound", soundOn ? "1" : "0");
    }
    for (const v of [sideVid, frontVid]) {
      if (!v) continue;
      // Sound preference affects play attempts, but default is unmuted.
      v.muted = !soundOn;
      v.volume = 1.0;
    }
  }

  function applyLoop() {
    for (const v of [sideVid, frontVid]) {
      if (!v) continue;
      v.loop = loopOn;
    }
    if (btnLoop) {
      btnLoop.textContent = loopOn ? "Repeat On" : "Repeat Off";
      btnLoop.setAttribute("data-loop", loopOn ? "1" : "0");
    }
  }

  function applySpeed() {
    const rate = parseFloat(speedSel?.value || "1");
    for (const v of [sideVid, frontVid]) {
      if (!v) continue;
      v.playbackRate = rate;
    }
  }

  async function gesturePlay(v, { restart = true } = {}) {
    if (!v) return;
    try {
      if (restart) v.currentTime = 0;
    } catch (_) {}

    // Pressing play should auto-unmute by default (unless user toggled sound off)
    v.muted = !soundOn ? true : false;
    v.volume = 1.0;

    try {
      await v.play();
    } catch (_) {
      // Fallback: browsers may block sound
      try {
        v.muted = true;
        await v.play();
      } catch (_) {}
    }
  }

  function stopAll() {
    for (const v of [sideVid, frontVid]) {
      if (!v) continue;
      try { v.pause(); } catch (_) {}
      try { v.currentTime = 0; } catch (_) {}
    }
  }

  function bindTile(v, tile) {
    if (!v || !tile) return;

    const syncClass = () => {
      tile.classList.toggle("is-playing", !v.paused);
    };

    v.addEventListener("play", syncClass);
    v.addEventListener("pause", syncClass);
    v.addEventListener("ended", syncClass);
    syncClass();

    tile.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (v.paused) await gesturePlay(v, { restart: false });
      else v.pause();
    });
  }

  bindTile(sideVid, tileSide);
  bindTile(frontVid, tileFront);

  btnSound?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    soundOn = !soundOn;
    applySound();
  });

  btnLoop?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    loopOn = !loopOn;
    applyLoop();
  });

  speedSel?.addEventListener("change", applySpeed);

  btnSide?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await gesturePlay(sideVid, { restart: true });
  });

  btnFront?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await gesturePlay(frontVid, { restart: true });
  });

  btnBoth?.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Restart both to sync “as close as possible”
    try { if (sideVid) sideVid.currentTime = 0; } catch (_) {}
    try { if (frontVid) frontVid.currentTime = 0; } catch (_) {}
    applySound();
    applySpeed();
    await Promise.all([
      sideVid ? gesturePlay(sideVid, { restart: false }) : Promise.resolve(),
      frontVid ? gesturePlay(frontVid, { restart: false }) : Promise.resolve(),
    ]);
  });

  btnStop?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    stopAll();
  });

  // Apply initial states
  applySound();
  applyLoop();
  applySpeed();
}

function hideTooltip() {
  tooltipPinned = false;

  if (globalTooltip) {
    globalTooltip.style.opacity = "0";
    globalTooltip.style.visibility = "hidden";

    const vids = [...globalTooltip.querySelectorAll("video")];
    for (const v of vids) {
      try { v.pause(); } catch (_) {}
      try { v.currentTime = 0; } catch (_) {}
    }
  }

  if (currentChip) currentChip.classList.remove("lux-playing-lock");
  currentChip = null;
}

/* ====================== 5. Click Action ====================== */

function handleChipClick(chip) {
  // Click pins open (mobile-friendly). Nothing autoplays.
  showTooltip(chip, { pinned: true });

  chip.classList.add("lux-playing-lock");
}

/* ====================== Utils ====================== */

function escapeHTML(str) {
  return String(str).replace(/[&<>'"]/g, (tag) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    }[tag])
  );
}
