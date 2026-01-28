// features/recorder/audio-mode.js
// Compatibility layer: keep the legacy API (normal/pro) while using the canonical core (NORMAL/PRO)

import {
  AUDIO_MODES as CORE_MODES,
  getAudioMode as getCoreAudioMode,
  setAudioMode as setCoreAudioMode,
  initAudioModeDataset as initCoreDataset,
} from "./audio-mode-core.js";

// Legacy (lowercase) enum — some modules expect these exact strings
export const AUDIO_MODES = {
  NORMAL: "normal",
  PRO: "pro",
};

// ---- Legacy API (kept) ----

export function getAudioMode() {
  const m = getCoreAudioMode(); // "NORMAL" | "PRO"
  return m === CORE_MODES.PRO ? "pro" : "normal";
}

export function setAudioMode(mode) {
  const wantLower = String(mode || "").toLowerCase() === "pro" ? "pro" : "normal";
  const wantCore = wantLower === "pro" ? CORE_MODES.PRO : CORE_MODES.NORMAL;

  // Persist via core (also stamps <html data-lux-audio-mode="...">)
  const savedCore = setCoreAudioMode(wantCore);

  // Ensure dataset is stamped (core already does this, but safe)
  initCoreDataset(savedCore);

  // Broadcast in legacy lower-case (listeners may expect "pro"/"normal")
  try {
    window.dispatchEvent(
      new CustomEvent("lux:audioModeChanged", { detail: { mode: wantLower } })
    );
  } catch {}

  return wantLower;
}

export function toggleAudioMode() {
  return setAudioMode(getAudioMode() === "pro" ? "normal" : "pro");
}

export function initAudioModeDataset() {
  const core = getCoreAudioMode();
  initCoreDataset(core);
  return getAudioMode();
}

// ---- Constraints API (kept) ----

function supportedConstraints() {
  try {
    return navigator.mediaDevices?.getSupportedConstraints?.() || {};
  } catch {
    return {};
  }
}

export function getAudioConstraints() {
  const mode = getAudioMode(); // "normal" | "pro"
  const supported = supportedConstraints();

  const normal = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
    sampleRate: 48000,
    sampleSize: 16,
  };

  const pro = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
    sampleRate: 48000,
    sampleSize: 16,
  };

  const want = mode === "pro" ? pro : normal;

  const audio = {};
  for (const [k, v] of Object.entries(want)) {
    if (supported[k] === true) audio[k] = v;
  }

  return { audio: Object.keys(audio).length ? audio : true };
}

// Back-compat alias (some modules import buildAudioConstraints)
export function buildAudioConstraints() {
  return getAudioConstraints();
}
