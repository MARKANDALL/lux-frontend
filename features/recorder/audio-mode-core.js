// features/recorder/audio-mode-core.js
// Shared state helpers for Audio Mode (NORMAL / PRO)

export const AUDIO_MODES = {
  NORMAL: "NORMAL",
  PRO: "PRO",
};

const KEY = "luxAudioMode";

/**
 * Convert "NORMAL"/"PRO" -> html dataset value: "normal"/"pro"
 */
function toDatasetValue(mode) {
  return mode === AUDIO_MODES.PRO ? "pro" : "normal";
}

/**
 * Ensure <html data-lux-audio-mode="normal|pro">
 * (your CSS targets this)
 */
export function initAudioModeDataset(mode) {
  const html = document.documentElement;
  if (!html) return;

  html.setAttribute("data-lux-audio-mode", toDatasetValue(mode));
}

/**
 * Read from localStorage (defaults to NORMAL)
 */
export function getAudioMode() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === AUDIO_MODES.PRO) return AUDIO_MODES.PRO;
    return AUDIO_MODES.NORMAL;
  } catch {
    return AUDIO_MODES.NORMAL;
  }
}

/**
 * Store to localStorage + update dataset
 */
export function setAudioMode(mode) {
  const safe = mode === AUDIO_MODES.PRO ? AUDIO_MODES.PRO : AUDIO_MODES.NORMAL;

  try {
    localStorage.setItem(KEY, safe);
  } catch {
    // ignore storage failures (private mode etc.)
  }

  initAudioModeDataset(safe);
  return safe;
}
