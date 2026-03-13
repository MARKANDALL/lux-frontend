// features/features/tts/player-dom.js
// Pure DOM: HTML templates and element selection helpers.

import { VOICES, DEFAULT_SPEED, DEFAULT_PITCH_ST } from "./player-core.js";
import { luxBus } from '../../../app-core/lux-bus.js';

// Helper: Scoped query selector
export const $ = (root, sel) => root.querySelector(sel);

// Helper: Get text from input or selection
export function getCurrentText() {
  // If a page installs a TTS context adapter (e.g., AI Conversations),
  // let it provide the “current” text (AI / Me / Selection / Auto).
  try {
    const mode = luxBus.get('tts')?.sourceMode || "me";
    const ctx = luxBus.get('ttsContextApi') || window.LuxTTSContext;
    if (ctx && typeof ctx.getText === "function") {
      const t = String(ctx.getText({ mode }) || "").trim();
      if (t) return t;
    }
  } catch (err) { globalThis.warnSwallow("features/features/tts/player-dom.js", err, "important"); }

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
          <div class="tts-topRow">
            <label
              class="tts-autoVoice"
              title="Automatically switch the voice to match AI, Me, or Selection"
            >
              <input id="tts-autovoice" type="checkbox" checked>
              Auto voice
            </label>

            <button id="tts-expand" type="button" class="tts-expandBtn">Expand</button>
          </div>

          <div class="tts-head">
            <div id="tts-note" class="tts-note" aria-live="polite"></div>
          </div>

          <div class="tts-sourceVoiceRow">
            <div class="tts-selectWrap" data-label="Voice">
              <select id="tts-voice">${voiceOptions}</select>
            </div>

            <div class="tts-sourceRow">
              <div class="tts-selectWrap" data-label="Speak">
                <select id="tts-source">
                  <option value="ai">AI</option>
                  <option value="me" selected>Me</option>
                  <option value="selection">Selection</option>
                </select>
              </div>
            </div>
          </div>

          <div class="tts-speedRow">
            <span class="tts-inlineLabel">Speed</span>
            <input id="tts-speed" type="range" min="0.7" max="1.3" step="0.05" value="${DEFAULT_SPEED}">
            <span id="tts-speed-out" class="tts-inlineValue">${DEFAULT_SPEED.toFixed(2)}×</span>
          </div>

          <div class="tts-selectWrap" data-label="Speaking style">
            <select id="tts-style"><option value="">(neutral)</option></select>
          </div>

          <div class="tts-pitchRow">
            <span class="tts-inlineLabel">Pitch</span>
            <input id="tts-pitch" type="range" min="-12" max="12" step="1" value="${DEFAULT_PITCH_ST}">
            <span id="tts-pitch-out" class="tts-inlineValue">${DEFAULT_PITCH_ST}</span>
            <span class="tts-inlineLabel">Degree</span>
            <input id="tts-styledegree" type="number" min="0.1" max="2.5" step="0.1" value="2.5">
          </div>

          <div class="tts-actionRow">
            <button
              id="tts-main"
              class="tts-btn tts-btn--primary"
              title="Click: play/pause • Double-click: restart & play"
            >🔊 Play</button>

            <div class="tts-miniActions">
              <button id="tts-back" class="tts-btn tts-btn--sm" title="Back 2 seconds">↺ 2s</button>
              <a id="tts-download" class="tts-link" href="#" download="lux_tts.mp3" title="Download audio">⬇️</a>
              <button id="tts-fwd"  class="tts-btn tts-btn--sm" title="Forward 2 seconds">↻ 2s</button>
            </div>
          </div>
        </div>
      </div>
    `;
}