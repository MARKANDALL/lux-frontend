// features/recorder/index.js
// The Orchestrator: Connects DOM <-> Media <-> API <-> State.
// UPDATED: Allows Custom parts to be pushed to session results (for aggregation).

import { logError, debug as logDebug } from "../../app-core/lux-utils.js";

// 1. Modules (Local Siblings)
import * as DOM from "./ui.js";
import * as Mic from "./media.js";

// 2. State & Data
import { 
  currentPassageKey, 
  currentPartIdx, 
  isCustom, 
  getChosenLang, 
  currentParts,
  getSessionId,
  pushPartResult
} from "../../app-core/state.js";

// 3. APIs & Features
import { assessPronunciation, saveAttempt, getUID } from "../../api/index.js";
import { showPrettyResults } from "../results/index.js"; 
import { getAIFeedback } from "../../ui/ui-ai-ai-logic.js";
import { markPartCompleted } from "../passages/index.js"; 
import { bringInputToTop } from "../../helpers/index.js"; 

let isInitialized = false;
// The "Hang Time" duration. Matches the CSS animation (~0.8s).
const STOP_DELAY_MS = 800; 

/* ===========================
   Workflow Logic
   =========================== */

async function startRecordingFlow() {
  DOM.setStatus("Recording...");
  DOM.setVisualState("recording");
  
  const success = await Mic.startMic(handleRecordingComplete);
  
  if (!success) {
    DOM.setStatus("Microphone Error");
    DOM.setVisualState("idle");
  } else {
    logDebug("Hybrid Recording Started");
  }
}

function stopRecordingFlow() {
  DOM.setStatus("Stopping...");
  DOM.setVisualState("processing");

  setTimeout(() => {
    Mic.stopMic();
  }, STOP_DELAY_MS);
}

/**
 * Called by Mic.onstop when the blob is ready.
 */
async function handleRecordingComplete(audioBlob) {
  try {
    DOM.setVisualState("analyzing"); 

    const text = DOM.ui.textarea ? DOM.ui.textarea.value.trim() : "";

    bringInputToTop();

    // --- AUDIO HANDOFF ---
    const audioEl = document.getElementById("playbackAudio");
    if (audioEl) {
        if (audioEl.src) URL.revokeObjectURL(audioEl.src);
        const audioUrl = URL.createObjectURL(audioBlob);
        audioEl.src = audioUrl; 
    }
    
    if (window.__attachLearnerBlob) {
      window.__attachLearnerBlob(audioBlob);
    }

    DOM.setStatus("Analyzing...");
    
    // --- API CALL ---
    const lang = getChosenLang();
    const result = await assessPronunciation({ 
      audioBlob, 
      text, 
      firstLang: lang 
    });

    logDebug("AZURE RESULT RECEIVED", result);

    // --- UPDATED: Save result even if Custom (enables aggregation) ---
    // We check currentParts length to ensure we have a valid context
    if (currentParts && currentParts.length > 0) {
       pushPartResult(currentPartIdx, result);
    }

    DOM.setStatus("Not recording");
    DOM.setVisualState("idle");

    const prettyFn = showPrettyResults || window.showPrettyResults;
    if (prettyFn) prettyFn(result);

    bringInputToTop();
    markPartCompleted();

    getAIFeedback(result, text, lang).catch(e => console.warn("AI Feedback Error:", e));
    saveToDatabase(result, text, lang);

  } catch (err) {
    logError("handleRecordingComplete failed", err);
    DOM.setStatus("Error: " + (err.message || "Analysis failed"));
    DOM.setVisualState("idle");
  }
}

function saveToDatabase(result, text, lang) {
  try {
    const uid = getUID && getUID();
    const sessionId = getSessionId();
    const localTime = new Date().toISOString();

    if (uid) {
      saveAttempt({
        uid,
        passageKey: currentPassageKey,
        partIndex: currentPartIdx,
        text,
        azureResult: result,
        l1: lang,
        sessionId,
        localTime
      }).catch(e => console.warn("Supabase log failed", e));
    }
  } catch (e) {
    console.warn("DB Save Error", e);
  }
}

/* ===========================
   Public Init
   =========================== */

export function initLuxRecorder() {
  if (isInitialized) return;

  const found = DOM.wireButtons({
    onRecord: startRecordingFlow,
    onStop: stopRecordingFlow
  });

  if (found) {
    DOM.setVisualState("idle");
    isInitialized = true;
    logDebug("Lux Recorder (Modular) Initialized");
  }
}

export const wireRecordingButtons = initLuxRecorder;