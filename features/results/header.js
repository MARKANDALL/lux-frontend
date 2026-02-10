/* ============================================================================
   CANONICAL SHIM — HEADER SHELL + POST-DOM WIRING
   ---------------------------------------------------------------------------
   - Canonical results renderer: ui/views/index.js (lux-results-root)
   - This file is ACTIVE in the modern trunk.
   - It still supports legacy globals *only as fallback*.
   - Phase-E move here: stop relying on hooks shim from deps.js.
============================================================================ */
// ui/views/header.js

// Modern ES-module header builder (canonical scoring)
import { renderResultsHeaderModern } from "./header-modern.js";

// Direct ES-module interaction boots (idempotent in their own modules)
import { setupYGHover } from "../interactions/yg-hover.js";
import { setupPhonemeHover } from "../interactions/ph-hover.js";
import { initPhonemeAudio } from "../interactions/ph-audio.js";
import { initScoreErrorCollapse } from "../interactions/score-collapse.js";
import { animateMetricTips } from "../interactions/tips.js";
import { initProsodyLegendToggle } from "../interactions/legend-toggle.js";
import { initProsodyTooltips } from "../../prosody/prosody-help-bars.js";
import { initMetricScoreModals, setMetricModalData } from "../interactions/metric-modal.js";

// Helpers: call a global hook if it exists (kept for shims / parked features)
function callGlobal(name, ...args) {
  const fn = globalThis?.[name];
  if (typeof fn === "function") return fn(...args);
}

export function ensureHeader(data) {
  const G = globalThis;
  const $out = document.getElementById("prettyResult");
  if (!$out) return;

  // If the header/table already exists, just (re)fill slots and attach light UX.
  if (document.getElementById("resultBody")) {
    callGlobal("fillProsodyAndContentSlots", data);
    setTimeout(() => animateMetricTips?.(), 0);
    initProsodyLegendToggle?.();
    initProsodyTooltips?.();

    const refEl = document.getElementById("referenceText");
    const referenceText =
      (refEl && "value" in refEl ? refEl.value : refEl?.textContent) || "";
    setMetricModalData?.({ azureResult: data, referenceText });

    initMetricScoreModals?.();
    return;
  }

  let html = null;

  // 1) Preferred: modern ES-module header builder (canonical scoring)
  try {
    if (typeof renderResultsHeaderModern === "function") {
      html = renderResultsHeaderModern(data);
    }
  } catch (e) {
    console.warn("[views/header] modern header failed, falling back:", e);
  }

  // 2) Fallback: legacy global header renderer (if still present)
  if (!html && typeof G.renderResultsHeader === "function") {
    try {
      html = G.renderResultsHeader(data);
    } catch (e) {
      console.warn("[views/header] legacy renderResultsHeader failed:", e);
    }
  }

  // 3) Final fallback: inline minimal header markup
  if (!html) {
    html = `
      <div id="resultHeader"></div>
      <table class="score-table collapsed-syllable collapsed-score collapsed-error">
        <thead>
          <tr>
            <th id="wordHeader">
              <span class="word-chip clickable">Word</span>
            </th>

            <th id="syllableHeader">
              <button class="lux-col-toggle" type="button" data-col="syllable" aria-label="Collapse/expand Syllable column" title="Collapse/expand Syllable column">▸</button>
              <span class="word-chip syllable-chip">Syllable</span>
            </th>

            <th id="scoreHeader" class="toggle-col">
              Score ▸
            </th>
            <th id="errorHeader" class="toggle-col">
              Error ▸
            </th>
            <th id="phonemeHeader">
              <span
                class="word-chip phoneme-chip clickable"
                id="phonemeTitle"
              >
                Phoneme
              </span>
            </th>
          </tr>
        </thead>
        <tbody id="resultBody"></tbody>
      </table>
    `;
  }

  $out.insertAdjacentHTML("afterbegin", html);

  const refEl = document.getElementById("referenceText");
  const referenceText =
    (refEl && "value" in refEl ? refEl.value : refEl?.textContent) || "";
  setMetricModalData?.({ azureResult: data, referenceText });
  initMetricScoreModals?.();

  // Header slots + light UX (import-first; global fallback)
  callGlobal("fillProsodyAndContentSlots", data);
  setTimeout(() => animateMetricTips?.(), 0);
  initProsodyLegendToggle?.();
}

export function wirePostDom(data) {
  try {
    // Slots and tips
    callGlobal("fillProsodyAndContentSlots", data);

    // Canonical interaction boots
    setupYGHover?.();
    setupPhonemeHover?.();
    initPhonemeAudio?.();
    initScoreErrorCollapse?.();
    animateMetricTips?.();
    initProsodyLegendToggle?.();
    initProsodyTooltips?.();

    const refEl = document.getElementById("referenceText");
    const referenceText =
      (refEl && "value" in refEl ? refEl.value : refEl?.textContent) || "";
    setMetricModalData?.({ azureResult: data, referenceText });

    initMetricScoreModals?.();

    // Parked / optional features remain global-only for now
    callGlobal("initPhonemeClickPlay");
    callGlobal("initProsodyBarsUX");
  } catch (e) {
    console.warn("[views] post-DOM wiring error:", e);
  }
}
