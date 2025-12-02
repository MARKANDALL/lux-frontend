// app-core/recording.js
// Robust, tolerant recording wiring for the Pronunciation Tool.
// - Idempotent init
// - Works with multiple selector patterns (legacy + new)
// - Delegates to assessPronunciation({ audioBlob, text, firstLang })
// - Integrates with "grown-up" button animations (record-intro / record-glow / stop.processing)
// - After successful assess + render, enables Next Part for multi-part passages.
// - Kicks off AI feedback rendering (non-blocking) via ui-ai-ai-logic.js.
// - Logs attempts to the backend (Supabase pipeline) via api/index.js.

import {
  qs, // kept for compatibility even if unused right now
  setText,
  setVisible,
  logStatus,
  logError,
  debug as logDebug,
} from "./lux-utils.js";

import { currentPassageKey, currentPartIdx, isCustom } from "./state.js";

import {
  assessPronunciation,
  saveAttempt,
  getUID,
} from "../api/index.js";

import { speechDetected } from "../helpers/index.js";

// Canonical results gateway (import-first, window fallback)
import { showPrettyResults, showRawData } from "../features/results/index.js";

// AI feedback gateway (ES module; logic lives in ui-ai-ai-logic.js)
import { getAIFeedback } from "../ui/ui-ai-ai-logic.js";

export let mediaRecorder = null;

let isInitialized = false;
let recordedChunks = [];

/* ===========================
   DOM helpers
   =========================== */

function getTextarea() {
  return (
    document.querySelector("#passage-textarea") ||
    document.querySelector("[data-role='passage-text']") ||
    document.querySelector("#referenceText") ||
    document.querySelector("[data-role='reference-text']") ||
    document.querySelector("textarea")
  );
}

function getRecordBtn() {
  return (
    document.querySelector("#record-btn") ||
    document.querySelector("#record") ||
    document.querySelector("[data-role='record-btn']") ||
    document.querySelector(".record-btn")
  );
}

function getStopBtn() {
  return (
    document.querySelector("#stop-btn") ||
    document.querySelector("#stop") ||
    document.querySelector("[data-role='stop-btn']") ||
    document.querySelector(".stop-btn")
  );
}

function getStatusEl() {
  return (
    document.querySelector("#recordingStatus") ||
    document.querySelector("#status") ||
    document.querySelector("[data-role='recording-status']")
  );
}

function getErrorEl() {
  return (
    document.querySelector("#recordingError") ||
    document.querySelector(".recording-error") ||
    document.querySelector("[data-role='recording-error']")
  );
}

function getFirstLangSelect() {
  return (
    document.querySelector("#firstLang") ||
    document.querySelector("[name='firstLang']") ||
    document.querySelector("[data-role='first-lang']")
  );
}

/* ===========================
   UI helpers
   =========================== */

function setStatus(message) {
  const el = getStatusEl();
  if (el) setText(el, message);
  logStatus(message);
}

function setError(message) {
  const el = getErrorEl();
  if (el) {
    setText(el, message);
    setVisible(el, !!message);
  }
  if (message) logError(message);
}

// Hook into your CSS animations:
// - #record.record-intro + #record.record-glow → gold pulse while recording
// - #stop.processing → green stripes while stopping/analyzing
function setUIRecording(isRecording) {
  const recordBtn = getRecordBtn();
  const stopBtn = getStopBtn();
  if (!recordBtn || !stopBtn) return;

  if (isRecording) {
    recordBtn.disabled = true;
    stopBtn.disabled = false;

    recordBtn.classList.add("is-recording");
    recordBtn.classList.add("record-intro", "record-glow");
    stopBtn.classList.add("is-armed");
    stopBtn.classList.remove("processing");
  } else {
    recordBtn.disabled = false;
    stopBtn.disabled = true;

    recordBtn.classList.remove("is-recording");
    recordBtn.classList.remove("record-intro", "record-glow");
    stopBtn.classList.remove("is-armed");
    stopBtn.classList.remove("processing");
  }
}

function markStopProcessing(on) {
  const stopBtn = getStopBtn();
  if (!stopBtn) return;
  if (on) stopBtn.classList.add("processing");
  else stopBtn.classList.remove("processing");
}

function getFirstLangCode() {
  const sel = getFirstLangSelect();
  if (!sel) return "universal";

  const raw = String(sel.value || sel.options?.[sel.selectedIndex]?.value || "")
    .trim()
    .toLowerCase();

  if (!raw) return "universal";
  if (raw.includes("span")) return "es";
  if (raw.includes("franc") || raw === "fr") return "fr";
  if (raw.includes("port")) return "pt";
  if (raw.includes("arab")) return "ar";
  if (raw.includes("russ")) return "ru";
  if (raw.includes("jap")) return "ja";
  if (raw.includes("kore")) return "ko";
  if (raw.includes("hindi")) return "hi";
  if (raw.includes("universal")) return "universal";
  return raw;
}

/* ===========================
   Recording lifecycle
   =========================== */

