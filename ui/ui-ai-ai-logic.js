// ui/ui-ai-ai-logic.js
// AI Logic: Handles "Quick" vs "Deep" and manages the Chunking loop.
// UPDATED: Robust state management for Show More / Show Less.

import {
  showLoading,
  hideAI,
  renderSections,
  renderEntryButtons,
  updateFooterButtons,
  showAIFeedbackError
} from "./ui-ai-ai-dom.js";

import { fetchAIFeedback } from "../api/index.js";

// -- State for Deep Dive --
let accumulatedSections = [];
let currentChunk = 0;
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

  // Reset state
  accumulatedSections = [];
  currentChunk = 0;
  isFetching = false;
  
  renderEntryButtons({
    onQuick: () => startQuickMode(azureResult, referenceText, firstLang),
    onDeep:  () => startDeepMode(azureResult, referenceText, firstLang)
  });
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
    
    // Quick mode doesn't usually have pagination, but we clear footer just in case
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
  
  // Full reset for Deep Mode
  accumulatedSections = [];
  currentChunk = 0;

  // Fetch Chunk 1
  await fetchNextChunk();
}

async function fetchNextChunk() {
  if (isFetching) return;
  if (currentChunk >= 3) return; 

  isFetching = true;

  // If first chunk, show full loading screen. Otherwise, button shows loading.
  if (currentChunk === 0) showLoading();
  else refreshFooter(); 

  const nextChunkId = currentChunk + 1;

  try {
    const res = await fetchAIFeedback({
        ...currentArgs,
        mode: "detailed",
        chunk: nextChunkId
    });

    const newSections = res.sections || res.fallbackSections || [];
    accumulatedSections = [...accumulatedSections, ...newSections];
    currentChunk = nextChunkId;

    renderSections(accumulatedSections, accumulatedSections.length);

  } catch (err) {
    console.error(err);
    showAIFeedbackError("Could not load next section.");
  } finally {
    isFetching = false;
    refreshFooter();
  }
}

function handleShowLess() {
  // Logic: Reset to just the first batch (Chunk 1) without re-fetching?
  // Or just re-fetch chunk 1? 
  // SAFEST: Reset state to Chunk 1 and re-render what we already have if possible.
  // Ideally we keep the data in memory.
  
  // For simplicity and robustness in this Milestone:
  // We will hide the extra sections from the DOM but keep them in memory?
  // Actually, 'renderSections' takes a count. 
  // Let's assume Chunk 1 had roughly 2 sections.
  
  // Simpler approach: Hard reset to start of Deep Mode.
  startDeepMode(currentArgs.azureResult, currentArgs.referenceText, currentArgs.firstLang);
}

function refreshFooter() {
  // Logic to determine button states
  const canShowMore = currentChunk < 3; 
  const canShowLess = currentChunk > 1; // Can collapse if we are past chunk 1

  updateFooterButtons({
    onShowMore: () => fetchNextChunk(),
    onShowLess: () => handleShowLess(),
    canShowMore: canShowMore,
    canShowLess: canShowLess,
    isLoading: isFetching
  });
}

// --- Helper ---
function normalizeLang(l) {
  return !l || !String(l).trim() ? "universal" : String(l).trim();
}

export const getAIFeedback = promptUserForAI;