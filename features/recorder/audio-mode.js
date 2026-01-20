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
  return m;
}

export function toggleAudioMode() {
  const next = getAudioMode() === "pro" ? "normal" : "pro";
  return setAudioMode(next);
}

export function getAudioConstraints() {
  const mode = getAudioMode();

  // ✅ Force explicit settings so we can compare apples-to-apples
  const normal = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: 1,
  };

  const pro = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
  };

  return { audio: mode === "pro" ? pro : normal };
}
