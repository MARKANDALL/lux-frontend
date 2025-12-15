// features/interactions/ph-hover.js
// THE PROJECTOR: Creates one Global Tooltip for all phonemes.
// Handles Click-to-Play and Layout Spill-over.

import { safePlay } from "./utils.js";

/* ====================== State ====================== */

let globalTooltip = null;
let currentChip = null;
let watchdogId = null;

export function setupPhonemeHover() {
  ensureGlobalTooltip();
  installChipEvents();
  console.log("[LUX] Phoneme Hover System Active");
}

/* ====================== 1. Global Tooltip DOM ====================== */

function ensureGlobalTooltip() {
  if (globalTooltip) return globalTooltip;

  globalTooltip = document.createElement("div");
  globalTooltip.id = "lux-global-ph-tooltip";
  
  // High Z-Index + Fixed Positioning = Spills over everything
  globalTooltip.style.cssText = `
    position: fixed; 
    z-index: 2147483647; 
    visibility: hidden; 
    opacity: 0; 
    transition: opacity 0.15s ease, transform 0.15s ease;
    background: #1e293b; 
    color: #fff;
    padding: 0;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    width: 300px;
    pointer-events: none;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    overflow: hidden;
  `;
  document.body.appendChild(globalTooltip);
  return globalTooltip;
}

/* ====================== 2. Event Wiring ====================== */

function installChipEvents() {
  // Delegate events from body to catch chips created dynamically
  const root = document.body; 

  root.addEventListener("mouseover", (e) => {
    // Target chips that have been hydrated by ph-chips.js
    const chip = e.target.closest(".phoneme-chip[data-hydrated]");
    if (!chip) return;
    showTooltip(chip);
  });

  root.addEventListener("mouseout", (e) => {
    const chip = e.target.closest(".phoneme-chip[data-hydrated]");
    if (!chip) return;
    // Hide if we leave the chip
    if (currentChip === chip) {
        hideTooltip();
    }
  });

  root.addEventListener("click", (e) => {
    const chip = e.target.closest(".phoneme-chip[data-hydrated]");
    if (!chip) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Check if it actually has a video before trying to play
    if (chip.getAttribute("data-video-src")) {
        handleChipClick(chip);
    }
  }, { capture: true });
}

/* ====================== 3. Render Logic ====================== */

function showTooltip(chip) {
  if (currentChip === chip && globalTooltip.style.visibility === "visible") return;
  
  currentChip = chip;
  
  // Read Data from Attributes (The Librarian put them there)
  const ipa = chip.getAttribute("data-ipa") || "?";
  const tip = chip.getAttribute("data-tip-text") || "";
  const vidSrc = chip.getAttribute("data-video-src");
  const poster = chip.getAttribute("data-poster-src") || "";
  const displayLabel = chip.getAttribute("data-display-ipa") || "";

  // 1. Build Header
  let html = `
    <div style="background: #0f172a; padding: 10px 12px; border-bottom: 1px solid #334155; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <span style="font-weight: 800; font-size: 1.2em; color: #fff;">/${ipa}/</span>
        ${displayLabel ? `<span style="color: #94a3b8; font-size: 0.85em; margin-left: 8px;">${displayLabel}</span>` : ""}
      </div>
    </div>
  `;

  // 2. Build Tip Body
  if (tip) {
      html += `<div style="padding: 12px; color: #e2e8f0; border-bottom: 1px solid #334155;">${escapeHTML(tip)}</div>`;
  } else if (!vidSrc) {
      // Fallback if we have absolutely nothing
      html += `<div style="padding: 12px; color: #94a3b8; font-style: italic;">No details available for /${ipa}/</div>`;
  }

  // 3. Build Video (Conditional)
  if (vidSrc) {
      html += `
        <div style="background: #000; width: 100%; aspect-ratio: 16/9; position:relative;">
           <video id="lux-global-video" src="${vidSrc}" poster="${poster}" 
                  playsinline muted 
                  style="width: 100%; height: 100%; object-fit: contain; display: block;" 
                  preload="metadata"></video>
           <div id="lux-vid-overlay" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.2);">
              <span style="font-size:30px; opacity:0.8;">▶</span>
           </div>
        </div>
        <div style="background:#0f172a; color:#94a3b8; font-size:11px; text-align:center; padding:6px;">
           Click chip to play with sound 🔊
        </div>
      `;
  }

  globalTooltip.innerHTML = html;

  // 4. Position Logic (Smart Flip)
  const rect = chip.getBoundingClientRect();
  const tipH = globalTooltip.offsetHeight || 300; // Estimate if 0
  const winH = window.innerHeight;
  
  let top = rect.bottom + 6; // Default: Bottom
  let left = rect.left + (rect.width / 2) - 150; // Center

  // If hitting bottom of screen, flip to top
  if (top + tipH > winH - 20) {
      top = rect.top - tipH - 6;
  }

  // Clamp horizontal
  if (left < 10) left = 10;
  if (left + 300 > window.innerWidth - 10) left = window.innerWidth - 310;

  globalTooltip.style.top = `${top}px`;
  globalTooltip.style.left = `${left}px`;
  
  // 5. Reveal
  globalTooltip.style.visibility = "visible";
  globalTooltip.style.opacity = "1";
  
  startWatchdog();
}

function hideTooltip() {
  if (globalTooltip) {
    globalTooltip.style.opacity = "0";
    globalTooltip.style.visibility = "hidden";
    
    // Stop video
    const vid = globalTooltip.querySelector("video");
    if (vid) {
        vid.pause();
        vid.currentTime = 0;
    }
  }
  if (currentChip) {
      currentChip.classList.remove("lux-playing-lock");
  }
  currentChip = null;
  stopWatchdog();
}

/* ====================== 4. Click Action ====================== */

function handleChipClick(chip) {
  showTooltip(chip); // Ensure visible
  
  const vid = globalTooltip.querySelector("video");
  const overlay = globalTooltip.querySelector("#lux-vid-overlay");
  
  if (!vid) return;

  // Animation
  chip.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(0.95)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' }
  ], { duration: 200 });
  
  // Play
  vid.muted = false;
  vid.volume = 1.0;
  vid.currentTime = 0;
  
  if (overlay) overlay.style.display = "none";

  vid.play().catch(e => console.warn("Auto-play blocked", e));

  vid.onended = () => {
      if (overlay) overlay.style.display = "flex";
  };
}

/* ====================== 5. Watchdog ====================== */

function startWatchdog() {
  stopWatchdog();
  watchdogId = setInterval(() => {
    if (!currentChip) {
        stopWatchdog();
        return;
    }
    const rect = currentChip.getBoundingClientRect();
    if (
        rect.bottom < 0 || 
        rect.top > window.innerHeight ||
        rect.right < 0 ||
        rect.left > window.innerWidth
    ) {
        hideTooltip();
    }
  }, 200);
}

function stopWatchdog() {
  if (watchdogId) {
      clearInterval(watchdogId);
      watchdogId = null;
  }
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
}