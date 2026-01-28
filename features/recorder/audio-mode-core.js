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
 * Read from localStorage.
 * - Accepts both canonical ("NORMAL"/"PRO") and legacy ("normal"/"pro")
 * - Defaults to NORMAL for first-run/invalid values
 * - Seeds localStorage to "NORMAL" only if nothing valid is stored
 *   (does not override a saved PRO)
 */
export function getAudioMode() {
  try {
    const raw = localStorage.getItem(KEY);
    const low = String(raw || "").toLowerCase();

    // Accept both canonical + legacy values
    if (raw === AUDIO_MODES.PRO || low === "pro") return AUDIO_MODES.PRO;
    if (raw === AUDIO_MODES.NORMAL || low === "normal") return AUDIO_MODES.NORMAL;

    // Default for everyone (first run / invalid value): NORMAL
    try {
      localStorage.setItem(KEY, AUDIO_MODES.NORMAL);
    } catch {}

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
