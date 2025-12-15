// ui/ui-ai-ai-logic.js
// AI Logic: Handles "Quick" vs "Deep", manages the Chunking loop, and saves to DB.
// STATUS: Phase F Complete (Personas + Structure).
// UPDATED: Wires up the Persona Selector to the API.

import {
  showLoading,
  hideAI,
  renderSections,
  renderEntryButtons,
  updateFooterButtons,
  showAIFeedbackError,
  clearAIFeedback
} from "./ui-ai-ai-dom.js";

// Import the API functions
import { fetchAIFeedback, updateAttempt } from "../api/index.js";

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
  
  // Pass the chosen persona from the UI into the start functions
  renderEntryButtons({
    onQuick: (persona) => startQuickMode(azureResult, referenceText, firstLang, persona),
    onDeep:  (persona) => startDeepMode(azureResult, referenceText, firstLang, persona)
  });
}

function resetState() {
  chunkHistory = [];
  isFetching = false;
  currentArgs = null;
}

/**
 * Helper to save AI data to the backend "Memory"
 */
function persistFeedbackToDB(sections) {
  if (window.lastAttemptId) {
    console.log(`[Lux] Saving ${sections.length} AI sections to DB (ID: ${window.lastAttemptId})...`);
    // We send the array of sections. The backend merges it into 'summary.ai_feedback'
    updateAttempt(window.lastAttemptId, { sections: sections });
  } else {
    console.warn("[Lux] No Attempt ID found. Cannot save AI feedback.");
  }
}

// --- Quick Mode ---
async function startQuickMode(azureResult, referenceText, firstLang, persona) {
  showLoading();
  const lang = normalizeLang(firstLang);
  
  // Set context so we can restart if needed
  currentArgs = { azureResult, referenceText, firstLang: lang, persona };

  try {
    const res = await fetchAIFeedback({ 
        azureResult, 
        referenceText, 
        firstLang: lang, 
        mode: "simple",
        persona // <--- PASSED TO API
    });
    const sections = res.sections || res.fallbackSections || [];
    
    // Treat this as a "chunk" in history so handleShowLess works
    chunkHistory.push(sections);

    // 1. Render
    renderSections(sections, sections.length);
    
    // Enable "Back" button for Quick Mode
    updateFooterButtons({ 
      canShowMore: false, 
      canShowLess: true, 
      onShowLess: handleShowLess,
      lessLabel: "Back to Options ⬅"
    });

    // 2. Save to DB
    persistFeedbackToDB(sections);

  } catch (err) {
    console.error(err);
    showAIFeedbackError("Could not load Quick Tips.");
  }
}

// --- Deep Mode ---
async function startDeepMode(azureResult, referenceText, firstLang, persona) {
  const lang = normalizeLang(firstLang);
  // Store persona in context for chunking loops
  currentArgs = { azureResult, referenceText, firstLang: lang, persona };
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
    // 1. Fetch from AI (using stored persona)
    const res = await fetchAIFeedback({
        ...currentArgs, // includes persona
        mode: "detailed",
        chunk: nextChunkId
    });

    const newSections = res.sections || res.fallbackSections || [];
    
    // 2. Store this chunk in history
    chunkHistory.push(newSections);

    // 3. Render ALL current chunks flattened
    const allSections = chunkHistory.flat();
    renderSections(allSections, allSections.length);

    // 4. Save to DB (Update the record with the growing list)
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
  // If we have history, remove the last chunk
  if (chunkHistory.length > 0) {
    chunkHistory.pop();
  }

  // Check where we ended up
  if (chunkHistory.length === 0) {
    // We removed Chunk 1 -> Go back to Entry Buttons
    clearAIFeedback(); 
    
    // Re-render buttons, ensuring we pass the *new* persona choice if clicked again
    // (We use currentArgs to restore the original data context)
    renderEntryButtons({
      onQuick: (p) => startQuickMode(currentArgs.azureResult, currentArgs.referenceText, currentArgs.firstLang, p),
      onDeep:  (p) => startDeepMode(currentArgs.azureResult, currentArgs.referenceText, currentArgs.firstLang, p)
    });
  } else {
    // We still have chunks (e.g. went from 3 -> 2)
    // Re-render what's left
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

// --- Helper ---
function normalizeLang(l) {
  return !l || !String(l).trim() ? "universal" : String(l).trim();
}

export const getAIFeedback = promptUserForAI;