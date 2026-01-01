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
    width: 300px;
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
  `;
  document.head.appendChild(style);
}

function scheduleHide() {
  clearTimeout(hideTimeout);
  hideTimeout = setTimeout(() => hideTooltip(), 200);
}

/* ====================== 2. Event Wiring (Row Chips) ====================== */

function installChipEvents() {
  const root = document.body;

  // Hover in: show tooltip for row chips
  root.addEventListener("mouseover", (e) => {
    const chip = e.target.closest(".phoneme-chip[data-hydrated]");
    if (!chip) return;
    if (chip.id === "phonemeTitle") return;

    clearTimeout(hideTimeout);
    showTooltip(chip);
  });

  // Hover out: hide tooltip (but DON'T hide if moving into tooltip itself)
  root.addEventListener("mouseout", (e) => {
    const chip = e.target.closest(".phoneme-chip[data-hydrated]");
    if (!chip) return;
    if (chip.id === "phonemeTitle") return;

    const to = e.relatedTarget;
    if (to && (to === globalTooltip || globalTooltip.contains(to))) return;

    scheduleHide();
  });

  // === CRITICAL: Capture-phase click handler ("trap door") ===
  // Only swallow clicks for chips that ACTUALLY have a tooltip video src.
  // Never swallow header pill clicks.
  root.addEventListener(
    "click",
    (e) => {
      const chip = e.target.closest(".phoneme-chip[data-hydrated]");
      if (!chip) return;

      // Let header pill clicks pass through (ph-audio.js and/or header preview click)
      if (chip.id === "phonemeTitle") return;

      // Only hijack clicks for chips with tooltip video src
      const vidSrc = chip.getAttribute("data-video-src") || chip.dataset.videoSrc;
      if (!vidSrc) return;

      // Now we are truly handling this click -> swallow it
      e.preventDefault();
      e.stopPropagation();

      clearTimeout(hideTimeout);
      handleChipClick(chip);
    },
    { capture: true }
  );
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

function showTooltip(chip) {
  // If same chip is already showing, do nothing
  if (currentChip === chip && globalTooltip.style.visibility === "visible") return;

  currentChip = chip;

  const ipa = chip.getAttribute("data-ipa") || "?";

  const tipPlain =
    chip.getAttribute("data-tip-plain") ||
    chip.getAttribute("data-tip-text") ||
    "";

  const tipTech = chip.getAttribute("data-tip-tech") || "";
  const tipMistake = chip.getAttribute("data-tip-mistake") || "";

  const vidSrc = chip.getAttribute("data-video-src") || "";
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
    <div style="background:#0f172a; padding:10px 12px; border-bottom:1px solid #334155; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <span style="font-weight:800; font-size:1.2em; color:#fff;">/${escapeHTML(ipa)}/</span>
        ${
          displayLabel
            ? `<span style="color:#94a3b8; font-size:0.95em; margin-left:8px;">${escapeHTML(displayLabel)}</span>`
            : ""
        }
      </div>
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

  if (vidSrc) {
    html += `
      <div style="background:#000; width:100%; aspect-ratio:16/9; position:relative;">
        <video id="lux-global-video"
          src="${vidSrc}"
          poster="${poster}"
          playsinline
          muted
          disablePictureInPicture
          style="width:100%; height:100%; object-fit:contain; display:block;"
          preload="metadata"></video>

        <div id="lux-vid-overlay"
          style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.2); pointer-events:none;">
          <span style="font-size:30px; opacity:0.8;">▶</span>
        </div>
      </div>

      <div style="background:#0f172a; color:#94a3b8; font-size:11px; text-align:center; padding:6px;">
        Click chip to play with sound 🔊
      </div>
    `;
  }

  tooltipContent.innerHTML = html;

  // Wire the carousel now that DOM exists
  initTooltipTextCarousel(panels);

  // Position (zero gap)
  const rect = chip.getBoundingClientRect();
  const tipH = globalTooltip.offsetHeight || 300;
  const winH = window.innerHeight;

  let top = rect.bottom;
  let left = rect.left + rect.width / 2 - 150;

  if (top + tipH > winH - 10) top = rect.top - tipH;

  if (left < 10) left = 10;
  if (left + 300 > window.innerWidth - 10) left = window.innerWidth - 310;

  globalTooltip.style.top = `${top}px`;
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

function hideTooltip() {
  if (globalTooltip) {
    globalTooltip.style.opacity = "0";
    globalTooltip.style.visibility = "hidden";

    const vid = globalTooltip.querySelector("video");
    if (vid) {
      vid.pause();
      vid.currentTime = 0;
      // leave muted as-is; it will be re-created on next showTooltip anyway
    }
  }

  if (currentChip) currentChip.classList.remove("lux-playing-lock");
  currentChip = null;
}

/* ====================== 5. Click Action ====================== */

function handleChipClick(chip) {
  showTooltip(chip);

  const vid = globalTooltip.querySelector("video");
  const overlay = globalTooltip.querySelector("#lux-vid-overlay");
  if (!vid) return;

  chip.classList.add("lux-playing-lock");

  vid.muted = false;
  vid.volume = 1.0;
  vid.currentTime = 0;

  if (overlay) overlay.style.display = "none";

  vid.play().catch((e) => console.warn("Auto-play blocked", e));

  vid.onended = () => {
    chip.classList.remove("lux-playing-lock");
    if (overlay) overlay.style.display = "flex";
  };
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
