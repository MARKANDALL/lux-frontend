// features/interactions/ph-hover.js
// THE PROJECTOR: Creates one Global Tooltip for all phonemes.
// UPDATED:
// 1. Header Audio: Hover shows box, but CLICK has exclusive control over audio.
// 2. PiP Fix: Added 'disablePictureInPicture' attribute to video tags.

import { safePlay } from "./utils.js";

/* ====================== State ====================== */

let globalTooltip = null;
let currentChip = null;
let watchdogId = null;
let hideTimeout = null; 

export function setupPhonemeHover() {
  ensureGlobalTooltip();
  installChipEvents();
  installHeaderPreview(); 
  console.log("[LUX] Phoneme Hover System Active (Robust Mode)");
}

/* ====================== 1. Global Tooltip DOM ====================== */

function ensureGlobalTooltip() {
  if (globalTooltip) return globalTooltip;

  globalTooltip = document.createElement("div");
  globalTooltip.id = "lux-global-ph-tooltip";
  
  // 1. Basic Styles
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

  // 2. CSS to hide Controls & PiP (Aggressive)
  const style = document.createElement('style');
  style.textContent = `
    #lux-global-ph-tooltip video::-webkit-media-controls { display:none !important; }
    #lux-global-ph-tooltip video::-webkit-media-controls-enclosure { display:none !important; }
    #lux-global-ph-tooltip video::-webkit-media-controls-panel { display:none !important; }
  `;
  globalTooltip.appendChild(style);
  
  // 3. Hover Bridge Logic
  globalTooltip.addEventListener("mouseenter", () => clearTimeout(hideTimeout));
  globalTooltip.addEventListener("mouseleave", () => scheduleHide());

  document.body.appendChild(globalTooltip);
  return globalTooltip;
}

function scheduleHide() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => hideTooltip(), 200);
}

/* ====================== 2. Event Wiring (Row Chips) ====================== */

function installChipEvents() {
  const root = document.body; 

  root.addEventListener("mouseover", (e) => {
    const chip = e.target.closest(".phoneme-chip[data-hydrated]");
    if (!chip || chip.id === "phonemeTitle") return;

    clearTimeout(hideTimeout);
    showTooltip(chip);
  });

  root.addEventListener("mouseout", (e) => {
    const chip = e.target.closest(".phoneme-chip[data-hydrated]");
    if (!chip || chip.id === "phonemeTitle") return;
    scheduleHide();
  });

  root.addEventListener("click", (e) => {
    const chip = e.target.closest(".phoneme-chip[data-hydrated]");
    if (!chip || chip.id === "phonemeTitle") return;
    
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(hideTimeout);
    showTooltip(chip);
    
    if (chip.getAttribute("data-video-src")) {
        handleChipClick(chip);
    }
  }, { capture: true });
}

/* ====================== 3. Header Preview (ARCHEOLOGY FIX) ====================== */

function installHeaderPreview() {
  const preview = document.getElementById("phPreview");
  const demoVid = document.getElementById("phDemo");
  const phHeader = document.getElementById("phonemeHeader");
  const pill = phHeader?.querySelector(".phoneme-chip");
  const tip = document.getElementById("phUnmuteTip");

  if (!preview || !demoVid || !phHeader || !pill) return;
  
  if (pill._hoverBound) return;
  pill._hoverBound = true;

  // 1. HOVER: JUST SHOW IT. DO NOT TOUCH AUDIO STATE.
  function showPreview() {
    // If already open, do absolutely nothing.
    if (preview.style.display === "block") return;

    preview.style.display = "block";
    const rect = phHeader.getBoundingClientRect();
    
    let left = rect.left - 560 - 10; 
    if (left < 10) left = 10;
    let top = rect.top;
    if (top + 390 > window.innerHeight) top = window.innerHeight - 390 - 10;

    preview.style.left = left + "px";
    preview.style.top = top + "px";

    // Only reset if we are opening from scratch
    demoVid.muted = true;
    pill.classList.remove("is-playing");
    
    safePlay(demoVid, demoVid.getAttribute("src"), { muted: true, restart: true });
  }

  function hidePreview() {
    preview.style.display = "none";
    demoVid.pause();
    demoVid.currentTime = 0;
    demoVid.muted = true;
    pill.classList.remove("is-playing");
    if (tip) tip.style.display = "none";
  }

  pill.addEventListener("mouseover", showPreview);
  
  pill.addEventListener("mouseout", (e) => {
      if (e.relatedTarget && (e.relatedTarget === preview || preview.contains(e.relatedTarget))) return;
      hidePreview();
  });
  
  preview.addEventListener("mouseout", (e) => {
      if (e.relatedTarget && (e.relatedTarget === pill || pill.contains(e.relatedTarget))) return;
      hidePreview();
  });

  // 2. CLICK: EXCLUSIVE AUDIO CONTROL
  pill.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Check current state
      const isMuted = demoVid.muted;
      
      // Toggle
      demoVid.muted = !isMuted;
      demoVid.volume = 1.0;

      // Visuals
      pill.classList.toggle("is-playing", !isMuted); // If not muted, it IS playing
      
      // Force Play
      if (!isMuted && demoVid.paused) {
          demoVid.currentTime = 0;
          demoVid.play().catch(e => console.warn(e));
      }

      // Tooltip Feedback
      if (tip) {
          tip.textContent = !isMuted ? "Audio ON 🔊" : "Muted";
          tip.style.display = "block";
          if (tip._tm) clearTimeout(tip._tm);
          tip._tm = setTimeout(() => { tip.style.display = "none"; }, 1500);
      }
  });
}

