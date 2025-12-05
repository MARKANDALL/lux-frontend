// app-core/recording.js
// [HYBRID MOCK MODE]
// 1. Records REAL Audio (for Self Playback)
// 2. Returns MOCK API Results (to bypass firewall)
// 3. Auto-Scrolls + Saves Data for Summary

import {
  setText,
  setVisible,
  logStatus,
  logError,
  debug as logDebug,
} from "./lux-utils.js";

// ✅ ADDED: allPartsResults, currentParts
import { 
  currentPassageKey, 
  currentPartIdx, 
  isCustom, 
  getChosenLang, 
  allPartsResults,
  currentParts 
} from "./state.js";

// -- REAL API IMPORTS --
import { assessPronunciation, saveAttempt, getUID } from "../api/index.js";

// -- UI GATEWAYS --
import { showPrettyResults, showRawData } from "../features/results/index.js";
import { getAIFeedback } from "../ui/ui-ai-ai-logic.js";
import { markPartCompleted } from "./passages.js"; 
import { bringInputToTop } from "../helpers/index.js"; 

export let mediaRecorder = null;
let recordedChunks = [];
let isInitialized = false;

/* ===========================
   DOM helpers
   =========================== */
function getTextarea() { return document.querySelector("#referenceText"); }
function getRecordBtn() { return document.querySelector("#record"); }
function getStopBtn() { return document.querySelector("#stop"); }
function getStatusEl() { return document.querySelector("#status"); }
function getErrorEl() { return document.querySelector("#recordingError"); }

/* ===========================
   UI helpers
   =========================== */
function setStatus(message) {
  const el = getStatusEl();
  if (el) setText(el, message);
  logStatus(message);
}

function setUIRecording(isRecording) {
  const recordBtn = getRecordBtn();
  const stopBtn = getStopBtn();
  if (!recordBtn || !stopBtn) return;

  if (isRecording) {
    recordBtn.disabled = true;
    recordBtn.classList.add("record-intro", "record-glow");
    stopBtn.disabled = false;
    stopBtn.classList.add("is-armed");
  } else {
    recordBtn.disabled = false;
    recordBtn.classList.remove("record-intro", "record-glow");
    stopBtn.disabled = true;
    stopBtn.classList.remove("is-armed", "processing");
  }
}

function markStopProcessing(on) {
  const stopBtn = getStopBtn();
  if (!stopBtn) return;
  if (on) stopBtn.classList.add("processing");
  else stopBtn.classList.remove("processing");
}

/* ===========================
   MOCK DATA GENERATOR
   =========================== */
function generateMockResult(text) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const mockWords = words.map((w, i) => ({
    Word: w,
    AccuracyScore: i % 5 === 0 ? 65 : 95, 
    ErrorType: "None",
    Phonemes: w.split('').map(char => ({
      Phoneme: char.toLowerCase(),
      AccuracyScore: 90,
      ErrorType: "None"
    }))
  }));

  return {
    NBest: [{
      Confidence: 0.9,
      Lexical: text,
      ITN: text,
      MaskedITN: text,
      Display: text,
      AccuracyScore: 92.0,
      FluencyScore: 88.0,
      CompletenessScore: 100.0,
      PronScore: 89.5,
      Words: mockWords
    }]
  };
}

/* ===========================
   HYBRID RECORDING LOGIC
   =========================== */

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    mediaRecorder = new MediaRecorder(stream);
    recordedChunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      handleRecordingComplete();
    };

    mediaRecorder.start();
    setStatus("Recording...");
    setUIRecording(true);
    logDebug("Hybrid Recording Started");

  } catch (err) {
    logError("Mic access failed", err);
    setStatus("Microphone Error");
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    setStatus("Stopping...");
    markStopProcessing(true);
    mediaRecorder.stop();
  }
}

async function handleRecordingComplete() {
  try {
    const textarea = getTextarea();
    const text = textarea ? textarea.value.trim() : "Mock text";

    // Scroll input to top
    bringInputToTop();

    // A. HANDLE REAL AUDIO
    const audioBlob = new Blob(recordedChunks, { type: "audio/webm" });
    if (window.__attachLearnerBlob) {
      window.__attachLearnerBlob(audioBlob);
    }

    // B. HANDLE MOCK API
    setStatus("Analyzing (Mock)...");
    await new Promise(r => setTimeout(r, 1200));

    const result = generateMockResult(text);
    logDebug("MOCK RESULT GENERATED", result);

    // ✅ SAVE FOR SUMMARY
    // If we are in a curated passage (not custom), save the result for the summary
    if (!isCustom && currentParts && currentParts.length > 1) {
       allPartsResults[currentPartIdx] = result;
       // Shim for legacy boot.js which reads window.__allPartsResults
       window.__allPartsResults = allPartsResults; 
    }

    // C. TRIGGER UI FLOW
    setStatus("Not recording");
    markStopProcessing(false);
    setUIRecording(false);

    const prettyFn = showPrettyResults || window.showPrettyResults;
    if (prettyFn) prettyFn(result);

    bringInputToTop();
    markPartCompleted();

    try {
      const lang = getChosenLang(); 
      getAIFeedback(result, text, lang); 
    } catch (e) {
      console.warn("AI Feedback Mock Warning:", e);
    }

    try {
      const uid = getUID && getUID();
      if (uid) {
        saveAttempt({
          uid,
          passageKey: currentPassageKey,
          partIndex: currentPartIdx,
          text,
          azureResult: result
        }).catch(e => console.warn("Supabase log failed", e));
      }
    } catch (e) {}

  } catch (err) {
    logError("handleRecordingComplete failed", err);
    setStatus("Error in analysis flow");
    setUIRecording(false);
  }
}

/* ===========================
   Public Init
   =========================== */

export function initLuxRecorder() {
  if (isInitialized) return;

  const recordBtn = getRecordBtn();
  const stopBtn = getStopBtn();

  if (!recordBtn || !stopBtn) {
    console.warn("Recorder buttons not found");
    return;
  }

  recordBtn.addEventListener("click", (e) => {
    e.preventDefault();
    startRecording();
  });

  stopBtn.addEventListener("click", (e) => {
    e.preventDefault();
    stopRecording();
  });

  setUIRecording(false);
  isInitialized = true;
  logDebug("Lux Recorder (Hybrid Mock) Initialized");
}

export const wireRecordingButtons = initLuxRecorder;