// features/features/selfpb/ui.js
// FINAL PIVOT: Using WaveSurfer.js for reliable waveforms.

import { initSelfPBCore } from "./core.js";
import { initWaveSurfer } from "./waveform-logic.js";
import { ensureStyles } from "./styles.js";
import { buildUI } from "./dom.js";
import { initLatestDownload } from "./download-latest.js";
import { makeUISync } from "./ui-sync.js";

export function mountSelfPlaybackLite() {
  const { api, audio, refAudio, st } = initSelfPBCore();

  ensureStyles();
  const ui = buildUI();

  // Initialize WaveSurfer
  initWaveSurfer({
    learnerContainer: ui.waveLearner,
    refContainer: ui.waveRef,
    masterAudio: audio,
  });

  initLatestDownload(ui);

  const {
    showToast,
    showLoopHint,
    syncButtons,
    syncTime,
    syncScrub,
    syncRateUI,
    syncRefUI,
  } = makeUISync({ ui, api, audio, refAudio, st });

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

  let kCenterEls = [];
  let _centerActiveIdx = -1;

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

  function renderKaraokeCenter(words) {
    if (!ui.kCenterTrack) return;

    ui.kCenterTrack.innerHTML = "";
    kCenterEls = [];

    for (let i = 0; i < words.length; i++) {
      const w = words[i];

      const el = document.createElement("span");
      el.className = "spbKCWord";
      el.textContent = w.word;

      if (typeof w.acc === "number" && w.acc < 60) el.classList.add("is-bad");

      el.style.setProperty("--p", "0");

      el.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        seekTo((w.start || 0) + 0.001);
      });

      ui.kCenterTrack.appendChild(el);
      kCenterEls.push(el);
    }

    // center at current time initially
    _centerActiveIdx = -1;
    updateKaraokeCenterAt(audio.currentTime || 0);
  }

  function centerToWord(idx) {
    if (!ui.kCenterWrap || !ui.kCenterTrack) return;
    const el = kCenterEls[idx];
    if (!el) return;

    const wrapW = ui.kCenterWrap.clientWidth;
    const trackW = ui.kCenterTrack.scrollWidth;

    if (trackW <= wrapW) {
      // center whole track if short
      const mid = (wrapW - trackW) / 2;
      ui.kCenterTrack.style.transform = `translateX(${mid}px)`;
      return;
    }

    const wordCenter = el.offsetLeft + el.offsetWidth / 2;
    let target = wrapW / 2 - wordCenter;

    const min = wrapW - trackW; // most negative
    const max = 0;

    if (target < min) target = min;
    if (target > max) target = max;

    ui.kCenterTrack.style.transform = `translateX(${target}px)`;
  }

  function updateKaraokeCenterAt(t) {
    if (!kWords.length || !kCenterEls.length) return;

    let activeIdx = -1;

    for (let i = 0; i < kWords.length; i++) {
      const w = kWords[i];
      const el = kCenterEls[i];
      if (!el) continue;

      const span = Math.max(0.001, w.end - w.start);
      const p = clamp01((t - w.start) / span);
      el.style.setProperty("--p", String(p));

      if (t >= w.start && t < w.end) activeIdx = i;
    }

    for (let i = 0; i < kCenterEls.length; i++) {
      const el = kCenterEls[i];
      el.classList.toggle("is-active", i === activeIdx);
      el.classList.toggle("is-past", activeIdx !== -1 && i < activeIdx);
      el.classList.toggle("is-future", activeIdx !== -1 && i > activeIdx);
    }

    // smooth auto-center only when active word changes
    if (activeIdx !== -1 && activeIdx !== _centerActiveIdx) {
      _centerActiveIdx = activeIdx;
      centerToWord(activeIdx);
    }
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
    renderKaraokeCenter(kWords);
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
      kEls[i].classList.toggle("is-active", i === active);
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

    if (isExpandedOpen() && _centerActiveIdx !== -1) centerToWord(_centerActiveIdx);
  });

  const handlePlayAction = async (isRestart = false) => {
    if (!audio.currentSrc && !audio.src) {
      showToast("No recording yet!");
      return;
    }
    if (audio.duration === 0 || isNaN(audio.duration)) {
      showToast("Audio empty/loading...");
      return;
    }

    try {
      if (isRestart) {
        audio.currentTime = st.looping && st.a != null ? st.a : 0;
        if (!st.playing) await api.play();
      } else {
        if (st.playing) {
          api.pause();
        } else {
          if (st.looping && st.a != null && st.b != null && st.b > st.a) {
            if (audio.currentTime < st.a || audio.currentTime > st.b)
              audio.currentTime = st.a;
          }
          await api.play();
        }
      }
    } catch (err) {
      console.warn("[selfpb] Play failed", err);
      showToast("Playback failed");
    } finally {
      syncButtons();
    }
  };

  const handleLoopClick = () => {
    if (!audio.duration) {
      showToast("No audio to loop!");
      return;
    }

    if (st.a == null) {
      st.a = audio.currentTime || 0;
      st.looping = false;
      showLoopHint();
    } else if (st.b == null) {
      st.b = audio.currentTime || 0;
      if (st.b < st.a) {
        const t = st.a;
        st.a = st.b;
        st.b = t;
      }
      st.looping = true;
      audio.currentTime = st.a;
      if (!st.playing) api.play();
    } else {
      api.clearAB();
    }

    syncButtons();
  };

  ui.mainBtn.addEventListener("click", (e) => {
    if (e.detail !== 2) handlePlayAction(false);
  });

  ui.mainBtn.addEventListener("dblclick", (e) => {
    e.preventDefault();
    handlePlayAction(true);
  });

  // 2.0 seconds skip
  ui.backBtn.addEventListener("click", () => {
    audio.currentTime = api.clamp(
      (audio.currentTime || 0) - 2.0,
      0,
      audio.duration || 0
    );
    syncTime();
    syncScrub();
  });

  ui.fwdBtn.addEventListener("click", () => {
    audio.currentTime = api.clamp(
      (audio.currentTime || 0) + 2.0,
      0,
      audio.duration || 0
    );
    syncTime();
    syncScrub();
  });

  // ✅ If user grabs scrubber while playing -> PAUSE (pro behavior)
  ui.scrub.addEventListener("pointerdown", () => {
    if (!audio.paused) {
      audio.pause();
    }
  });

  ui.scrub.addEventListener("input", () => {
    api._setScrubbingOn();
    const p = Number(ui.scrub.value) / 1000;
    audio.currentTime = api.clamp(p * (audio.duration || 0), 0, audio.duration || 0);
    syncTime();

    if (isExpandedOpen()) updateKaraokeAt(audio.currentTime || 0);
    if (isExpandedOpen()) updateKaraokeCenterAt(audio.currentTime || 0);
  });

  ui.scrub.addEventListener("change", () => api._setScrubbingOff());

  ui.rate.addEventListener("input", () => {
    const v = api.clamp(Number(ui.rate.value) || 1, 0.5, 1.5);
    api.setRate(v);
    syncRateUI();
  });

  ui.loopAction.addEventListener("click", handleLoopClick);

  audio.addEventListener("timeupdate", () => {
    syncTime();
    syncScrub();
    if (isExpandedOpen()) updateKaraokeAt(audio.currentTime || 0);
    if (isExpandedOpen()) updateKaraokeCenterAt(audio.currentTime || 0);
  });
  audio.addEventListener("play", () => {
    st.playing = true;
    syncButtons();
  });
  audio.addEventListener("pause", () => {
    st.playing = false;
    syncButtons();
  });
  audio.addEventListener("loadedmetadata", () => {
    syncTime();
    syncScrub();
  });
  audio.addEventListener("ratechange", syncRateUI);
  audio.addEventListener("ended", () => {
    st.playing = false;
    syncButtons();
  });

  refAudio.addEventListener("loadedmetadata", syncRefUI);
  refAudio.addEventListener("ratechange", syncRefUI);

  // Shortcuts logic (unchanged)
  window.addEventListener(
    "keydown",
    (e) => {
      if (
        e.target.tagName === "INPUT" ||
        e.target.tagName === "TEXTAREA" ||
        e.target.isContentEditable
      )
        return;

      if (e.code === "Space") {
        e.preventDefault();
        ui.mainBtn.click();
      } else if (e.key === ",") {
        e.preventDefault();
        ui.backBtn.click();
      } else if (e.key === ".") {
        e.preventDefault();
        ui.fwdBtn.click();
      } else if (e.key === "[") {
        e.preventDefault();
        api.setRate(api.clamp((audio.playbackRate || 1) - 0.05, 0.5, 1.5));
        syncRateUI();
      } else if (e.key === "]") {
        e.preventDefault();
        api.setRate(api.clamp((audio.playbackRate || 1) + 0.05, 0.5, 1.5));
        syncRateUI();
      } else if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        ui.loopAction.click();
      }
    },
    { passive: false }
  );

  initialSync();
  window.LuxSelfPB = Object.assign(window.LuxSelfPB || {}, { el: ui.host });
  console.info("[self-pb] WaveSurfer UI Mounted");

  function initialSync() {
    syncTime();
    syncScrub();
    syncButtons();
    syncRefUI();
  }
}

export { mountSelfPlaybackLite as default };
