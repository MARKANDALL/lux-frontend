// features/onboarding/onboarding-mic.js

export async function requestMic(state, card) {
  const stepPrimary = card.querySelector("#luxOnbPrimary");
  const msg = card.querySelector("#luxOnbMicMsg");

  try {
    stepPrimary.disabled = true;
    stepPrimary.textContent = "Requesting…";

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.mic.stream = stream;
    state.mic.ready = true;

    if (msg) msg.textContent = "Mic ready ✓ Try speaking — you should see the meter move.";

    // Build analyser + start meter
    setupAnalyser(state);
    resumeMeterIfPossible(state, card);

    // Keep it clickable (render() will convert to "Next" on success)
    stepPrimary.classList.add("is-success");
    stepPrimary.disabled = false;
  } catch (err) {
    state.mic.ready = false;

    if (msg) {
      msg.textContent =
        "Mic blocked. Click the 🔒 icon in your browser bar to reset permissions.";
    }

    // Restore button so they can try again
    stepPrimary.disabled = false;
    stepPrimary.textContent = "Allow microphone access";
    stepPrimary.classList.remove("is-success");
  }
}

export function setupAnalyser(state) {
  if (!state.mic.stream) return;

  // Reuse if already built
  if (state.mic.audioCtx && state.mic.analyser) return;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const audioCtx = new AudioCtx();
  const source = audioCtx.createMediaStreamSource(state.mic.stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);

  state.mic.audioCtx = audioCtx;
  state.mic.analyser = analyser;
}

export function resumeMeterIfPossible(state, card) {
  const span = card.querySelector(".lux-onb-meter > span");
  if (!span || !state.mic.analyser) return;

  // Stop any prior loop
  stopMeterOnly(state);

  const analyser = state.mic.analyser;
  const data = new Uint8Array(analyser.frequencyBinCount);

  function tick() {
    analyser.getByteTimeDomainData(data);

    // crude energy estimate (0..1)
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);

    // map to scaleX (keep ghosty, never fully flat)
    const scale = Math.min(1, Math.max(0.10, rms * 3.2));
    span.style.transform = `scaleX(${scale.toFixed(3)})`;

    state.mic.raf = requestAnimationFrame(tick);
  }

  state.mic.raf = requestAnimationFrame(tick);
}

export function stopMeterOnly(state) {
  if (state.mic.raf) cancelAnimationFrame(state.mic.raf);
  state.mic.raf = null;
}

export function stopMic(state) {
  stopMeterOnly(state);

  if (state.mic.audioCtx) {
    try { state.mic.audioCtx.close(); } catch (_) {}
  }
  state.mic.audioCtx = null;
  state.mic.analyser = null;

  if (state.mic.stream) {
    try { state.mic.stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
  }
  state.mic.stream = null;
  state.mic.ready = false;
}