/* ====================== 4. Row Chip Render Logic (PiP Disabled) ====================== */

function showTooltip(chip) {
  if (currentChip === chip && globalTooltip.style.visibility === "visible") return;
  
  currentChip = chip;
  
  const ipa = chip.getAttribute("data-ipa") || "?";
  const tip = chip.getAttribute("data-tip-text") || "";
  const vidSrc = chip.getAttribute("data-video-src");
  const poster = chip.getAttribute("data-poster-src") || "";
  const displayLabel = chip.getAttribute("data-display-ipa") || "";

  let html = `
    <div style="background: #0f172a; padding: 10px 12px; border-bottom: 1px solid #334155; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <span style="font-weight: 800; font-size: 1.2em; color: #fff;">/${ipa}/</span>
        ${displayLabel ? `<span style="color: #94a3b8; font-size: 0.85em; margin-left: 8px;">${displayLabel}</span>` : ""}
      </div>
    </div>
  `;

  if (tip) {
      html += `<div style="padding: 12px; color: #e2e8f0; border-bottom: 1px solid #334155;">${escapeHTML(tip)}</div>`;
  } else if (!vidSrc) {
      html += `<div style="padding: 12px; color: #94a3b8; font-style: italic;">No details available for /${ipa}/</div>`;
  }

  if (vidSrc) {
      // NOTE: Added 'disablePictureInPicture' attribute here
      html += `
        <div style="background: #000; width: 100%; aspect-ratio: 16/9; position:relative;">
           <video id="lux-global-video" src="${vidSrc}" poster="${poster}" 
                  playsinline muted disablePictureInPicture
                  style="width: 100%; height: 100%; object-fit: contain; display: block;" 
                  preload="metadata"></video>
           <div id="lux-vid-overlay" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.2); pointer-events:none;">
              <span style="font-size:30px; opacity:0.8;">▶</span>
           </div>
        </div>
        <div style="background:#0f172a; color:#94a3b8; font-size:11px; text-align:center; padding:6px;">
           Click chip to play with sound 🔊
        </div>
      `;
  }

  globalTooltip.innerHTML = html;

  // Position It - ZERO GAP
  const rect = chip.getBoundingClientRect();
  const tipH = globalTooltip.offsetHeight || 300; 
  const winH = window.innerHeight;
  
  let top = rect.bottom; 
  let left = rect.left + (rect.width / 2) - 150; 

  if (top + tipH > winH - 10) {
      top = rect.top - tipH; 
  }

  if (left < 10) left = 10;
  if (left + 300 > window.innerWidth - 10) left = window.innerWidth - 310;

  globalTooltip.style.top = `${top}px`;
  globalTooltip.style.left = `${left}px`;
  
  globalTooltip.style.visibility = "visible";
  globalTooltip.style.opacity = "1";
  
  // Timer handles the watchdog now
}

function hideTooltip() {
  if (globalTooltip) {
    globalTooltip.style.opacity = "0";
    globalTooltip.style.visibility = "hidden";
    
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

/* ====================== 5. Click Action ====================== */

function handleChipClick(chip) {
  clearTimeout(hideTimeout);
  showTooltip(chip); 
  
  const vid = globalTooltip.querySelector("video");
  const overlay = globalTooltip.querySelector("#lux-vid-overlay");
  
  if (!vid) return;

  chip.classList.add("lux-playing-lock");
  
  vid.muted = false;
  vid.volume = 1.0;
  vid.currentTime = 0;
  
  if (overlay) overlay.style.display = "none";

  vid.play().catch(e => console.warn("Auto-play blocked", e));

  vid.onended = () => {
      chip.classList.remove("lux-playing-lock");
      if (overlay) overlay.style.display = "flex";
  };
}

/* ====================== 6. Watchdog ====================== */

function startWatchdog() {
  stopWatchdog();
  watchdogId = setInterval(() => {
    if (!currentChip) {
        stopWatchdog();
        return;
    }
    const rect = currentChip.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
        clearTimeout(hideTimeout);
        hideTooltip();
    }
  }, 500);
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
