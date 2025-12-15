// ui/interactions/ph-chips.js
// REFACTORED: Uses a "Global Portal" tooltip to break out of scroll containers.

import { norm } from "../../src/data/phonemes/core.js";
import { getPhonemeAssetByIPA } from "../../src/data/phonemes/assets.js";
import { phonemeDetailsByIPA, articulatorPlacement } from "../../src/data/phonemes/details.js";

// The singleton tooltip element
let globalTooltip = null;
let currentChip = null;

function ensureGlobalTooltip() {
  if (globalTooltip) return globalTooltip;
  
  globalTooltip = document.createElement("div");
  globalTooltip.id = "lux-global-ph-tooltip";
  
  // High Z-Index to spill over EVERYTHING
  globalTooltip.style.cssText = `
    position: fixed; 
    z-index: 99999; 
    visibility: hidden; 
    opacity: 0; 
    transition: opacity 0.15s ease;
    background: #1e293b; 
    color: #fff;
    padding: 0;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.25);
    max-width: 300px;
    pointer-events: none; /* Let clicks pass through if needed, though we handle click separately */
    font-family: system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    overflow: hidden;
  `;
  document.body.appendChild(globalTooltip);
  return globalTooltip;
}

export async function initPhonemeChipBehavior(containerSelector = "#prettyResult") {
  const root = document.querySelector(containerSelector);
  if (!root) return;

  const CHIP_SEL = ".phoneme-chip:not([data-hydrated-ipa])";
  const chips = [...root.querySelectorAll(CHIP_SEL)];
  
  if (!chips.length) return;

  ensureGlobalTooltip();

  for (const chip of chips) {
    const ipa = deriveIPA(chip);
    if (!ipa) continue;

    // Cache Data
    chip.setAttribute("data-hydrated-ipa", ipa);
    
    // Wire Events
    chip.addEventListener("mouseenter", () => showTooltip(chip, ipa));
    chip.addEventListener("mouseleave", () => hideTooltip());
    
    // Mobile tap support
    chip.addEventListener("touchstart", (e) => {
        // Prevent ghost clicks but allow scrolling
        // e.preventDefault(); 
        showTooltip(chip, ipa);
    }, { passive: true });
  }
}

function showTooltip(chip, ipa) {
  currentChip = chip;
  const tip = ensureGlobalTooltip();
  
  const asset = getPhonemeAssetByIPA(ipa);
  const key = norm(ipa);
  const details = phonemeDetailsByIPA[key] || articulatorPlacement[key] || {};
  const tipText = details.tip || details.label || "";

  // 1. Render Content
  tip.innerHTML = `
    <div style="background: #0f172a; padding: 10px 12px; border-bottom: 1px solid #334155;">
      <span style="font-weight: 800; font-size: 1.1em; color: #fff;">/${ipa}/</span>
      ${details.ipa ? `<span style="color: #94a3b8; font-size: 0.9em; margin-left: 6px;">${details.ipa}</span>` : ""}
    </div>
    
    ${tipText ? `<div style="padding: 10px 12px; color: #e2e8f0;">${escapeHTML(tipText)}</div>` : ""}
    
    ${asset?.video ? `
      <div style="background: #000; width: 100%; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center;">
         <video id="lux-global-video" src="${asset.video}" poster="${asset.poster||''}" playsinline muted loop 
                style="width: 100%; height: 100%; object-fit: contain; display: block;" 
                preload="metadata"></video>
      </div>
      <div style="background:#0f172a; color:#94a3b8; font-size:11px; text-align:center; padding:4px;">
         Click chip to play with sound 🔊
      </div>
    ` : ""}
  `;

  // 2. Position It
  const rect = chip.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect(); // dimensions after render
  
  let top = rect.bottom + 8;
  let left = rect.left + (rect.width / 2) - (150); // Center align (300px width / 2)

  // Edge detection: Bottom
  if (top + tip.offsetHeight > window.innerHeight) {
      top = rect.top - tip.offsetHeight - 8; // Flip to top
  }
  
  // Edge detection: Left/Right
  if (left < 10) left = 10;
  if (left + 300 > window.innerWidth) left = window.innerWidth - 310;

  tip.style.top = `${top}px`;
  tip.style.left = `${left}px`;
  
  // 3. Show
  tip.style.visibility = "visible";
  tip.style.opacity = "1";
  
  // Auto-play muted video if present
  const vid = tip.querySelector("video");
  if (vid) {
      vid.play().catch(() => {});
  }
}

function hideTooltip() {
  if (globalTooltip) {
    globalTooltip.style.opacity = "0";
    globalTooltip.style.visibility = "hidden";
    // Stop video to save resources
    const vid = globalTooltip.querySelector("video");
    if (vid) vid.pause();
  }
  currentChip = null;
}

// Helper to expose the video element for the click-player
export function getGlobalVideoElement() {
    if (!globalTooltip) return null;
    return globalTooltip.querySelector("video");
}

// --- Helpers ---

const KNOWN_PHONES = new Set([
  "p","b","t","d","k","g","m","n","f","v","s","z","h","l","ɹ","r","w","j","ŋ",
  "θ","ð","ʃ","ʒ","tʃ","dʒ","ɾ","ʔ","ʍ",
  "i","ɪ","e","ɛ","æ","ɑ","ɔ","o","ʊ","u","ʌ","ə","ɚ","ɝ",
  "eɪ","aɪ","ɔɪ","aʊ","oʊ",
  "iy","ih","eh","ae","aa","ao","ah","ax","axr","er","uw","uh","ey","ay","aw","ow","oy",
  "th","dh","sh","zh","ch","jh","dx","ng","hh","wh","q","y"
]);

const PHONE_RX = /\b([a-zɪɛæɑɔʊəɝɚʃʒŋɾʔ]{1,2}|tʃ|dʒ|eɪ|aɪ|ɔɪ|aʊ|oʊ)\b/i;

function deriveIPA(chip) {
  const explicitRaw = chip.getAttribute("data-ipa") || chip.dataset?.ipa || chip.getAttribute("data-phoneme") || chip.dataset?.phoneme || "";
  if (explicitRaw) {
    const normed = norm(explicitRaw);
    if (KNOWN_PHONES.has(normed)) return normed;
    const mExp = String(explicitRaw).match(PHONE_RX);
    if (mExp) {
      const candidate = norm(mExp[1]);
      if (KNOWN_PHONES.has(candidate)) return candidate;
    }
    return "";
  }

  const labelNode = [...chip.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
  const labelText = (labelNode?.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!labelText) return "";
  const mTxt = labelText.match(PHONE_RX);
  if (!mTxt) return "";
  const candidate = norm(mTxt[1]);
  return KNOWN_PHONES.has(candidate) ? candidate : "";
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}