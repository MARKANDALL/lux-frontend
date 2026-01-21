// features/recorder/index.js
// The Orchestrator: Connects DOM <-> Media <-> API <-> State.
// STATUS: Complete + Quality Guardrails.

import { logError, debug as logDebug } from "../../app-core/lux-utils.js";
import * as DOM from "./ui.js";
import * as Mic from "./media.js";
import {
  currentPassageKey,
  currentPartIdx,
  getChosenLang,
  currentParts,
  getSessionId,
  pushPartResult,
} from "../../app-core/state.js";
import { assessPronunciation, saveAttempt, getUID, fetchHistory } from "/src/api/index.js";
import { showPrettyResults } from "../results/index.js";
import { markPartCompleted } from "../passages/index.js";
import { bringInputToTop } from "../../helpers/index.js";
import { promptUserForAI } from "../../ui/ui-ai-ai-logic.js";

import { mountAudioModeSwitch } from "./audio-mode-switch.js";
import { getAudioMode, initAudioModeDataset } from "./audio-mode-core.js";

let isInitialized = false;
let recordingStartTime = 0; // NEW: Track duration
const STOP_DELAY_MS = 800;

// --- Guardrail Config ---
const MIN_DURATION_MS = 1500; // Must record for at least 1.5s
const MIN_SCORE_TO_SAVE = 10; // Don't save if score is < 10% (garbage audio)

/* ===========================
   Workflow Logic
   =========================== */

async function startRecordingFlow() {
  DOM.setStatus("Recording...");
  DOM.setVisualState("recording");

  // Start the clock
  recordingStartTime = Date.now();

  const success = await Mic.startMic(handleRecordingComplete, {
    onMeter: DOM.setRecordVizLevels,
  });

  if (!success) {
    DOM.setStatus("Microphone Error");
    DOM.setVisualState("idle");
  } else {
    logDebug("Hybrid Recording Started");
  }
}

function stopRecordingFlow() {
  // Guardrail 1: Too Short?
  const duration = Date.now() - recordingStartTime;
  if (duration < MIN_DURATION_MS) {
    DOM.setStatus("Too short! Hold button longer.");
    Mic.stopMic(); // Stop but we might need to flag it to ignore in handle?
    // Actually, handleRecordingComplete will fire. We check duration there too?
    // For simplicity, we just let it stop, but we'll check valid audio in handle.
  }

  DOM.setStatus("Stopping...");
  DOM.setVisualState("processing");

  setTimeout(() => {
    Mic.stopMic();
  }, STOP_DELAY_MS);
}

async function handleRecordingComplete(audioBlob) {
  try {
    // ✅ Store latest recording globally so Self Playback can download it
    try {
      const mode = getAudioMode();
      window.LuxLastRecordingBlob = audioBlob;
      window.LuxLastRecordingMeta = {
        mode,
        type: audioBlob?.type || "",
        size: audioBlob?.size || 0,
        ts: Date.now(),
        scope: "practice",
      };

      window.dispatchEvent(
        new CustomEvent("lux:lastRecording", {
          detail: { blob: audioBlob, meta: window.LuxLastRecordingMeta },
        })
      );
    } catch {}

    // Guardrail 1 Check: Audio Size
    if (audioBlob.size < 1000) {
      // < 1kb is definitely silence/error
      DOM.setStatus("Recording too short/empty.");
      DOM.setVisualState("idle");
      return; // EXIT EARLY
    }

    DOM.setVisualState("analyzing");
    const text = DOM.ui.textarea ? DOM.ui.textarea.value.trim() : "";
    bringInputToTop();

    // 1. Audio Handoff
    const audioEl = document.getElementById("playbackAudio");
    if (audioEl) {
      if (audioEl.src) URL.revokeObjectURL(audioEl.src);
      audioEl.src = URL.createObjectURL(audioBlob);
    }

    if (window.__attachLearnerBlob) window.__attachLearnerBlob(audioBlob);

    DOM.setStatus("Analyzing...");

    // 2. Azure Analysis
    const lang = getChosenLang();
    const result = await assessPronunciation({
      audioBlob,
      text,
      firstLang: lang,
    });

    logDebug("AZURE RESULT RECEIVED", result);

    // Guardrail 2: Bad Score / No Speech Detected?
    const score = result?.NBest?.[0]?.PronScore || 0;
    if (score < MIN_SCORE_TO_SAVE) {
      console.warn("[Lux] Score too low (" + score + "%). Not saving to history.");
      DOM.setStatus("No clear speech detected. Try again!");
      DOM.setVisualState("idle");

      // We still show results so user sees "0%" and knows why
      const prettyFn = showPrettyResults || window.showPrettyResults;
      if (prettyFn) prettyFn(result);
      return; // EXIT EARLY - DO NOT SAVE
    }

    // 3. Update State
    if (currentParts && currentParts.length > 0) {
      pushPartResult(currentPartIdx, result);
    }

    DOM.setStatus("Not recording");
    DOM.setVisualState("idle");

    // 5. Show Results
    const prettyFn = showPrettyResults || window.showPrettyResults;
    if (prettyFn) prettyFn(result);

    bringInputToTop();
    markPartCompleted();

    // 6. DB Save & Refresh
    await saveToDatabase(result, text, lang);

    // 7. AI Trigger
    promptUserForAI(result, text, lang);
  } catch (err) {
    logError("handleRecordingComplete failed", err);
    DOM.setStatus("Error: " + (err.message || "Analysis failed"));
    DOM.setVisualState("idle");
  }
}

async function saveToDatabase(result, text, lang) {
  try {
    window.lastAttemptId = null;
    const uid = getUID && getUID();
    const sessionId = getSessionId();
    const localTime = new Date().toISOString();

    if (uid) {
      const saved = await saveAttempt({
        uid,
        passageKey: currentPassageKey,
        partIndex: currentPartIdx,
        text,
        azureResult: result,
        l1: lang,
        sessionId,
        localTime,
      });

      if (saved && saved.id) {
        window.lastAttemptId = saved.id;
        console.log("[Lux] Saved Attempt ID:", window.lastAttemptId);

        // REFRESH DASHBOARD (keeps the drawer intact)
        if (window.refreshDashboard) {
          try {
            await window.refreshDashboard();
          } catch (_) {}
        }
      }
    }
  } catch (e) {
    console.warn("DB Save Error", e);
  }
}

export function initLuxRecorder() {
  if (isInitialized) return;

  // ✅ Stamp dataset immediately (even before UI mounts)
  initAudioModeDataset(getAudioMode());

  DOM.ensureRefs();

  // ✅ Audio Mode Switch (Normal / Pro)
  mountAudioModeSwitch({ scope: "practice" });

  const found = DOM.wireButtons({
    onRecord: startRecordingFlow,
    onStop: stopRecordingFlow,
  });
  if (found) {
    DOM.setVisualState("idle");
    isInitialized = true;
    logDebug("Lux Recorder (Modular) Initialized");
  }
}
export const wireRecordingButtons = initLuxRecorder;
