// ui/ui-ai-ai-logic.js
// AI Feedback Logic Module: talks to backend + delegates DOM to ui-ui-ai-dom.js

import {
  showLoading,
  hideAI,
  renderSections,
  onShowMore,
  setShowMoreState,
} from "./ui-ai-ai-dom.js";

import { fetchAIFeedback } from "../api/index.js";

/**
 * Main entrypoint for AI feedback.
 * Called after Azure assess with:
 *  - azureResult: raw Azure JSON
 *  - referenceText: passage / custom text the user read
 *  - firstLang: first-language code (or "universal")
 */
export async function getAIFeedback(azureResult, referenceText, firstLang) {
  // --- 1) Bail if there was no real speech ---
  const nb = azureResult?.NBest?.[0];
  const saidText = (azureResult?.DisplayText || nb?.Display || "").trim();

  if (!nb || !saidText) {
    hideAI();
    return;
  }

  // --- 2) Show loading UI (spinner + bar) ---
  showLoading();

  const lang =
    !firstLang || !String(firstLang).trim()
      ? "universal"
      : String(firstLang).trim();

  let response;
  try {
    response = await fetchAIFeedback({
      referenceText,
      azureResult,
      firstLang: lang,
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

  // --- 3) Initial render: up to 2 sections ---
  const initialCount = Math.min(2, sections.length);
  let { shown, moreAvailable } = renderSections(sections, initialCount);

  if (!moreAvailable) {
    // All sections fit in the first batch; renderSections will hide/disable Show More.
    return;
  }

  // --- 4) Show More: reveal 2 more sections each click ---
  let shownCount = shown;

  onShowMore(() => {
    shownCount = Math.min(shownCount + 2, sections.length);
    const res = renderSections(sections, shownCount);
    shown = res.shown;
    moreAvailable = res.moreAvailable;
    // When res.moreAvailable === false, renderSections will update the button for us.
  });
}

// NOTE: no window.getAIFeedback export here — this is now pure ES module.
