// ui/ui-ai-ai-logic.js
// Handles Logic for AI Feedback (Quick/Deep modes + Auto-Updates).

import {
  showLoading,
  hideAI,
  renderSections,
  renderEntryButtons,
  updateFooterButtons,
  showAIFeedbackError,
  clearAIFeedback,
  getCurrentPersona // <--- NEW IMPORT
} from "./ui-ai-ai-dom.js";

import { fetchAIFeedback, updateAttempt } from "/src/api/index.js";

// State
let chunkHistory = []; 
let currentArgs = null; 
let isFetching = false;

let lastContext = {
  azureResult: null,
  referenceText: "",
  firstLang: "universal"
};

/**
 * Entry Point
 */
export function promptUserForAI(azureResult, referenceText, firstLang) {
  const nb = azureResult?.NBest?.[0];
  const saidText = (azureResult?.DisplayText || nb?.Display || "").trim();
  
  if (!nb || !saidText) {
    hideAI();
    return;
  }

  // Save context
  lastContext = { azureResult, referenceText, firstLang };
  resetState();
  
  // Render Entry with Sidebar Callback
  renderEntryButtons({
    onQuick: (persona) => startQuickMode(azureResult, referenceText, firstLang, persona),
    onDeep:  (persona) => startDeepMode(azureResult, referenceText, firstLang, persona),
    onPersonaChange: (newPersona) => onPersonaChanged(newPersona) // <--- Wire this up
  });
}

/**
 * Called when Sidebar "Coach Style" is clicked
 */
function onPersonaChanged(newPersona) {
  if (!lastContext.azureResult) return;
  console.log(`[AI Logic] Persona changed to ${newPersona}. Refreshing...`);

  if (currentArgs) {
    // If we are already viewing results, refresh immediately
    const { referenceText, firstLang, mode } = currentArgs;
    
    chunkHistory = [];
    clearAIFeedback(); // Clears content area, keeps sidebar

    if (mode === "simple") {
      startQuickMode(lastContext.azureResult, referenceText, firstLang, newPersona);
    } else {
      startDeepMode(lastContext.azureResult, referenceText, firstLang, newPersona);
    }
  } else {
    // Just sitting at menu, no fetch needed, but we keep the buttons active
    // The visual state 'active' class is handled by the DOM module
  }
}

/**
 * Called when Main L1 Dropdown changes
 */
export function onLanguageChanged(newLang) {
  if (!lastContext.azureResult) return;
  console.log(`[AI Logic] Language changed to ${newLang}. Refreshing...`);
  
  lastContext.firstLang = newLang;
  
  // Get currently selected sidebar persona to maintain consistency
  const currentPersona = getCurrentPersona(); 

  if (currentArgs) {
    const { mode } = currentArgs;
    chunkHistory = [];
    clearAIFeedback();

    if (mode === "simple") {
      startQuickMode(lastContext.azureResult, lastContext.referenceText, newLang, currentPersona);
    } else {
      startDeepMode(lastContext.azureResult, lastContext.referenceText, newLang, currentPersona);
    }
  } else {
    // Re-render to ensure any internal language state in closures is fresh
    renderEntryButtons({
      onQuick: (p) => startQuickMode(lastContext.azureResult, lastContext.referenceText, newLang, p),
      onDeep:  (p) => startDeepMode(lastContext.azureResult, lastContext.referenceText, newLang, p),
      onPersonaChange: (p) => onPersonaChanged(p)
    });
  }
}

// ... (Rest of logic: resetState, persistFeedbackToDB, startQuickMode, startDeepMode, fetchNextChunk, handleShowLess, refreshFooter)
// [Use previous logic, just ensure startQuickMode/DeepMode use the passed persona]

function resetState() {
  chunkHistory = [];
  isFetching = false;
  currentArgs = null;
}

function persistFeedbackToDB(sections) {
  if (window.lastAttemptId) {
    updateAttempt(window.lastAttemptId, { sections: sections });
  }
}

async function startQuickMode(azureResult, referenceText, firstLang, persona) {
  showLoading();
  const lang = normalizeLang(firstLang);
  currentArgs = { azureResult, referenceText, firstLang: lang, persona, mode: "simple" };

  try {
    const res = await fetchAIFeedback({ 
        azureResult, 
        referenceText, 
        firstLang: lang, 
        mode: "simple", 
        persona 
    });
    const sections = res.sections || res.fallbackSections || [];
    
    chunkHistory.push(sections);
    renderSections(sections, sections.length);
    
    updateFooterButtons({ 
      canShowMore: false, 
      canShowLess: true, 
      onShowLess: handleShowLess,
      lessLabel: "Back to Options ⬅"
    });

    persistFeedbackToDB(sections);
  } catch (err) {
    console.error(err);
    showAIFeedbackError("Could not load Quick Tips.");
  }
}

async function startDeepMode(azureResult, referenceText, firstLang, persona) {
  const lang = normalizeLang(firstLang);
  currentArgs = { azureResult, referenceText, firstLang: lang, persona, mode: "detailed" };
  chunkHistory = []; 
  await fetchNextChunk();
}

async function fetchNextChunk() {
  if (isFetching) return;
  const nextChunkId = chunkHistory.length + 1;
  if (nextChunkId > 3) return; 

  isFetching = true;
  if (nextChunkId === 1) showLoading();
  else refreshFooter(); 

  try {
    const res = await fetchAIFeedback({
        ...currentArgs, 
        chunk: nextChunkId
    });

    const newSections = res.sections || res.fallbackSections || [];
    chunkHistory.push(newSections);

    const allSections = chunkHistory.flat();
    renderSections(allSections, allSections.length);

    persistFeedbackToDB(allSections);
  } catch (err) {
    console.error(err);
    showAIFeedbackError("Could not load next section.");
  } finally {
    isFetching = false;
    refreshFooter();
  }
}

function handleShowLess() {
  if (chunkHistory.length > 0) chunkHistory.pop();

  if (chunkHistory.length === 0) {
    clearAIFeedback(); 
    currentArgs = null; 
    
    // Go back to entry buttons
    renderEntryButtons({
      onQuick: (p) => startQuickMode(lastContext.azureResult, lastContext.referenceText, lastContext.firstLang, p),
      onDeep:  (p) => startDeepMode(lastContext.azureResult, lastContext.referenceText, lastContext.firstLang, p),
      onPersonaChange: (p) => onPersonaChanged(p)
    });
  } else {
    const allSections = chunkHistory.flat();
    renderSections(allSections, allSections.length);
    refreshFooter();
  }
}

function refreshFooter() {
  const currentCount = chunkHistory.length;
  updateFooterButtons({
    onShowMore: () => fetchNextChunk(),
    onShowLess: () => handleShowLess(),
    canShowMore: currentCount < 3,
    canShowLess: true, 
    isLoading: isFetching
  });
}

function normalizeLang(l) {
  return !l || !String(l).trim() ? "universal" : String(l).trim();
}

export const getAIFeedback = promptUserForAI;