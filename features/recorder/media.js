// features/recorder/media.js
import { logError } from "../../app-core/lux-utils.js";
import AudioInspector from "./audio-inspector.js";
import { getAudioConstraints } from "./audio-mode.js";

let mediaRecorder = null;
let recordedChunks = [];
let stopMeterFn = null;

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function startLevelMeter(stream, onMeter, bars = 10) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return () => {};

  let rafId = null;
  let alive = true;

  const ctx = new AudioCtx();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.85;

  const source = ctx.createMediaStreamSource(stream);
  source.connect(analyser);

  const freqData = new Uint8Array(analyser.frequencyBinCount);

  // kick it on (some browsers start suspended until a gesture)
  ctx.resume?.().catch?.(() => {});

  const tick = () => {
    if (!alive) return;
    analyser.getByteFrequencyData(freqData);

    const levels = [];
    const startBin = 2;
    const endBin = Math.min(freqData.length, 64);
    const span = Math.max(1, endBin - startBin);
    const step = span / bars;

    for (let i = 0; i < bars; i++) {
      const a = Math.floor(startBin + i * step);
      const b = Math.floor(startBin + (i + 1) * step);
      let sum = 0;
      let count = 0;

      for (let k = a; k < Math.max(a + 1, b); k++) {
        sum += freqData[k] || 0;
        count++;
      }

      const avg = sum / Math.max(1, count); // 0..255
      // normalize + compress so quiet speech still shows movement
      let v = (avg / 255) * 1.9;
      v = Math.pow(v, 0.65);
      levels.push(clamp(v, 0.08, 1));
    }

    try {
      onMeter(levels);
    } catch (_) {}

    rafId = requestAnimationFrame(tick);
  };

  tick();

  return () => {
    alive = false;
    if (rafId) cancelAnimationFrame(rafId);
    try {
      ctx.close();
    } catch (_) {}
  };
}

export async function startMic(onStopCallback, { onMeter } = {}) {
  try {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(getAudioConstraints());
    } catch (err) {
      console.warn("[audio] constraints rejected, falling back to {audio:true}", err);
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    // ✅ Inspector: note stream immediately (practice context)
    await AudioInspector.noteStream(stream, "practice");

    mediaRecorder = new MediaRecorder(stream);

    // ✅ Inspector: note recorder right after creation
    AudioInspector.noteRecorder(mediaRecorder);

    recordedChunks = [];

    // Optional: live mic level meter (for record-button equalizer bars)
    if (typeof onMeter === "function") {
      if (stopMeterFn) {
        stopMeterFn();
        stopMeterFn = null;
      }
      stopMeterFn = startLevelMeter(stream, onMeter, 10);
    }

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      if (stopMeterFn) {
        stopMeterFn();
        stopMeterFn = null;
      }

      stream.getTracks().forEach((t) => t.stop());

      const blob = new Blob(recordedChunks, { type: "audio/webm" });

      // ✅ Inspector: note final blob right after creation
      AudioInspector.noteBlob(blob);

      if (onStopCallback) onStopCallback(blob);
    };

    mediaRecorder.start();
    return true;
  } catch (err) {
    logError("Mic access failed", err);
    return false;
  }
}

export function stopMic() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    if (stopMeterFn) {
      stopMeterFn();
      stopMeterFn = null;
    }
    mediaRecorder.stop();
  }
}
