// ui/ui-ai-ai-logic.js
// AI Feedback Logic Module: talks to backend + delegates DOM to ui-ui-ai-dom.js

import {
  showLoading,
  hideAI,
  renderSections,
  onShowMore,
  setShowMoreState,
  renderEntryButtons // <--- NEW IMPORT
} from "./ui-ai-ai-dom.js";

import { fetchAIFeedback } from "../api/index.js";

/**
 * MILESTONE 1: ENTRY POINT
 * Instead of auto-firing, we present options.
 */
export function promptUserForAI(azureResult, referenceText, firstLang) {
  // 1) Bail if no speech
  const nb = azureResult?.NBest?.[0];
  const saidText = (azureResult?.DisplayText || nb?.Display || "").trim();
  if (!nb || !saidText) {
    hideAI();
    return;
  }

  // 2) Render the choice buttons
  renderEntryButtons({
    onQuick: () => getAIFeedback(azureResult, referenceText, firstLang, "simple"),
    onDeep:  () => getAIFeedback(azureResult, referenceText, firstLang, "detailed")
  });
}

export async function getAIFeedback(azureResult, referenceText, firstLang, mode = "detailed") {
  // --- 1) Bail if there was no real speech ---
  const nb = azureResult?.NBest?.[0];
  const saidText = (azureResult?.DisplayText || nb?.Display || "").trim();

  if (!nb || !saidText) {
    hideAI();
    return;
  }

  // --- 2) Show loading UI ---
  showLoading();

  const lang =
    !firstLang || !String(firstLang).trim()
      ? "universal"
      : String(firstLang).trim();

  let response;
  try {
    // Pass 'mode' to the API
    response = await fetchAIFeedback({
      referenceText,
      azureResult,
      firstLang: lang,
      mode 
    });
  } catch (err) {
    console.error("[AI] fetchAIFeedback failed", err);
    const box = document.getElementById("aiFeedback");
    if (box) {
      box.innerHTML =
        "<span style='color:#c00;'>Could not load AI feedback.</span>";
    }
    setShowMoreState({ visible: false });
    return;
  }

  const sections = Array.isArray(response?.sections)
    ? response.sections
    : response?.fallbackSections;

  if (!Array.isArray(sections) || !sections.length) {
    console.warn("[AI] No sections array returned", response);
    const box = document.getElementById("aiFeedback");
    if (box) {
      box.innerHTML =
        "<span style='color:#c00;'>AI did not return any feedback.</span>";
    }
    setShowMoreState({ visible: false });
    return;
  }

  // --- 3) Render behavior based on mode ---
  
  if (mode === "simple") {
    // Render all (it's usually just 1 section) and hide "Show More"
    renderSections(sections, sections.length);
    setShowMoreState({ visible: false });
    return;
  }

  // detailed mode: Use pagination
  const initialCount = Math.min(2, sections.length);
  let { shown, moreAvailable } = renderSections(sections, initialCount);

  setShowMoreState({ visible: moreAvailable });

  if (!moreAvailable) {
    return;
  }

  let shownCount = shown;
  onShowMore(() => {
    shownCount = Math.min(shownCount + 2, sections.length);
    const res = renderSections(sections, shownCount);
    shown = res.shown;
    moreAvailable = res.moreAvailable;
    setShowMoreState({ visible: moreAvailable });
  });
}