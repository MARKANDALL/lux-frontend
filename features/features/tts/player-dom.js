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
      <div id="tts-wrap">
        <div class="tts-box tts-compact">
          <div class="tts-head">
            <div id="tts-note" class="tts-note" aria-live="polite" style="text-align:center; min-height:10px;"></div>
          </div>
  
          <label class="tts-voice" style="width:100%; text-align:center; display:block;">
            <span style="display:block; font-weight:700; margin-bottom:6px; font-size:1.1em; color:#333;">Voice</span>
            <select id="tts-voice" style="width:90%; margin:0 auto; display:block;">${voiceOptions}</select>
          </label>
  
          <label class="tts-speed"><span>Speed</span>
            <input id="tts-speed" type="range" min="0.7" max="1.3" step="0.05" value="${DEFAULT_SPEED}">
            <span id="tts-speed-out">${DEFAULT_SPEED.toFixed(2)}×</span>
          </label>
  
          <div class="tts-style-row">
            <div class="tts-style-grid">
              <label>Style
                <select id="tts-style"><option value="">(neutral)</option></select>
              </label>
  
              <label>Degree
                <input id="tts-styledegree" type="number" min="0.1" max="2.5" step="0.1" value="2.5"/>
              </label>
            </div>
          </div>
  
          <button id="tts-main" class="tts-btn tts-btn--primary"
            title="Click: play/pause • Double-click: restart & play">🔊 Generate & Play</button>
  
          <label class="tts-pitch">
            <span>Pitch (st)</span>
            <input id="tts-pitch" type="range" min="-12" max="12" step="1" value="${DEFAULT_PITCH_ST}">
            <span id="tts-pitch-out">${DEFAULT_PITCH_ST}</span>
          </label>
  
          <div class="tts-skip">
            <button id="tts-back" class="tts-btn tts-btn--sm" title="Back 2 seconds">↺ 2s</button>
            <button id="tts-fwd"  class="tts-btn tts-btn--sm" title="Forward 2 seconds">↻ 2s</button>
          </div>
  
          <a id="tts-download" class="tts-link" href="#" download="lux_tts.mp3" title="Download last audio">⬇️</a>
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