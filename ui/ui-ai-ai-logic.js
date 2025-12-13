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

export async function getAIFeedback(azureResult, referenceText, firstLang) {
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
  // Start with 2 parts visible
  const initialCount = Math.min(2, sections.length);
  renderSections(sections, initialCount);

  // Decide if button should be shown initially
  // If we have more sections than the initial 2, show the button
  if (sections.length > initialCount) {
    setShowMoreState({ visible: true, text: "Show More" });
  } else {
    // Fewer than 2 items? No button needed.
    setShowMoreState({ visible: false });
    return;
  }

  // --- 4) Toggle Logic (Expand -> Expand -> Hide) ---
  let shownCount = initialCount;

  onShowMore(() => {
    // CASE A: We are currently showing ALL parts (Button was 'Hide Extra Parts').
    // Action: Reset back to 2.
    if (shownCount >= sections.length) {
      shownCount = 2; 
      renderSections(sections, shownCount);
      setShowMoreState({ visible: true, text: "Show More" });
      
      // Scroll back to top of feedback box so user isn't lost at the bottom
      document.getElementById("aiFeedback")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // CASE B: We are expanding. Show 2 more.
    shownCount = Math.min(shownCount + 2, sections.length);
    renderSections(sections, shownCount);

    // Check if we hit the end
    if (shownCount >= sections.length) {
      // We just revealed the last batch. Change text to "Hide".
      setShowMoreState({ visible: true, text: "Hide Extra Parts" });
    } else {
      // Still more to go. Keep text as "Show More".
      setShowMoreState({ visible: true, text: "Show More" });
    }
  });
}