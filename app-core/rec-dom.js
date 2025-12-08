// app-core/rec-dom.js
// Responsible for all DOM element lookups and UI state updates.

import { setText, logStatus } from "./lux-utils.js";

// --- Element Getters ---
export const ui = {
  get textarea() { return document.querySelector("#referenceText"); },
  get recordBtn() { return document.querySelector("#record"); },
  get stopBtn() { return document.querySelector("#stop"); },
  get status() { return document.querySelector("#status"); },
  get error() { return document.querySelector("#recordingError"); },
};

// --- UI Actions ---

export function setStatus(msg) {
  if (ui.status) setText(ui.status, msg);
  logStatus(msg);
}

export function setVisualState(state) {
  const { recordBtn, stopBtn } = ui;
  if (!recordBtn || !stopBtn) return;

  if (state === "recording") {
    // Record: disabled + glow, Stop: enabled + armed
    recordBtn.disabled = true;
    recordBtn.classList.add("record-intro", "record-glow");
    stopBtn.disabled = false;
    stopBtn.classList.add("is-armed");
  } else if (state === "processing") {
    // Record: disabled, Stop: disabled + spinner
    recordBtn.disabled = false; // Optional: keep disabled if you want
    recordBtn.classList.remove("record-intro", "record-glow");
    stopBtn.disabled = true;
    stopBtn.classList.add("processing");
  } else {
    // Idle
    recordBtn.disabled = false;
    recordBtn.classList.remove("record-intro", "record-glow");
    stopBtn.disabled = true;
    stopBtn.classList.remove("is-armed", "processing");
  }
}

export function wireButtons({ onRecord, onStop }) {
  const { recordBtn, stopBtn } = ui;
  if (!recordBtn || !stopBtn) {
    console.warn("[LUX] Recorder buttons missing from DOM");
    return false;
  }

  recordBtn.addEventListener("click", (e) => {
    e.preventDefault();
    onRecord();
  });

  stopBtn.addEventListener("click", (e) => {
    e.preventDefault();
    onStop();
  });
  
  return true;
}