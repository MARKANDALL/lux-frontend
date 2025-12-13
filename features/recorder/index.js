// features/recorder/index.js
// The Orchestrator: Connects DOM <-> Media <-> API <-> State.
// STATUS: AI is OPTIONAL (Triggered via UI prompt, not automatic).

import { logError, debug as logDebug } from "../../app-core/lux-utils.js";

// 1. Modules (Local Siblings)
import * as DOM from "./ui.js";
import * as Mic from "./media.js";

// 2. State & Data
import { 
  currentPassageKey, 
  currentPartIdx, 
  getChosenLang, 
  currentParts,
  getSessionId,
  pushPartResult
} from "../../app-core/state.js";

// 3. APIs & Features
import { assessPronunciation, saveAttempt, getUID } from "../../api/index.js";
import { showPrettyResults } from "../results/index.js"; 
import { markPartCompleted } from "../passages/index.js"; 
import { bringInputToTop } from "../../helpers/index.js"; 

// --- CRITICAL IMPORT: The new Logic that asks "Do you want AI?" ---
import { promptUserForAI } from "../../ui/ui-ai-ai-logic.js"; 

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
 * Orchestrates the handoff from Audio -> Azure -> UI -> AI Prompt
 */
async function handleRecordingComplete(audioBlob) {
  try {
    DOM.setVisualState("analyzing"); 

    const text = DOM.ui.textarea ? DOM.ui.textarea.value.trim() : "";
    bringInputToTop();

    // 1. AUDIO PLAYBACK HANDOFF
    const audioEl = document.getElementById("playbackAudio");
    if (audioEl) {
        if (audioEl.src) URL.revokeObjectURL(audioEl.src);
        const audioUrl = URL.createObjectURL(audioBlob);
        audioEl.src = audioUrl; 
    }
    
    // Legacy helper hook
    if (window.__attachLearnerBlob) {
      window.__attachLearnerBlob(audioBlob);
    }

    DOM.setStatus("Analyzing...");
    
    // 2. AZURE API CALL (Pronunciation Assessment)
    // This is fast and cheap, so we do it automatically.
    const lang = getChosenLang();
    const result = await assessPronunciation({ 
      audioBlob, 
      text, 
      firstLang: lang 
    });

    logDebug("AZURE RESULT RECEIVED", result);

    // 3. UPDATE STATE
    if (currentParts && currentParts.length > 0) {
       pushPartResult(currentPartIdx, result);
    }

    // 4. RESET UI VISUALS
    DOM.setStatus("Not recording");
    DOM.setVisualState("idle");

    // 5. SHOW BASIC RESULTS (Scores, Color-coding)
    const prettyFn = showPrettyResults || window.showPrettyResults;
    if (prettyFn) prettyFn(result);

    bringInputToTop();
    markPartCompleted();

    // 6. DB SAVE
    // We save the attempt immediately so we have the record/score.
    saveToDatabase(result, text, lang);

    // 7. AI HANDOFF (OPTIONAL)
    // Instead of automatically calling getAIFeedback, we invite the user.
    // This function injects a specific "Ask AI" button into the results UI.
    promptUserForAI(result, text, lang);

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