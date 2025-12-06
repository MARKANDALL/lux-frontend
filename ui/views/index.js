// ui/views/index.js
// Canonical results renderer entrypoint for Lux Pronunciation Tool.
// - Uses Phase-E renderer (ui/views/render-modern.js → render-core.js)
//   which preserves the legacy pill/table layout.
// - Hydrates phoneme chips (initPhonemeChipBehavior) after each render.
// - Adds phoneme hover boot (setupPhonemeHover) once per page load.
// - Delegates multi-part summaries to ui/views/summary-shell.js
//   (canonical summary + DB-tracking footer shell).
// - Exposes ES module exports only.
//   NOTE: Legacy window.* globals are attached ONLY in features/results/index.js.

import {
  showPrettyResults as legacyShowPrettyResults,
  showDetailedAnalysisSingle as legacyShowDetailedAnalysisSingle,
} from "./render-modern.js";

import { setupPhonemeHover } from "../interactions/ph-hover.js";
import { initPhonemeChipBehavior } from "../interactions/ph-chips.js";
import { showSummaryWithTracking } from "./summary-shell.js";

let lastResult = null;

/* ------------ phoneme hover boot (once) ------------ */

let phonemeHoverBooted = false;

function bootPhonemeHoverOnce() {
  if (phonemeHoverBooted) return;
  phonemeHoverBooted = true;
  try {
    setupPhonemeHover();
    console.log("[LUX] phoneme hover booted");
  } catch (e) {
    console.warn("[LUX] phoneme hover boot failed", e);
  }
}

/* ------------ phoneme chip hydration ------------ */

function hydratePhonemeChips() {
  // CRITICAL FIX: Temporarily disabled to stop Memory Leak / Video Loop
  // This prevents the app from creating thousands of video players and crashing RAM.
  // Once ui/interactions/ph-chips.js is fixed, we can uncomment this.
  
  console.log("[LUX] ⚠️ PHONEME CHIP HYDRATION DISABLED TO PREVENT CRASH");
  return; 

  /* // --- ORIGINAL CODE BELOW (DISABLED) ---
  try {
    if (typeof initPhonemeChipBehavior === "function") {
      initPhonemeChipBehavior();
      console.log("[LUX] phoneme chips hydrated");
    } else {
      console.log(
        "[LUX] ph-chips: initPhonemeChipBehavior not found on module"
      );
    }
  } catch (e) {
    console.warn("[LUX] phoneme chip hydration failed", e);
  }
  */
}

/* ------------ small local helpers ------------ */

function getContainer() {
  return document.getElementById("prettyResult") || document.body;
}

function ensureRawUI(host) {
  if (!host) return null;

  let link = host.querySelector("#lux-show-raw-link");
  let wrap = host.querySelector("#lux-raw-container");
  let pre = host.querySelector("#lux-raw-pre");

  if (!wrap || !pre) {
    link = document.createElement("div");
    link.id = "lux-show-raw-link";
    link.textContent = "Show Raw Data";
    link.style.cssText =
      "display:inline-block;margin-top:10px;font-size:0.78rem;color:#2563eb;text-decoration:underline;cursor:pointer;";

    wrap = document.createElement("div");
    wrap.id = "lux-raw-container";
    wrap.style.display = "none";
    wrap.style.marginTop = "8px";

    pre = document.createElement("pre");
    pre.id = "lux-raw-pre";
    pre.style.cssText =
      "max-height:260px;overflow:auto;background:#0f172a;color:#e5e7eb;padding:8px;border-radius:8px;font-size:0.72rem;";

    wrap.appendChild(pre);
    host.appendChild(link);
    host.appendChild(wrap);

    link.onclick = () => {
      const visible = wrap.style.display === "block";
      if (visible) {
        wrap.style.display = "none";
        link.textContent = "Show Raw Data";
      } else {
        pre.textContent = JSON.stringify(lastResult, null, 2);
        wrap.style.display = "block";
        link.textContent = "Hide Raw Data";
      }
    };
  }

  return { link, wrap, pre };
}

/* ------------ core exports ------------ */

export function showPrettyResults(data) {
  lastResult = data;

  // 1) Render the pills / table via Phase-E renderer.
  legacyShowPrettyResults(data);

  // 2) Hydrate phoneme chips so .tooltiptext gets IPA/tips/video.
  hydratePhonemeChips();

  // 3) Attach hover overlay once per page.
  bootPhonemeHoverOnce();
}

export function showDetailedAnalysisSingle(result) {
  lastResult = result;

  legacyShowDetailedAnalysisSingle(result);

  hydratePhonemeChips();
  bootPhonemeHoverOnce();
}

/**
 * Summary front door:
 * - For multi-part results, delegate to ui/views/summary-shell.js
 * (canonical summary + DB-tracking footer shell).
 * - For single results / fallback, show the last rendered result table.
 */
export function showSummary({ allPartsResults, currentParts } = {}) {
  // Canonical multi-part path (Phase-E summary + DB shell)
  if (Array.isArray(allPartsResults) && allPartsResults.length) {
    // Keep lastResult aligned with “latest part” for raw view + fallbacks.
    const tail = allPartsResults[allPartsResults.length - 1];
    if (tail) lastResult = tail;

    showSummaryWithTracking({
      allPartsResults,
      currentParts: currentParts || [],
    });

    // Summary view still uses phoneme chips / tooltips.
    hydratePhonemeChips();
    bootPhonemeHoverOnce();
    return;
  }

  // Fallback: if we have no parts array, just re-render the last result.
  if (lastResult) {
    showPrettyResults(lastResult);
  }
}

// Raw JSON view (used by recording.js / legacy UI)
export function showRawData() {
  if (!lastResult) return;
  const host = getContainer();
  if (!host) return;
  const ui = ensureRawUI(host);
  if (!ui) return;

  ui.pre.textContent = JSON.stringify(lastResult, null, 2);
  ui.wrap.style.display = "block";
  ui.link.textContent = "Hide Raw Data";
}

export function updateSummaryVisibility(show = true) {
  const host = getContainer();
  if (!host) return;
  host.style.display = show ? "" : "none";
}