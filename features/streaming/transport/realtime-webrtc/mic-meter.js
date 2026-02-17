// C:\dev\LUX_GEMINI\features\streaming\transport\realtime-webrtc\mic-meter.js
// One-line: WebAudio mic-level meter (start/stop) used by realtime-webrtc transport (moved verbatim; minimal glue only).

export function startMicMeter(ctx) {
  const {
    getMicStream,
    stopMicMeter,
    setMeterState,
    getMeterState,
    pushHealth,
  } = ctx;

  try {
    const micStream = getMicStream?.();
    if (!micStream) return;

    stopMicMeter();

    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    const micAC = new AC();
    // Attempt to resume immediately (connect is user gesture)
    micAC.resume?.().catch(() => {});

    const micAnalyser = micAC.createAnalyser();
    micAnalyser.fftSize = 512;
    micAnalyser.smoothingTimeConstant = 0.6;

    const micSrc = micAC.createMediaStreamSource(micStream);
    micSrc.connect(micAnalyser);

    const buf = new Uint8Array(micAnalyser.fftSize);

    const micTick = window.setInterval(() => {
      if (!micAnalyser) return;
      micAnalyser.getByteTimeDomainData(buf);

      // RMS on centered [-1..1]
      let sum = 0;
      for (let i = 0; i < buf.length; i++) {
        const v = (buf[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / buf.length);

      // Map to a friendly 0..1 range (tweakable)
      const level = Math.max(0, Math.min(1, rms * 3.2));
      pushHealth({ micLevel: level });
    }, 100);

    setMeterState({ micAC, micAnalyser, micSrc, micTick });
  } catch {
    // never fail connect because of a meter
  }
}

export function stopMicMeter(ctx) {
  const { setMeterState, getMeterState, pushHealth } = ctx;

  const s = getMeterState?.() || {};

  try { if (s.micTick) window.clearInterval(s.micTick); } catch {}

  try { s.micSrc?.disconnect?.(); } catch {}
  try { s.micAnalyser?.disconnect?.(); } catch {}
  try { s.micAC?.close?.(); } catch {}

  setMeterState({ micAC: null, micAnalyser: null, micSrc: null, micTick: null });

  // reset UI calm
  pushHealth({ micLevel: 0 });
}
