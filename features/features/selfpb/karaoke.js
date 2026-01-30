// features/features/selfpb/karaoke.js

export function initKaraoke({ ui, api, audio, syncTime, syncScrub }) {
  /* ============================================================
     ✅ Karaoke Timeline (Expanded-only)
     - words are positioned across time
     - fill + active highlight during playback
     - click word = seek
     - click lane = jump to time
     ============================================================ */

  let kWords = [];
  let kEls = [];
  let kDur = 0;
  let kLinesUsed = 1;

  const isExpandedOpen = () => {
    const shade = document.getElementById("spb-modalShade");
    if (shade?.classList?.contains("is-open")) return true;

    const float = document.getElementById("spb-float");
    if (float?.classList?.contains("is-open")) return true;

    return false;
  };

  const clamp01 = (v) => Math.max(0, Math.min(1, v));

  function getKaraokeDuration(words) {
    const ad = audio.duration || 0;
    if (ad > 0) return ad;
    const last = words?.[words.length - 1];
    return last?.end || 0;
  }

  function seekTo(sec) {
    if (!isFinite(sec)) return;
    const dur = audio.duration || kDur || 0;
    if (!dur) return;

    audio.currentTime = api.clamp(sec, 0, dur);
    syncTime();
    syncScrub();
  }

  function renderKaraoke(words) {
    if (!ui.karaokeLane || !ui.karaokeLaneWrap) return;

    ui.karaokeLane.innerHTML = "";
    kEls = [];

    kWords = Array.isArray(words) ? words : [];
    kDur = getKaraokeDuration(kWords);

    for (let i = 0; i < kWords.length; i++) {
      const w = kWords[i];

      const el = document.createElement("button");
      el.type = "button";
      el.className = "spbKWord";
      el.textContent = w.word;
      el.title = `${w.word} • ${w.start.toFixed(2)}s → ${w.end.toFixed(2)}s`;

      if (typeof w.acc === "number") {
        if (w.acc < 60) el.classList.add("is-bad");
        if (w.acc >= 90) el.classList.add("is-great");
      }

      el.style.setProperty("--p", "0");

      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // keep play state; just move time
        seekTo((w.start || 0) + 0.001);
      });

      ui.karaokeLane.appendChild(el);
      kEls.push(el);
    }

    layoutKaraoke();
    updateKaraokeAt(audio.currentTime || 0);
  }

  function layoutKaraoke() {
    if (!ui.karaokeLaneWrap || !ui.karaokeLane) return;
    if (!kWords.length || !kEls.length) return;

    const wrap = ui.karaokeLaneWrap;
    const lane = ui.karaokeLane;

    const W = wrap.clientWidth - 16; // inset padding
    if (W <= 10) return;

    const dur = kDur || audio.duration || 0;
    if (!dur) return;

    const ROW_H = 26;
    const GAP = 8;
    const MAX_LINES = 3;

    const lineEnds = new Array(MAX_LINES).fill(0);
    let maxLine = 0;

    for (let i = 0; i < kWords.length; i++) {
      const w = kWords[i];
      const el = kEls[i];
      if (!el) continue;

      const startP = clamp01(w.start / dur);
      const endP = clamp01(w.end / dur);

      let x = startP * W;
      let ww = Math.max(28, (endP - startP) * W); // min width

      // pick a line that doesn't overlap
      let line = 0;
      while (line < MAX_LINES && x < (lineEnds[line] + GAP)) line++;
      if (line >= MAX_LINES) line = MAX_LINES - 1;

      lineEnds[line] = x + ww;
      maxLine = Math.max(maxLine, line);

      el.style.left = `${8 + x}px`;
      el.style.top = `${8 + line * ROW_H}px`;
      el.style.width = `${ww}px`;
    }

    kLinesUsed = maxLine + 1;
    wrap.style.height = `${Math.max(76, 16 + kLinesUsed * ROW_H)}px`;
  }

  function updateKaraokeAt(t) {
    if (!ui.karaokeCursor || !kWords.length || !kEls.length) return;

    const dur = kDur || audio.duration || 0;
    if (!dur) return;

    // cursor
    const pct = clamp01(t / dur) * 100;
    ui.karaokeCursor.style.left = `${pct}%`;

    // word fill + active
    let active = -1;

    for (let i = 0; i < kWords.length; i++) {
      const w = kWords[i];
      const el = kEls[i];
      if (!el) continue;

      const span = Math.max(0.001, w.end - w.start);
      const p = clamp01((t - w.start) / span);
      el.style.setProperty("--p", String(p));

      if (t >= w.start && t < w.end) active = i;
    }

    for (let i = 0; i < kEls.length; i++) {
      const el = kEls[i];
      if (!el) continue;

      el.classList.toggle("is-active", i === active);
      el.classList.toggle("is-past", active !== -1 && i < active);
      el.classList.toggle("is-future", active !== -1 && i > active);
    }
  }

  // click lane (empty space) to jump
  ui.karaokeLaneWrap?.addEventListener("click", (e) => {
    if (!isExpandedOpen()) return;
    const dur = kDur || audio.duration || 0;
    if (!dur) return;

    const r = ui.karaokeLaneWrap.getBoundingClientRect();
    const p = clamp01((e.clientX - r.left) / Math.max(1, r.width));
    seekTo(p * dur);
  });

  // refresh on expanded open
  window.addEventListener("lux:selfpbExpandedOpen", () => {
    const words = window.LuxLastWordTimings || [];
    renderKaraoke(words);
  });

  // refresh when a new assessment comes in (even if expanded is already open)
  window.addEventListener("lux:lastAssessment", (e) => {
    const words = e?.detail?.timings || window.LuxLastWordTimings || [];
    if (isExpandedOpen()) renderKaraoke(words);
  });

  // keep layout stable on resize
  window.addEventListener("resize", () => {
    if (!isExpandedOpen()) return;
    layoutKaraoke();
  });

  function update(t) {
    if (!isExpandedOpen()) return;
    updateKaraokeAt(t);
  }

  return { update, updateKaraokeAt, renderKaraoke };
}
