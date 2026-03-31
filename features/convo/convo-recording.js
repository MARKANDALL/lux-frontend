// features/convo/convo-recording.js
import { buildAudioConstraints } from "../recorder/audio-mode.js";
import AudioInspector from "../recorder/audio-inspector.js";
import { clamp } from "../../helpers/core.js";

function setConvoTalkVizLevels(levels = []) {
  const btn = document.querySelector("#convoApp .lux-convoTalkBtn");
  if (!btn) return;

  const bars = btn.querySelectorAll(".lux-recBar");
  if (!bars || !bars.length) return;

  for (let i = 0; i < bars.length; i++) {
    const vRaw = (levels && typeof levels[i] === "number") ? levels[i] : 0.12;
    const v = Math.max(0.08, Math.min(1, vRaw));
    bars[i].style.setProperty("--y", v.toFixed(3));
  }
}

function resetConvoTalkViz() {
  setConvoTalkVizLevels([]);
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

      const avg = sum / Math.max(1, count);
      let v = (avg / 255) * 1.9;
      v = Math.pow(v, 0.65);
      levels.push(clamp(v, 0.08, 1));
    }

    try {
      onMeter(levels);
    } catch (err) {
      globalThis.warnSwallow("features/convo/convo-recording.js", err, "important");
    }

    rafId = requestAnimationFrame(tick);
  };

  tick();

  return () => {
    alive = false;
    if (rafId) cancelAnimationFrame(rafId);
    try {
      ctx.close();
    } catch (err) {
      globalThis.warnSwallow("features/convo/convo-recording.js", err, "important");
    }
  };
}

export function createConvoRecording({ state }) {
  let stopMeterFn = null;

  async function startRecording() {
    state.chunks = [];

    state.stream = await navigator.mediaDevices.getUserMedia(buildAudioConstraints());

    await AudioInspector.noteStream(state.stream, "convo");

    const prefer = ["audio/webm;codecs=opus", "audio/webm"];
    let opts = {};
    try {
      for (const t of prefer) {
        if (window.MediaRecorder?.isTypeSupported?.(t)) {
          opts.mimeType = t;
          break;
        }
      }
    } catch (err) {
      globalThis.warnSwallow("features/convo/convo-recording.js", err, "important");
    }

    state.recorder = new MediaRecorder(state.stream, opts);

    AudioInspector.noteRecorder(state.recorder);

    if (stopMeterFn) {
      stopMeterFn();
      stopMeterFn = null;
    }
    stopMeterFn = startLevelMeter(state.stream, setConvoTalkVizLevels, 10);

    state.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) state.chunks.push(e.data);
    };

    state.recorder.start();
  }

  async function stopRecordingAndGetBlob() {
    return new Promise((resolve) => {
      if (!state.recorder) {
        resetConvoTalkViz();
        return resolve(null);
      }

      const rec = state.recorder;
      rec.onstop = () => {
        if (stopMeterFn) {
          stopMeterFn();
          stopMeterFn = null;
        }
        resetConvoTalkViz();

        try {
          state.stream?.getTracks()?.forEach((t) => t.stop());
        } catch (err) {
          globalThis.warnSwallow("features/convo/convo-recording.js", err, "important");
        }
        state.stream = null;

        const blob = new Blob(state.chunks, {
          type: rec.mimeType || "audio/webm",
        });

        AudioInspector.noteBlob(blob);

        state.chunks = [];
        state.recorder = null;
        resolve(blob);
      };

      rec.stop();
    });
  }

  return { startRecording, stopRecordingAndGetBlob };
}