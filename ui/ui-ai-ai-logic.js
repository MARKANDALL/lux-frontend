// ui/ui-ai-ai-logic.js
// AI Logic: Handles "Quick" vs "Deep" and manages the Chunking loop.
// UPDATED: "Show Less" steps back one chunk at a time; supports exiting to menu.

import {
  showLoading,
  hideAI,
  renderSections,
  renderEntryButtons,
  updateFooterButtons,
  showAIFeedbackError,
  clearAIFeedback // Needed to clear footer when going back to menu
} from "./ui-ai-ai-dom.js";

import { fetchAIFeedback } from "../api/index.js";

// -- State Management --
let chunkHistory = []; // Stores arrays of sections: [ [sec1, sec2], [sec3, sec4] ]
let currentArgs = null; 
let isFetching = false;

/**
 * Entry Point: Triggered by Recorder
 */
export function promptUserForAI(azureResult, referenceText, firstLang) {
  const nb = azureResult?.NBest?.[0];
  const saidText = (azureResult?.DisplayText || nb?.Display || "").trim();
  if (!nb || !saidText) {
    hideAI();
    return;
  }

  resetState();
  
  renderEntryButtons({
    onQuick: () => startQuickMode(azureResult, referenceText, firstLang),
    onDeep:  () => startDeepMode(azureResult, referenceText, firstLang)
  });
}

function resetState() {
  chunkHistory = [];
  isFetching = false;
  currentArgs = null;
}

// --- Quick Mode ---
async function startQuickMode(azureResult, referenceText, firstLang) {
  showLoading();
  const lang = normalizeLang(firstLang);

  try {
    const res = await fetchAIFeedback({ 
        azureResult, referenceText, firstLang: lang, mode: "simple" 
    });
    const sections = res.sections || res.fallbackSections || [];
    
    renderSections(sections, sections.length);
    updateFooterButtons({ canShowMore: false, canShowLess: false });

  } catch (err) {
    console.error(err);
    showAIFeedbackError("Could not load Quick Tips.");
  }
}

// --- Deep Mode ---
async function startDeepMode(azureResult, referenceText, firstLang) {
  const lang = normalizeLang(firstLang);
  currentArgs = { azureResult, referenceText, firstLang: lang };
  chunkHistory = []; // Start fresh

  // Fetch Chunk 1
  await fetchNextChunk();
}

async function fetchNextChunk() {
  if (isFetching) return;
  
  // Max 3 chunks (1, 2, 3)
  const nextChunkId = chunkHistory.length + 1;
  if (nextChunkId > 3) return; 

  isFetching = true;

  // Visuals
  if (nextChunkId === 1) showLoading();
  else refreshFooter(); // Updates button to "Loading..."

  try {
    const res = await fetchAIFeedback({
        ...currentArgs,
        mode: "detailed",
        chunk: nextChunkId
    });

    const newSections = res.sections || res.fallbackSections || [];
    
    // Store this chunk in history
    chunkHistory.push(newSections);

    // Render ALL current chunks flattened
    const allSections = chunkHistory.flat();
    renderSections(allSections, allSections.length);

  } catch (err) {
    console.error(err);
    showAIFeedbackError("Could not load next section.");
  } finally {
    isFetching = false;
    refreshFooter();
  }
}

function handleShowLess() {
  // If we have history, remove the last chunk
  if (chunkHistory.length > 0) {
    chunkHistory.pop();
  }

  // Check where we ended up
  if (chunkHistory.length === 0) {
    // We removed Chunk 1 -> Go back to Entry Buttons
    clearAIFeedback(); // Clear the text/footer
    renderEntryButtons({
      onQuick: () => startQuickMode(currentArgs.azureResult, currentArgs.referenceText, currentArgs.firstLang),
      onDeep:  () => startDeepMode(currentArgs.azureResult, currentArgs.referenceText, currentArgs.firstLang)
    });
  } else {
    // We still have chunks (e.g. went from 3 -> 2, or 2 -> 1)
    // Re-render what's left
    const allSections = chunkHistory.flat();
    renderSections(allSections, allSections.length);
    refreshFooter();
  }
}

function refreshFooter() {
  const currentCount = chunkHistory.length;

  // Logic: 
  // - Show More: If we haven't reached chunk 3 yet.
  // - Show Less: ALWAYS show if we have any chunks (even Chunk 1, to go back to menu).
  
  updateFooterButtons({
    onShowMore: () => fetchNextChunk(),
    onShowLess: () => handleShowLess(),
    canShowMore: currentCount < 3,
    canShowLess: true, // Always allow stepping back
    isLoading: isFetching
  });
}

// --- Helper ---
function normalizeLang(l) {
  return !l || !String(l).trim() ? "universal" : String(l).trim();
}

export const getAIFeedback = promptUserForAI;