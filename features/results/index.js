// ui/views/index.js
// Canonical results renderer entrypoint.

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
  // ✅ ENABLED: Safe version of ph-chips.js is now in place.
  try {
    if (typeof initPhonemeChipBehavior === "function") {
      initPhonemeChipBehavior();
      // console.log("[LUX] phoneme chips hydrated"); // Optional log
    } else {
      console.warn("[LUX] ph-chips: initPhonemeChipBehavior not found");
    }
  } catch (e) {
    console.warn("[LUX] phoneme chip hydration failed", e);
  }
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

export function showSummary({ allPartsResults, currentParts } = {}) {
  // Canonical multi-part path
  if (Array.isArray(allPartsResults) && allPartsResults.length) {
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

  // Fallback
  if (lastResult) {
    showPrettyResults(lastResult);
  }
}

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