// ui/ui-ai-ai-logic.js
// AI Logic: Handles "Quick" vs "Deep" and manages the Chunking loop.

import {
  showLoading,
  hideAI,
  renderSections,
  onShowMore,
  setShowMoreState,
  renderEntryButtons,
  showAIFeedbackError // Added for better error handling UI
} from "./ui-ai-ai-dom.js";

import { fetchAIFeedback } from "../api/index.js";

// -- State for Deep Dive Accumulation --
let accumulatedSections = [];
let currentChunk = 0;
let currentArgs = null; // store args to re-fetch next chunk

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

  // Reset state on new prompt
  accumulatedSections = [];
  currentChunk = 0;
  
  renderEntryButtons({
    onQuick: () => startQuickMode(azureResult, referenceText, firstLang),
    onDeep:  () => startDeepMode(azureResult, referenceText, firstLang)
  });
}

// --- Quick Mode (One-shot) ---
async function startQuickMode(azureResult, referenceText, firstLang) {
  showLoading();
  const lang = normalizeLang(firstLang);

  try {
    const res = await fetchAIFeedback({ 
        azureResult, referenceText, firstLang: lang, mode: "simple" 
    });
    const sections = res.sections || res.fallbackSections || [];
    
    // Render and hide "Show More"
    renderSections(sections, sections.length);
    setShowMoreState({ visible: false });

  } catch (err) {
    console.error(err);
    showAIFeedbackError("Could not load Quick Tips.");
  }
}

// --- Deep Mode (Chunked) ---
async function startDeepMode(azureResult, referenceText, firstLang) {
  const lang = normalizeLang(firstLang);
  
  // Store context for next chunks
  currentArgs = { azureResult, referenceText, firstLang: lang };
  accumulatedSections = [];
  currentChunk = 0;

  // Start with Chunk 1
  await fetchNextChunk();
}

async function fetchNextChunk() {
  if (currentChunk >= 3) return; // Max 3 chunks

  // Only show full loading screen for first chunk
  if (currentChunk === 0) showLoading();
  
  const nextChunkId = currentChunk + 1;

  try {
    // Call API for specific chunk
    const res = await fetchAIFeedback({
        ...currentArgs,
        mode: "detailed",
        chunk: nextChunkId
    });

    const newSections = res.sections || res.fallbackSections || [];
    
    // Add to pile
    accumulatedSections = [...accumulatedSections, ...newSections];
    currentChunk = nextChunkId;

    // Render EVERYTHING we have so far
    renderSections(accumulatedSections, accumulatedSections.length);

    // Setup "Show More" if we haven't reached Chunk 3 yet
    if (currentChunk < 3) {
        setShowMoreState({ visible: true });
        
        // Re-bind the button for the next chunk
        onShowMore(async (e) => {
            // Optional: show a mini spinner on the button itself?
            // For now, let's just disable it to prevent double-clicks
            const btn = e.target;
            const originalText = btn.textContent;
            btn.textContent = "Loading...";
            btn.disabled = true;
            
            await fetchNextChunk();
            
            // If more chunks exist, reset button state (new button is created by render usually, but just in case)
            btn.textContent = originalText;
            btn.disabled = false;
        });
    } else {
        setShowMoreState({ visible: false });
    }

  } catch (err) {
    console.error(err);
    showAIFeedbackError("Could not load next section.");
    setShowMoreState({ visible: false });
  }
}

// --- Helper ---
function normalizeLang(l) {
  return !l || !String(l).trim() ? "universal" : String(l).trim();
}

// Backwards compatibility for recorder/old calls
export const getAIFeedback = promptUserForAI;