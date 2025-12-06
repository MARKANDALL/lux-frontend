// features/features/selfpb/core.js
// Core: audio engine, AB loop, rate persistence, reference handling, public API

if (window.LuxSelfPB?.__mounted) {
  console.warn("[self-pb] already mounted, aborting second mount");
  throw new Error("self-pb double mount");
}
window.LuxSelfPB = Object.assign(window.LuxSelfPB || {}, { __mounted: true });

const LS_RATE = "selfpb_rate_v1";
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const fmt = (t) => {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

function ensureLearnerAudioEl() {
  let audio = document.getElementById("playbackAudio");
  if (!audio) {
    audio = document.createElement("audio");
    audio.id = "playbackAudio";
    audio.hidden = true;
    document.body.appendChild(audio);
  }
  return audio;
}

export function initSelfPBCore() {
  // learner audio (controls the actual playback used across the app)
  const audio = ensureLearnerAudioEl();

  // reference audio (from TTS)
  const refAudio = new Audio();
  refAudio.preload = "auto";
  let refMeta = null;

  // state
  const st = {
    a: null,
    b: null,
    looping: false,
    playing: false,
    scrubbing: false, // UI toggles this while dragging
  };

  // init rate from storage
  const savedRate = Number(localStorage.getItem(LS_RATE) || "1") || 1;
  audio.playbackRate = clamp(savedRate, 0.5, 1.5);

  // AB loop enforcement on timeupdate
  function onTimeUpdate() {
    if (st.looping && st.a != null && st.b != null && st.b > st.a) {
      if (audio.currentTime >= st.b) {
        audio.currentTime = Math.max(st.a, st.a + 0.01);
        if (audio.paused) audio.play().catch(() => {});
      }
    }
  }
  audio.addEventListener("timeupdate", onTimeUpdate);

  // Public API (DOM-free)
  const api = {
    // UI calls this while dragging → prevents programmatic scrub from fighting slider
    _setScrubbingOn() {
      st.scrubbing = true;
    },
    _setScrubbingOff() {
      st.scrubbing = false;
    },
    getState() {
      return st;
    },
    getAudio() {
      return audio;
    },
    getRefAudio() {
      return refAudio;
    },
    getRefMeta() {
      return refMeta;
    },

    setAB(a, b) {
      st.a = a;
      st.b = b;
    },
    clearAB() {
      st.a = st.b = null;
      st.looping = false;
    },
    setRate(v) {
      audio.playbackRate = clamp(v, 0.5, 1.5);
      localStorage.setItem(LS_RATE, String(audio.playbackRate));
    },
    setRefRate(v) {
      refAudio.playbackRate = clamp(Number(v) || 1, 0.5, 1.5);
      if (window.LuxSelfPB_REF)
        window.LuxSelfPB_REF.playbackRate = refAudio.playbackRate;
    },
    setReference({ url, audioEl, meta } = {}) {
      try {
        if (audioEl instanceof HTMLAudioElement) {
          refAudio.srcObject = null;
          refAudio.src = audioEl.src || "";
          refAudio.playbackRate = audioEl.playbackRate || 1;
        } else if (typeof url === "string" && url) {
          refAudio.srcObject = null;
          refAudio.src = url;
        }
        refMeta = meta || null;
        window.LuxSelfPB_REF = {
          url: refAudio.src || null,
          meta: refMeta,
          playbackRate: refAudio.playbackRate || 1,
        };
      } catch (e) {
        console.warn("[selfpb] setReference failed:", e);
      }
    },
    
    // ✅ CRITICAL FIX: BREAK THE LOOP & FIX MEMORY LEAK
    async setLearnerArrayBuffer(arrBuf) {
      try {
        // 1. Cleanup old memory if we tracked it
        if (window.LuxSelfPB_LastUrl) {
            URL.revokeObjectURL(window.LuxSelfPB_LastUrl);
        }

        // 2. STOP THE LOOP:
        // We do NOT set audio.src here. The main recorder logic (recording.js/index.html) 
        // has already set the source. Setting it again causes the 'loadeddata' event 
        // to fire again, which calls this function again -> Infinite Loop.
        
        console.log("[selfpb] Learner buffer received (Loop guarded).");
        
        // We just ensure the audio is ready to play if needed, 
        // but we trust the existing src.
        if (!audio.src) {
             const blob = new Blob([arrBuf], { type: "audio/mpeg" });
             const url = URL.createObjectURL(blob);
             window.LuxSelfPB_LastUrl = url;
             audio.src = url;
             await audio.load?.();
        }
        
      } catch (e) {
        console.warn("[selfpb] setLearnerArrayBuffer failed:", e);
      }
    },
    
    async play() {
      try {
        await audio.play();
      } catch {}
      st.playing = !audio.paused;
    },
    pause() {
      try {
        audio.pause();
      } catch {}
      st.playing = false;
    },

    // helpers for UI
    fmt,
    clamp,
    persistRate(v) {
      localStorage.setItem(LS_RATE, String(clamp(v, 0.5, 1.5)));
    },
  };

  // expose API (back-compat)
  window.LuxSelfPB = Object.assign(window.LuxSelfPB || {}, api);

  return { api, audio, refAudio, st };
}