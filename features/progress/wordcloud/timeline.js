// features/progress/wordcloud/timeline.js

export function createTimelineController({ ctx, redraw }) {
  let timer = null;

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function play({ stepDays = 1, intervalMs = 650 } = {}) {
    stop();
    timer = setInterval(() => {
      const s = ctx.get();
      const next = Math.max(0, Number(s.timelinePos || 0) + stepDays);
      ctx.set({ timelinePos: next });
      redraw();

      // optional: auto stop at ceiling
      if (next >= 90) stop();
    }, intervalMs);
  }

  function toggle() {
    if (timer) stop();
    else play();
  }

  return { play, stop, toggle };
}
