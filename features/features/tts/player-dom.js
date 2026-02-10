// features/features/tts/player-dom.js
// Pure DOM: HTML templates and element selection helpers.

import { VOICES, DEFAULT_SPEED, DEFAULT_PITCH_ST } from "./player-core.js";

// Helper: Scoped query selector
export const $ = (root, sel) => root.querySelector(sel);

// Helper: Get text from input or selection
export function getCurrentText() {
  const el =
    document.querySelector("#referenceText") ||
    document.querySelector("#free-input") ||
    document.querySelector("#reference-text") ||
    document.querySelector("textarea");
  const typed = el?.value?.trim();
  const sel = window.getSelection()?.toString()?.trim();
  return (typed || sel || "").trim();
}

export function populateStyles(styleSel, caps, voiceId) {
  if (!styleSel) return;
  const styles = caps?.[voiceId]?.styles || [];
  const keep = styleSel.value;
  styleSel.innerHTML =
    `<option value="">(neutral)</option>` +
    styles.map((s) => `<option value="${s}">${s}</option>`).join("");
  if (keep && styles.includes(keep)) styleSel.value = keep;
}

export function renderControls(mount) {
  const voiceOptions = VOICES.map(
    (v) => `<option value="${v.id}">${v.label}</option>`
  ).join("");

  mount.innerHTML = `
      <div id="tts-shell">
        <div id="tts-placeholder" class="tts-placeholder"></div>

        <div id="tts-wrap">
          <div class="tts-box tts-compact" style="padding: 10px 12px; position:relative;">
            <button id="tts-expand" class="tts-expandBtn" type="button" title="Expand Text-to-Speech">Expand</button>
            <div class="tts-head">
              <div id="tts-note" class="tts-note" aria-live="polite" style="text-align:center; min-height:0;"></div>
            </div>
    
            <label class="tts-voice" style="width:100%; display:flex !important; flex-direction:column !important; align-items:center !important; margin-bottom:4px;">
              <span style="font-weight:700; margin-bottom:2px; font-size:1.05em; color:#333;">Voice</span>
              <select id="tts-voice" style="width:98%; padding:4px; margin:0 auto; display:block;">${voiceOptions}</select>
            </label>
    
            <label class="tts-speed" style="margin-bottom:4px; width:98%;">
              <span style="font-size:0.9em; font-weight:600; color:#444;">Speed</span>
              <input id="tts-speed" type="range" min="0.7" max="1.3" step="0.05" value="${DEFAULT_SPEED}">
              <span id="tts-speed-out" style="font-size:0.9em;">${DEFAULT_SPEED.toFixed(2)}×</span>
            </label>
    
            <label class="tts-style-label" style="width:100%; display:flex !important; flex-direction:column !important; align-items:center !important; margin: 2px 0 6px 0;">
               <span style="font-weight:600; margin-bottom:2px; font-size:0.95em;">Speaking Style</span>
               <select id="tts-style" style="width:98%; padding:4px;"><option value="">(neutral)</option></select>
            </label>

            <div class="tts-mixed-row" style="width:98%; display:flex !important; justify-content:space-between !important; align-items:end; gap:8px; margin-bottom:8px;">
               
               <label class="tts-pitch-col" style="flex:1; display:flex; flex-direction:column; gap:2px;">
                  <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:600; color:#444;">
                     <span>Pitch</span>
                     <span id="tts-pitch-out" style="color:#0078d7;">${DEFAULT_PITCH_ST}</span>
                  </div>
                  <input id="tts-pitch" type="range" min="-12" max="12" step="1" value="${DEFAULT_PITCH_ST}" style="width:100%; cursor:pointer;">
               </label>

               <label class="tts-degree-col" style="width:70px; display:flex; flex-direction:column; gap:2px;">
                  <span style="font-size:0.85rem; font-weight:600; color:#444; text-align:center;">Degree</span>
                  <input id="tts-styledegree" type="number" min="0.1" max="2.5" step="0.1" value="2.5" style="width:100%; padding:3px; text-align:center; border:1px solid #ccc; border-radius:6px;">
               </label>

            </div>
    
            <button id="tts-main" class="tts-btn tts-btn--primary"
              title="Click: play/pause • Double-click: restart & play" style="width:98%; margin-bottom:8px; padding: 8px;">🔊 Generate & Play</button>
    
            <div class="tts-skip" style="display:flex; justify-content:center; gap:10px; align-items:center;">
              <button id="tts-back" class="tts-btn tts-btn--sm" title="Back 2 seconds">↺ 2s</button>
              
              <a id="tts-download" class="tts-link" href="#" download="lux_tts.mp3" title="Download audio" style="font-size:1.4rem; line-height:1; text-decoration:none;">⬇️</a>
              
              <button id="tts-fwd"  class="tts-btn tts-btn--sm" title="Forward 2 seconds">↻ 2s</button>
            </div>
    
          </div>
        </div>
      </div>
    `;

  // Apply layout styles immediately
  const box = mount.querySelector(".tts-compact");
  if (box)
    Object.assign(box.style, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    });
}