async function handleRecordingComplete() {
  // Whatever happens, we're no longer "stopping..."
  markStopProcessing(false);

  try {
    const textarea = getTextarea();
    const text = textarea ? textarea.value.trim() : "";

    if (!recordedChunks.length) {
      setError("No audio was captured. Please try again.");
      setStatus("Not recording");
      setUIRecording(false);
      logError("handleRecordingComplete: no recordedChunks");
      return;
    }

    const audioBlob = new Blob(recordedChunks, {
      type: "audio/webm;codecs=opus",
    });
    recordedChunks = [];

    setStatus("Analyzing...");
    markStopProcessing(true);
    setUIRecording(false);

    const firstLang = getFirstLangCode();

    const result = await assessPronunciation({ audioBlob, text, firstLang });

    logDebug("assess: ok", result);
    setStatus("Not recording");
    setError("");
    markStopProcessing(false);
    setUIRecording(false);

    // Import-first, window-fallback (keeps legacy safe)
    const prettyFn = showPrettyResults || window.showPrettyResults;
    const rawFn = showRawData || window.showRawData;

    const hasPretty = typeof prettyFn === "function";
    const hasRaw = typeof rawFn === "function";

    logDebug("render hooks", { hasPretty, hasRaw });

    if (!hasPretty && !hasRaw) {
      setError(
        "Analysis completed, but the result view module did not load. Check features/results/index.js."
      );
      return;
    }

    try {
      if (hasPretty) prettyFn(result);
      if (hasRaw) rawFn(result);

      // Phase-N fix: after a successful assess+render, enable Next Part
      // for multi-part curated passages. Dynamic import avoids cycles.
      import("./passages.js").then((m) => m.markPartCompleted?.());

      // Kick off AI feedback (non-blocking, best-effort).
      // Only if we actually detected speech in the Azure result.
      try {
        if (
          typeof getAIFeedback === "function" &&
          speechDetected &&
          speechDetected(result)
        ) {
          getAIFeedback(result, text, firstLang);
        }
      } catch (aiErr) {
        logDebug("getAIFeedback call failed (non-fatal)", aiErr);
      }
    } catch (renderErr) {
      logError("render failed", renderErr);
      setError(
        "We analyzed your recording but hit a rendering error. See console for details."
      );
    }

    // Non-blocking attempt logging to Supabase via backend API.
    // Mirrors old behavior: best-effort, never breaks the UX.
    try {
      if (typeof saveAttempt === "function" && typeof getUID === "function") {
        const uid = getUID();
        const passageKey = isCustom ? "custom" : currentPassageKey;
        const partIndex = isCustom ? 0 : currentPartIdx;

        // Fire-and-forget; we don't await to keep UI snappy.
        saveAttempt({
          uid,
          passageKey,
          partIndex,
          text,
          azureResult: result,
        })
          .then(() => {
            logDebug("[saveAttempt] ok");
          })
          .catch((e) => {
            logDebug("[saveAttempt] failed (non-blocking)", e);
          });
      }
    } catch (logErr) {
      logDebug("attempt logging failed (non-fatal)", logErr);
    }
  } catch (err) {
    logError("handleRecordingComplete failed", err);
    setError("There was a problem analyzing that recording. Please try again.");
    setStatus("Not recording");
    markStopProcessing(false);
    setUIRecording(false);
  }
}

async function startRecording() {
  try {
    const textarea = getTextarea();
    const recordBtn = getRecordBtn();
    const stopBtn = getStopBtn();

    if (!textarea || !recordBtn || !stopBtn) {
      logDebug("startRecording: missing elements", {
        textarea: !!textarea,
        recordBtn: !!recordBtn,
        stopBtn: !!stopBtn,
      });
      setError("Recording controls not found in the page.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Recording is not supported in this browser.");
      return;
    }

    if (mediaRecorder && mediaRecorder.state === "recording") {
      logDebug("startRecording: already recording");
      return;
    }

    setError("");
    setStatus("Starting recording...");
    setUIRecording(true);
    recordedChunks = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    mediaRecorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) recordedChunks.push(ev.data);
    };

    mediaRecorder.onstop = () => {
      try {
        stream.getTracks().forEach((t) => t.stop());
      } catch (e) {
        logError("error stopping tracks", e);
      }
      handleRecordingComplete();
    };

    mediaRecorder.onerror = (ev) => {
      logError("MediaRecorder error", ev?.error || ev);
      setError("Recording failed. Please try again or check your microphone.");
      setStatus("Not recording");
      markStopProcessing(false);
      setUIRecording(false);
    };

    mediaRecorder.start();
    logDebug("startRecording: started", { mimeType: mediaRecorder.mimeType });
  } catch (err) {
    logError("startRecording failed", err);
    setError(
      "Could not start recording. Please allow microphone access and try again."
    );
    setStatus("Not recording");
    markStopProcessing(false);
    setUIRecording(false);
  }
}

function stopRecording() {
  if (!mediaRecorder || mediaRecorder.state !== "recording") {
    logDebug("stopRecording: nothing to stop");
    return;
  }

  setStatus("Stopping...");
  markStopProcessing(true);

  try {
    mediaRecorder.stop();
  } catch (err) {
    logError("stopRecording: error calling stop()", err);
    setError("Could not stop recording cleanly. Please try again.");
    setStatus("Not recording");
    markStopProcessing(false);
    setUIRecording(false);
  }
}

/* ===========================
   Public init & legacy shims
   =========================== */

export function initLuxRecorder() {
  if (isInitialized) {
    logDebug("initLuxRecorder: already initialized");
    return;
  }

  const textarea = getTextarea();
  const recordBtn = getRecordBtn();
  const stopBtn = getStopBtn();

  if (!textarea || !recordBtn || !stopBtn) {
    logDebug("initLuxRecorder: missing controls", {
      textarea: !!textarea,
      recordBtn: !!recordBtn,
      stopBtn: !!stopBtn,
    });
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
  logDebug("initLuxRecorder: wired record/stop", {
    textarea: !!textarea,
    recordBtn: !!recordBtn,
    stopBtn: !!stopBtn,
  });
}

export const wireRecordingButtons = initLuxRecorder;

// Legacy stubs: keep as no-ops until rehomed
export const wireRawToggle = () => {
  logDebug("wireRawToggle: no-op (legacy stub)");
};

export const wirePlayback = () => {
  logDebug("wirePlayback: no-op (legacy stub)");
};
