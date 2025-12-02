// features/features/self-playback-lite.js
// Self-Playback v2: scrubber, jump ±5s, speed persist, A–B loop, shortcuts.
// Controls the existing <audio id="playbackAudio"> so it stays in sync with your blue Play button.
// Now with: setReference({ url|audioEl, meta }), setRefRate(v), setLearnerArrayBuffer(arrBuf)
// ensure we never double-mount or double-tick
if (window.LuxSelfPB?.__mounted) {
  console.warn("[self-pb] already mounted, aborting second mount");
  throw new Error("self-pb double mount");
}
window.LuxSelfPB = Object.assign(window.LuxSelfPB || {}, { __mounted: true });

// when you start a ticker:
let _raf;
function startTicker() {
  cancelAnimationFrame(_raf);
  const tick = () => {
    // update the mm:ss labels here…
    _raf = requestAnimationFrame(tick);
  };
  _raf = requestAnimationFrame(tick);
}

export function mountSelfPlaybackLite() {
  if (window.__selfPBMounted) return;
  window.__selfPBMounted = true;

  // --- Learner audio element (reuse or create hidden) ---
  let audio = document.getElementById("playbackAudio");
  if (!audio) {
    audio = document.createElement("audio");
    audio.id = "playbackAudio";
    audio.hidden = true;
    document.body.appendChild(audio);
  }

  // --- Hidden Reference audio (from TTS) ---
  const refAudio = new Audio();
  refAudio.preload = "auto";
  let refMeta = null;

  // --- Styles ---
  const STYLE_ID = "selfpb-lite-style";
  if (!document.getElementById(STYLE_ID)) {
    const s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = `
      #selfpb-lite{position:fixed;top:12px;left:12px;z-index:9999;background:#101219;color:#e9ecf1;border:1px solid #2a2f3b;border-radius:14px;padding:10px 12px;font:600 14px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.25)}
      #selfpb-lite .row{display:flex;align-items:center;gap:8px}
      #selfpb-lite .btn{padding:6px 10px;border-radius:8px;border:0;background:#2d6cdf;color:#fff;cursor:pointer}
      #selfpb-lite .btn[disabled]{opacity:.5;cursor:not-allowed}
      #selfpb-lite .pill{background:#1b2230;border:1px solid #2a2f3b;border-radius:999px;padding:6px 10px}
      #selfpb-lite .meta{opacity:.85}
      #selfpb-lite input[type="range"]{accent-color:#2d6cdf}
      #selfpb-lite .ab{display:flex;gap:6px}
      #selfpb-lite .tiny{font-weight:700;opacity:.8}
      #selfpb-lite .scrub{flex:1;min-width:180px}
      #selfpb-lite .spacer{flex:1}
    `;
    document.head.appendChild(s);
  }

  // --- UI ---
  const host = document.createElement("div");
  host.id = "selfpb-lite";
  host.innerHTML = `
    <div class="row" style="margin-bottom:6px">
      <span class="meta">👂 Self Playback</span>
      <div class="spacer"></div>
      <span class="pill tiny" id="spb-ref">Ref: —</span>
      <span class="pill tiny" id="spb-time">0:00 / 0:00</span>
    </div>

    <div class="row" style="margin-bottom:6px">
      <button class="btn" id="spb-back">−5s</button>
      <input id="spb-scrub" class="scrub" type="range" min="0" max="1000" step="1" value="0" title="Seek">
      <button class="btn" id="spb-fwd">+5s</button>
    </div>

    <div class="row" style="margin-bottom:8px">
      <button class="btn" id="spb-play">Play</button>
      <button class="btn" id="spb-pause">Pause</button>

      <div class="pill" title="Playback speed">
        <span class="tiny">Speed</span>
        <input id="spb-rate" type="range" min="0.5" max="1.5" step="0.05" value="1" style="vertical-align:middle;width:120px;margin-left:8px">
        <span class="tiny" id="spb-rate-val">1.00×</span>
      </div>
    </div>

    <div class="row">
      <div class="pill ab" title="Mark loop region">
        <button class="btn" id="spb-mark-a" title="I">A</button>
        <button class="btn" id="spb-mark-b" title="O">B</button>
        <button class="btn" id="spb-loop" title="L">Loop ▢</button>
        <button class="btn" id="spb-clear">Clear</button>
        <span class="tiny" id="spb-ab-label" style="margin-left:4px">A:—  B:—</span>
      </div>
    </div>
  `;
  document.body.appendChild(host);

  // Controls
  const playBtn = host.querySelector("#spb-play");
  const pauseBtn = host.querySelector("#spb-pause");
  const backBtn = host.querySelector("#spb-back");
  const fwdBtn = host.querySelector("#spb-fwd");
  const scrub = host.querySelector("#spb-scrub");
  const rate = host.querySelector("#spb-rate");
  const rateVal = host.querySelector("#spb-rate-val");
  const timeLab = host.querySelector("#spb-time");
  const markA = host.querySelector("#spb-mark-a");
  const markB = host.querySelector("#spb-mark-b");
  const loopBtn = host.querySelector("#spb-loop");
  const clearBtn = host.querySelector("#spb-clear");
  const abLabel = host.querySelector("#spb-ab-label");
  const refLabel = host.querySelector("#spb-ref");

  // --- State ---
  const LS_RATE = "selfpb_rate_v1";
  const st = {
    a: null,
    b: null,
    looping: false,
    playing: false,
    scrubbing: false,
  };

  // --- Helpers ---
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const fmt = (t) => {
    if (!isFinite(t) || t < 0) t = 0;
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  function syncTime() {
    const cur = fmt(audio.currentTime || 0);
    const dur = fmt(audio.duration || 0);
    timeLab.textContent = `${cur} / ${dur}`;
  }

  function syncScrub() {
    if (st.scrubbing) return;
    const dur = audio.duration || 0;
    const cur = audio.currentTime || 0;
    const p = dur ? Math.floor((cur / dur) * 1000) : 0;
    scrub.value = String(clamp(p, 0, 1000));
  }

  function syncRateUI() {
    rateVal.textContent = `${Number(audio.playbackRate).toFixed(2)}×`;
    rate.value = String(audio.playbackRate || 1);
  }

  function syncRefUI() {
    const ready = !!refAudio.src;
    const r = refAudio.playbackRate || 1;
    const d = isFinite(refAudio.duration) ? fmt(refAudio.duration) : "—:—";
    const v =
      refMeta && (refMeta.voice || refMeta.style)
        ? ` ${refMeta.voice || ""}`
        : "";
    refLabel.textContent = ready
      ? `Ref: ${r.toFixed(2)}× · ${d}${v}`
      : "Ref: —";
  }

  function syncButtons() {
    playBtn.disabled = st.playing;
    pauseBtn.disabled = !st.playing;
    loopBtn.textContent = st.looping ? "Loop ■" : "Loop ▢";
    abLabel.textContent = `A:${st.a == null ? "—" : fmt(st.a)}  B:${
      st.b == null ? "—" : fmt(st.b)
    }`;
  }

  function insideLoopWindow(t) {
    if (!st.looping) return false;
    if (st.a == null || st.b == null) return false;
    if (st.b <= st.a) return false;
    return t >= st.a && t <= st.b;
  }

  // --- Controls logic ---
  playBtn.addEventListener("click", async () => {
    try {
      if (st.looping && st.a != null && st.b != null && st.b > st.a) {
        if (!insideLoopWindow(audio.currentTime)) audio.currentTime = st.a;
      }
      st.playing = true;
      syncButtons();
      await audio.play();
    } catch (err) {
      if (err && String(err.name) !== "AbortError")
        console.warn("[selfpb] play() error", err);
      st.playing = !audio.paused;
      syncButtons();
    }
  });

  pauseBtn.addEventListener("click", () => {
    try {
      audio.pause();
    } catch {}
    st.playing = false;
    syncButtons();
  });

  backBtn.addEventListener("click", () => {
    audio.currentTime = clamp(
      (audio.currentTime || 0) - 5,
      0,
      audio.duration || 0
    );
    syncTime();
    syncScrub();
  });

  fwdBtn.addEventListener("click", () => {
    const dur = audio.duration || 0;
    audio.currentTime = clamp((audio.currentTime || 0) + 5, 0, dur);
    syncTime();
    syncScrub();
  });

  // Scrubbing
  scrub.addEventListener("input", () => {
    st.scrubbing = true;
    const p = Number(scrub.value) / 1000;
    const dur = audio.duration || 0;
    audio.currentTime = clamp(p * dur, 0, dur);
    syncTime();
  });
  scrub.addEventListener("change", () => {
    st.scrubbing = false;
  });

  // Speed (persist)
  const savedRate = Number(localStorage.getItem(LS_RATE) || "1") || 1;
  audio.playbackRate = clamp(savedRate, 0.5, 1.5);
  syncRateUI();

  rate.addEventListener("input", () => {
    const v = clamp(Number(rate.value) || 1, 0.5, 1.5);
    audio.playbackRate = v;
    localStorage.setItem(LS_RATE, String(v));
    syncRateUI();
  });

  // A–B loop
  markA.addEventListener("click", () => {
    st.a = audio.currentTime || 0;
    syncButtons();
  });
  markB.addEventListener("click", () => {
    st.b = audio.currentTime || 0;
    syncButtons();
  });
  clearBtn.addEventListener("click", () => {
    st.a = st.b = null;
    st.looping = false;
    syncButtons();
  });
  loopBtn.addEventListener("click", () => {
    st.looping = !st.looping;
    syncButtons();
  });

  // --- Audio events ---
  audio.addEventListener("timeupdate", () => {
    if (st.looping && st.a != null && st.b != null && st.b > st.a) {
      if (audio.currentTime >= st.b) {
        audio.currentTime = Math.max(st.a, st.a + 0.01);
        if (audio.paused) audio.play().catch(() => {});
      }
    }
    syncTime();
    syncScrub();
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
  audio.addEventListener("ratechange", () => {
    syncRateUI();
  });

  // Keep ref pill updated when TTS metadata arrives
  refAudio.addEventListener("loadedmetadata", syncRefUI);
  refAudio.addEventListener("ratechange", syncRefUI);

  // --- Shortcuts (only when not typing) ---
  function isTypingTarget(el) {
    const t = el && el.tagName ? el.tagName.toLowerCase() : "";
    return t === "input" || t === "textarea" || el?.isContentEditable;
  }
  window.addEventListener(
    "keydown",
    (e) => {
      if (isTypingTarget(document.activeElement)) return;
      if (e.code === "Space") {
        e.preventDefault();
        audio.paused ? playBtn.click() : pauseBtn.click();
      } else if (e.key === ",") {
        e.preventDefault();
        backBtn.click();
      } else if (e.key === ".") {
        e.preventDefault();
        fwdBtn.click();
      } else if (e.key === "[") {
        e.preventDefault();
        audio.playbackRate = clamp((audio.playbackRate || 1) - 0.05, 0.5, 1.5);
        rate.value = String(audio.playbackRate);
        localStorage.setItem(LS_RATE, String(audio.playbackRate));
        syncRateUI();
      } else if (e.key === "]") {
        e.preventDefault();
        audio.playbackRate = clamp((audio.playbackRate || 1) + 0.05, 0.5, 1.5);
        rate.value = String(audio.playbackRate);
        localStorage.setItem(LS_RATE, String(audio.playbackRate));
        syncRateUI();
      } else if (e.key.toLowerCase() === "l") {
        e.preventDefault();
        loopBtn.click();
      } else if (e.key.toLowerCase() === "i") {
        e.preventDefault();
        markA.click();
      } else if (e.key.toLowerCase() === "o") {
        e.preventDefault();
        markB.click();
      }
    },
    { passive: false }
  );

  // --- Initial sync & API ---
  function initialSync() {
    syncTime();
    syncScrub();
    syncButtons();
    syncRefUI();
  }
  initialSync();

  // Public API (used by tts-player + recorder hydrator)
  window.LuxSelfPB = Object.assign(window.LuxSelfPB || {}, {
    setAB(a, b) {
      st.a = a;
      st.b = b;
      syncButtons();
    },
    clearAB() {
      st.a = st.b = null;
      st.looping = false;
      syncButtons();
    },
    setRate(v) {
      audio.playbackRate = clamp(v, 0.5, 1.5);
      localStorage.setItem(LS_RATE, String(audio.playbackRate));
      syncRateUI();
    },
    // NEW: keep TTS reference rate in sync
    setRefRate(v) {
      refAudio.playbackRate = clamp(Number(v) || 1, 0.5, 1.5);
      syncRefUI();
      if (window.LuxSelfPB_REF)
        window.LuxSelfPB_REF.playbackRate = refAudio.playbackRate;
    },
    // NEW: accept a fresh TTS reference clip (URL or audioEl) + optional meta
    setReference({ url, audioEl, meta } = {}) {
      try {
        if (audioEl instanceof HTMLAudioElement) {
          // mirror same buffer/element if provided
          refAudio.srcObject = null;
          refAudio.src = audioEl.src || "";
          refAudio.playbackRate = audioEl.playbackRate || 1;
        } else if (typeof url === "string" && url) {
          refAudio.srcObject = null;
          refAudio.src = url;
        }
        refMeta = meta || null;
        syncRefUI();
        window.LuxSelfPB_REF = {
          url: refAudio.src || null,
          meta: refMeta,
          playbackRate: refAudio.playbackRate || 1,
        };
      } catch (e) {
        console.warn("[selfpb] setReference failed:", e);
      }
    },
    // NEW: allow hydration of learner recording from an ArrayBuffer
    async setLearnerArrayBuffer(arrBuf) {
      try {
        const blob = new Blob([arrBuf], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        audio.src = url;
        await audio.load?.();
        syncTime();
        syncScrub();
      } catch (e) {
        console.warn("[selfpb] setLearnerArrayBuffer failed:", e);
      }
    },
    play() {
      playBtn.click();
    },
    pause() {
      pauseBtn.click();
    },
    el: host,
  });
}
