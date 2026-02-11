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

    // Persist "Scores" accordion open/closed (Overall ring bar)
    const scoreAcc = document.getElementById("luxScoreAccordion");
    if (scoreAcc && scoreAcc.dataset.luxPersistBound !== "1") {
      scoreAcc.dataset.luxPersistBound = "1";

      const KEY = "lux:scoreAccordionOpen";

      // Apply saved state (default: open)
      try {
        const saved = localStorage.getItem(KEY);
        if (saved === "0") scoreAcc.open = false;
        if (saved === "1") scoreAcc.open = true;
      } catch {}

      // Save on toggle
      scoreAcc.addEventListener("toggle", () => {
        try {
          localStorage.setItem(KEY, scoreAcc.open ? "1" : "0");
        } catch {}
      });

      // The overall ring opens the metric modal; prevent it from also toggling the accordion
      const ring = scoreAcc.querySelector(".lux-scoreRing");
      if (ring) {
        const stop = (e) => {
          try { e.preventDefault(); } catch {}
          try { e.stopPropagation(); } catch {}
        };
        ring.addEventListener("click", stop, true);
        ring.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") stop(e);
        }, true);
      }
    }

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
<table class="score-table collapsed-score collapsed-error">
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

  // Persist "Scores" accordion open/closed (Overall ring bar)
  const scoreAcc = document.getElementById("luxScoreAccordion");
  if (scoreAcc && scoreAcc.dataset.luxPersistBound !== "1") {
    scoreAcc.dataset.luxPersistBound = "1";

    const KEY = "lux:scoreAccordionOpen";

    // Apply saved state (default: open)
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "0") scoreAcc.open = false;
      if (saved === "1") scoreAcc.open = true;
    } catch {}

    // Save on toggle
    scoreAcc.addEventListener("toggle", () => {
      try {
        localStorage.setItem(KEY, scoreAcc.open ? "1" : "0");
      } catch {}
    });

    // The overall ring opens the metric modal; prevent it from also toggling the accordion
    const ring = scoreAcc.querySelector(".lux-scoreRing");
    if (ring) {
      const stop = (e) => {
        try { e.preventDefault(); } catch {}
        try { e.stopPropagation(); } catch {}
      };
      ring.addEventListener("click", stop, true);
      ring.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") stop(e);
      }, true);
    }
  }

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

    // Subtle "new info exists" cue (Option A): staggered nudge for CLOSED sections
    try { nudgeClosedSectionsOnce(); } catch {}

    // Persist Word & Phoneme accordion (don't force open if user closed it)
    const wpAcc = document.getElementById("luxWpAccordion");
    if (wpAcc && wpAcc.dataset.luxPersistBound !== "1") {
      wpAcc.dataset.luxPersistBound = "1";
      const KEY = "lux:wpAccordionOpen";

      // Apply saved state (default behavior remains whatever markup says)
      try {
        const saved = localStorage.getItem(KEY);
        if (saved === "0") wpAcc.open = false;
        if (saved === "1") wpAcc.open = true;
      } catch {}

      // Save only when the user toggles
      wpAcc.addEventListener("toggle", () => {
        try {
          localStorage.setItem(KEY, wpAcc.open ? "1" : "0");
        } catch {}
      });
    }

    // Persist "Scores" accordion open/closed (Overall ring bar)
    const scoreAcc = document.getElementById("luxScoreAccordion");
    if (scoreAcc && scoreAcc.dataset.luxPersistBound !== "1") {
      scoreAcc.dataset.luxPersistBound = "1";

      const KEY = "lux:scoreAccordionOpen";

      // Apply saved state (default: open)
      try {
        const saved = localStorage.getItem(KEY);
        if (saved === "0") scoreAcc.open = false;
        if (saved === "1") scoreAcc.open = true;
      } catch {}

      // Save on toggle
      scoreAcc.addEventListener("toggle", () => {
        try {
          localStorage.setItem(KEY, scoreAcc.open ? "1" : "0");
        } catch {}
      });

      // The overall ring opens the metric modal; prevent it from also toggling the accordion
      const ring = scoreAcc.querySelector(".lux-scoreRing");
      if (ring) {
        const stop = (e) => {
          try { e.preventDefault(); } catch {}
          try { e.stopPropagation(); } catch {}
        };
        ring.addEventListener("click", stop, true);
        ring.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") stop(e);
        }, true);
      }
    }

    // Parked / optional features remain global-only for now
    callGlobal("initPhonemeClickPlay");
    callGlobal("initProsodyBarsUX");
  } catch (e) {
    console.warn("[views] post-DOM wiring error:", e);
  }
}

function nudgeClosedSectionsOnce() {
  const items = [
    { id: "luxScoreAccordion", key: "lux:nudge:scores" },
    { id: "luxWpAccordion", key: "lux:nudge:wp" },
    { id: "aiCoachDrawer", key: "lux:nudge:coach" },
    { id: "luxPracticeProgressDrawer", key: "lux:nudge:progress" },
  ];

  const reduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const markSeen = (k) => {
    try { sessionStorage.setItem(k, "1"); } catch {}
  };

  const isSeen = (k) => {
    try { return sessionStorage.getItem(k) === "1"; } catch { return false; }
  };

  const bindToggleSeen = (el, k) => {
    if (!el) return;
    if (el.dataset.luxNudgeBound === "1") return;
    el.dataset.luxNudgeBound = "1";
    el.addEventListener("toggle", () => markSeen(k));
  };

  // Bind toggle listeners early (when elements exist)
  for (const it of items) {
    const el = document.getElementById(it.id);
    if (el) bindToggleSeen(el, it.key);
  }

  const baseDelay = 1000;
  const step = 240;

  items.forEach((it, idx) => {
    setTimeout(() => {
      const el = document.getElementById(it.id);
      if (!el) return;
      bindToggleSeen(el, it.key);
      if (isSeen(it.key)) return;
      if (el.open) return; // only nudge when closed

      el.classList.add("lux-nudge");
      setTimeout(() => {
        try { el.classList.remove("lux-nudge"); } catch {}
      }, 900);

      markSeen(it.key);
    }, baseDelay + idx * step);
  });
}
