// app-core/recording.js
// The Orchestrator: Connects DOM <-> Media <-> API <-> State.

import { logError, debug as logDebug } from "./lux-utils.js";

// 1. Modules
import * as DOM from "./rec-dom.js";
import * as Mic from "./rec-media.js";

// 2. State & Data
import { 
  currentPassageKey, 
  currentPartIdx, 
  isCustom, 
  getChosenLang, 
  currentParts,
  getSessionId,
  pushPartResult
} from "./state.js";

// 3. APIs & Features
import { assessPronunciation, saveAttempt, getUID } from "../api/index.js";
import { showPrettyResults } from "../features/results/index.js";
import { getAIFeedback } from "../ui/ui-ai-ai-logic.js";
import { markPartCompleted } from "./passages.js"; 
import { bringInputToTop } from "../helpers/index.js"; 

let isInitialized = false;

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
  Mic.stopMic();
}

/**
 * Called by Mic.onstop when the blob is ready.
 */
async function handleRecordingComplete(audioBlob) {
  try {
    const text = DOM.ui.textarea ? DOM.ui.textarea.value.trim() : "";

    // 1. Scroll input to top
    bringInputToTop();

    // 2. Hydrate Audio Sink (Self-Playback)
    if (window.__attachLearnerBlob) {
      window.__attachLearnerBlob(audioBlob);
    }

    // 3. UI: Set Status
    DOM.setStatus("Analyzing...");
    
    // --- API CALL ---
    const lang = getChosenLang();
    const result = await assessPronunciation({ 
      audioBlob, 
      text, 
      firstLang: lang 
    });

    logDebug("AZURE RESULT RECEIVED", result);

    // 4. Save to State (Session Memory)
    if (!isCustom && currentParts && currentParts.length > 1) {
       pushPartResult(currentPartIdx, result);
    }

    // 5. Update UI
    DOM.setStatus("Not recording");
    DOM.setVisualState("idle");

    const prettyFn = showPrettyResults || window.showPrettyResults;
    if (prettyFn) prettyFn(result);

    bringInputToTop();
    markPartCompleted();

    // 6. Async: Get AI Feedback
    getAIFeedback(result, text, lang).catch(e => console.warn("AI Feedback Error:", e));

    // 7. Async: Save to Database (Atlas)
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