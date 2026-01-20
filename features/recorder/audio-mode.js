// features/recorder/audio-mode.js
// Normal vs Pro recording constraints for Lux

const MODE_KEY = "luxAudioMode";

export function getAudioMode() {
  const v = (localStorage.getItem(MODE_KEY) || "").toLowerCase();
  return v === "pro" ? "pro" : "normal";
}

export function setAudioMode(mode) {
  const m = String(mode || "").toLowerCase() === "pro" ? "pro" : "normal";
  localStorage.setItem(MODE_KEY, m);

  // ✅ drive CSS / UI state
  try {
    document.documentElement.setAttribute("data-lux-audio-mode", m);
  } catch {}

  // ✅ broadcast for any listeners (switch UI, inspector, etc)
  try {
    window.dispatchEvent(
      new CustomEvent("lux:audioModeChanged", { detail: { mode: m } })
    );
  } catch {}

  return m;
}

export function toggleAudioMode() {
  const next = getAudioMode() === "pro" ? "normal" : "pro";
  return setAudioMode(next);
}

export function initAudioModeDataset() {
  const m = getAudioMode();
  try {
    document.documentElement.setAttribute("data-lux-audio-mode", m);
  } catch {}
  return m;
}

function supportedConstraints() {
  try {
    return navigator.mediaDevices?.getSupportedConstraints?.() || {};
  } catch {
    return {};
  }
}

export function getAudioConstraints() {
  const mode = getAudioMode();
  const supported = supportedConstraints();

  // ✅ Force explicit settings so we can compare apples-to-apples
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
    channelCount: 1, // ✅ request mono even in Pro
    sampleRate: 48000,
    sampleSize: 16,
  };

  const want = mode === "pro" ? pro : normal;

  // Only include constraints browser supports
  const audio = {};
  for (const [k, v] of Object.entries(want)) {
    if (supported[k] === true) audio[k] = v;
  }

  // If none supported, fallback to just `true`
  return { audio: Object.keys(audio).length ? audio : true };
}
