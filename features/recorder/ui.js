// features/recorder/ui.js
// Responsible for all DOM element lookups and UI state updates.

import { setText, logStatus } from "../../app-core/lux-utils.js";

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

// Live mic level meter bars inside the Record button.
// levels = array of 0..1 values (length = number of bars).
export function setRecordVizLevels(levels = []) {
  const btn = ui.recordBtn;
  if (!btn) return;

  const bars = btn.querySelectorAll(".lux-recBar");
  if (!bars || !bars.length) return;

  for (let i = 0; i < bars.length; i++) {
    // baseline so it's never totally “dead”
    const vRaw = (levels && typeof levels[i] === "number") ? levels[i] : 0.12;
    const v = Math.max(0.08, Math.min(1, vRaw));
    bars[i].style.setProperty("--y", v.toFixed(3));
  }
}

export function resetRecordViz() {
  setRecordVizLevels([]);
}

export function setVisualState(state) {
  const { recordBtn, stopBtn } = ui;
  if (!recordBtn || !stopBtn) return;

  if (state === "recording") {
    recordBtn.disabled = true;
    recordBtn.classList.add("record-intro", "record-glow");
    stopBtn.disabled = false;
    stopBtn.classList.add("is-armed");
  } else if (state === "processing") {
    recordBtn.disabled = false;
    recordBtn.classList.remove("record-intro", "record-glow");
    stopBtn.disabled = true;
    stopBtn.classList.add("processing");
    resetRecordViz();
  } else {
    recordBtn.disabled = false;
    recordBtn.classList.remove("record-intro", "record-glow");
    stopBtn.disabled = true;
    stopBtn.classList.remove("is-armed", "processing");
    resetRecordViz();
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
// ✅ Back-compat: some code calls DOM.ensureRefs()
export function ensureRefs() {
  // Touch getters so refs resolve (no-op but safe)
  void ui.textarea;
  void ui.recordBtn;
  void ui.stopBtn;
  void ui.status;
  void ui.error;
  return ui;
}
