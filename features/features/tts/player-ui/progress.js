// features/features/tts/player-ui/progress.js
// Logic: TTS progress render loop (RAF) for the TTS audio element.

/* --- ALWAYS-MOVES PATCH: progress render loop --- */
function wireTtsProgress(audioEl, fillEl) {
  if (!audioEl || !fillEl) return () => {};

  let raf = 0;

  const clamp01 = (n) => Math.max(0, Math.min(1, n));

  function paint(pct) {
    // Width-based bar fill (matches most simple progress-fill CSS)
    fillEl.style.width = `${clamp01(pct) * 100}%`;
  }

  function render() {
    const dur = audioEl.duration || 0;
    const t = audioEl.currentTime || 0;
    const pct = dur > 0 ? t / dur : 0;
    paint(pct);
    raf = requestAnimationFrame(render);
  }

  function start() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(render);
  }

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  // Keep it “always moves while playing” via RAF
  audioEl.addEventListener("play", start);
  audioEl.addEventListener("pause", stop);
  audioEl.addEventListener("ended", () => {
    stop();
    paint(1);
  });

  // Also update on timeupdate as a fallback
  audioEl.addEventListener("timeupdate", () => {
    const dur = audioEl.duration || 0;
    const t = audioEl.currentTime || 0;
    const pct = dur > 0 ? t / dur : 0;
    paint(pct);
  });

  // Initial state
  paint(0);

  // Return a tiny cleanup function in case you ever need it later
  return () => stop();
}

export { wireTtsProgress };
