// features/progress/wordcloud/timeline.js

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

/**
 * createTimelineController(config)
 * Config shape MUST match what index.js passes in.
 */
export function createTimelineController({
  dom,

  getRange,
  setRange,

  getWin,
  setWin,

  getPos,
  setPos,

  fmtDaysAgo,
  applyTimelineUI,
  requestDraw,
}) {
  let timer = null;

  const btnReplay = dom?.btnReplay;
  const posSlider = dom?.posSlider;

  function maxPos() {
    // prefer slider max if present
    const m = Number(posSlider?.max);
    return Number.isFinite(m) && m > 0 ? m : 90;
  }

  function isPlaying() {
    return !!timer;
  }

  function syncButton() {
    if (!btnReplay) return;

    // show only if in timeline mode
    const show = typeof getRange === "function" ? getRange() === "timeline" : true;
    btnReplay.style.display = show ? "inline-flex" : "none";

    btnReplay.textContent = isPlaying() ? "⏸ Stop" : "▶ Replay";
    btnReplay.title = isPlaying()
      ? "Stop timeline replay"
      : "Replay your progress over time";
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    syncButton();
  }

  function play({ stepDays = 1, intervalMs = 650 } = {}) {
    stop();

    // If user hits replay while not in timeline, switch them to it.
    if (typeof getRange === "function" && typeof setRange === "function") {
      if (getRange() !== "timeline") setRange("timeline");
    }

    syncButton();

    timer = setInterval(() => {
      try {
        const pos = Number(typeof getPos === "function" ? getPos() : 0) || 0;
        const next = clamp(pos + stepDays, 0, maxPos());

        if (typeof setPos === "function") setPos(next);

        // keep UI synced + redraw
        applyTimelineUI?.();
        requestDraw?.();

        if (next >= maxPos()) stop();
      } catch (err) {
        console.error("[wc/timeline] replay tick failed:", err);
        stop();
      }
    }, intervalMs);

    syncButton();
  }

  function toggle() {
    if (timer) stop();
    else play();
  }

  // Slider delegates (events.js calls these)
  function setWinSafe(val) {
    if (typeof setWin === "function") setWin(Number(val) || 14);
    applyTimelineUI?.();
    requestDraw?.();
  }

  function setPosSafe(val) {
    if (typeof setPos === "function") setPos(Number(val) || 0);
    applyTimelineUI?.();
    requestDraw?.();
  }

  // initial label
  syncButton();

  return {
    play,
    stop,
    toggle,
    syncButton,
    setWin: setWinSafe,
    setPos: setPosSafe,
  };
}
