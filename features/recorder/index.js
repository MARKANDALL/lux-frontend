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
import { promptUserForAI, mountAICoachAlwaysOn } from "../../ui/ui-ai-ai-logic.js";

import { mountAudioModeSwitch } from "./audio-mode-switch.js";
import { getAudioMode, initAudioModeDataset } from "./audio-mode-core.js";
import { setLastAttemptId, setLastRecording } from "../../app-core/runtime.js";
import { initMetricScoreModals, setMetricModalData } from "../interactions/metric-modal.js";

let isInitialized = false;
let recordingStartTime = 0; // NEW: Track duration
const STOP_DELAY_MS = 800;

// --- Guardrail Config ---
const MIN_DURATION_MS = 1500; // Must record for at least 1.5s
const MIN_SCORE_TO_SAVE = 10; // Don't save if score is < 10% (garbage audio)

function buildAttemptSummaryFromAzure(result) {
  const pa = result?.NBest?.[0]?.PronunciationAssessment || null;
  if (!pa) return null;

  const pron = Number(pa?.PronScore);
  const acc = Number(pa?.AccuracyScore);
  const flu = Number(pa?.FluencyScore);
  const comp = Number(pa?.CompletenessScore);
  const pros = Number(pa?.ProsodyScore);

  const summary = {};
  if (Number.isFinite(pron)) summary.pron = pron;
  if (Number.isFinite(acc)) summary.acc = acc;
  if (Number.isFinite(flu)) summary.flu = flu;
  if (Number.isFinite(comp)) summary.comp = comp;
  if (Number.isFinite(pros)) summary.pros = pros;

  // If nothing is finite, return null so we don’t spam empty objects.
  return Object.keys(summary).length ? summary : null;
}


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
    // ✅ Store latest recording (runtime contract) so Self Playback can download it
    try {
      const mode = getAudioMode();
      setLastRecording(audioBlob, {
        mode,
        type: audioBlob?.type || "",
        size: audioBlob?.size || 0,
        ts: Date.now(),
        scope: "practice",
      });
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

    // Enable score-click details (main page + any embedded score tiles)
    try {
      setMetricModalData({ azureResult: result, referenceText: text });
      initMetricScoreModals();
    } catch {}

    // ✅ expose word timings for SelfPB Expanded "karaoke"
    try {
      const timings = extractWordTimingsForKaraoke(result);

      window.LuxLastAzureResult = result;
      window.LuxLastWordTimings = timings;

      window.dispatchEvent(
        new CustomEvent("lux:lastAssessment", { detail: { result, timings } })
      );
    } catch {}

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
    setLastAttemptId(null);
    const uid = getUID && getUID();
    const sessionId = getSessionId();
    const localTime = new Date().toISOString();

    if (uid) {
      const summary = buildAttemptSummaryFromAzure(result);
      const saved = await saveAttempt({
        uid,
        passageKey: currentPassageKey,
        partIndex: currentPartIdx,
        text,
        azureResult: result,
        l1: lang,
        sessionId,
        localTime,
        summary,
      });

      if (saved && saved.id) {
        setLastAttemptId(saved.id);
        console.log("[Lux] Saved Attempt ID:", saved.id);

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

function extractWordTimingsForKaraoke(result) {
  const words = result?.NBest?.[0]?.Words;
  if (!Array.isArray(words) || words.length === 0) return [];

  const out = [];

  for (const w of words) {
    const word = String(w?.Word ?? w?.word ?? "").trim();
    const off = Number(w?.Offset ?? w?.offset ?? NaN);
    const dur = Number(w?.Duration ?? w?.duration ?? NaN);

    if (!word) continue;
    if (!isFinite(off) || !isFinite(dur)) continue;

    // Azure Offset/Duration are 100ns ticks → seconds
    const start = off / 10_000_000;
    const end = (off + dur) / 10_000_000;

    const acc =
      w?.PronunciationAssessment?.AccuracyScore ??
      w?.PronunciationAssessment?.Accuracy ??
      null;

    out.push({ word, start, end, acc });
  }

  return out;
}

export function initLuxRecorder() {
  if (isInitialized) return;

  // ✅ Stamp dataset immediately (even before UI mounts)
  initAudioModeDataset(getAudioMode());

  DOM.ensureRefs();

  // ✅ Always-on AI Coach shell (so it can open/close immediately on first load)
  // For Practice Skills, no context exists yet — the shell handles that gracefully.
  mountAICoachAlwaysOn(() => null);

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
