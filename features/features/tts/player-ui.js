// features/features/tts/player-ui.js
// Logic: Event wiring, audio state management, and API orchestration.

import {
  VOICES,
  DEFAULT_SPEED,
  getVoiceCaps,
  synthesize,
} from "./player-core.js";

import { 
  $, 
  getCurrentText, 
  renderControls, 
  populateStyles 
} from "./player-dom.js";

const isPlaying = (audio) =>
  !audio.paused && !audio.ended && audio.currentTime > 0;

export async function mountTTSPlayer(hostEl) {
  const host = hostEl || document.getElementById("tts-controls");
  if (!host) return;

  // --- NUCLEAR FIX START (Visibility Guards) ---
  const guard = document.getElementById("lux-tts-guard-style");
  if (guard) guard.remove();

  host.dataset.luxHidden = "0";
  host.removeAttribute("data-luxHidden"); 
  host.style.display = "flex";
  host.style.visibility = "visible";
  host.style.opacity = "1";
  // --- NUCLEAR FIX END ---

  // 1. Render the HTML Template
  renderControls(host);

  // 2. Select Elements
  const voiceSel = $(host, "#tts-voice");
  const speedEl = $(host, "#tts-speed");
  const speedOut = $(host, "#tts-speed-out");
  const mainBtn = $(host, "#tts-main");
  const backBtn = $(host, "#tts-back");
  const fwdBtn = $(host, "#tts-fwd");
  const dl = $(host, "#tts-download");
  const note = $(host, "#tts-note");
  const pitchEl = $(host, "#tts-pitch");
  const pitchOut = $(host, "#tts-pitch-out");
  const styleSel = $(host, "#tts-style");
  const degreeEl = $(host, "#tts-styledegree");

  // 3. Initialize Audio
  const audio = new Audio();
  audio.preload = "auto";
  audio.playbackRate = DEFAULT_SPEED;

  // Expose audio for other panels (like Self Playback sync)
  window.luxTTS = Object.assign(window.luxTTS || {}, { audioEl: audio });

  // 4. Load Capabilities (Async)
  let caps = await getVoiceCaps();
  populateStyles(styleSel, caps, voiceSel.value);
  
  voiceSel.addEventListener("change", () =>
    populateStyles(styleSel, caps, voiceSel.value)
  );

  // 5. Wire Inputs
  const updateSpeedOut = () => {
    const v = Number(speedEl.value) || 1;
    speedOut.textContent = v.toFixed(2) + "×";
    audio.playbackRate = v;
    if (window.LuxSelfPB?.setRefRate) window.LuxSelfPB.setRefRate(v);
  };
  
  const updatePitchOut = () => {
    const p = Number(pitchEl.value) || 0;
    pitchOut.textContent = String(p);
  };

  updateSpeedOut();
  updatePitchOut();
  
  speedEl.addEventListener("input", updateSpeedOut);
  pitchEl.addEventListener("input", updatePitchOut);

  // 6. Audio Controls
  backBtn.addEventListener("click", () => {
    audio.currentTime = Math.max(0, audio.currentTime - 5);
  });
  fwdBtn.addEventListener("click", () => {
    audio.currentTime = Math.min(
      audio.duration || Infinity,
      audio.currentTime + 5
    );
  });

  // 7. Playback Logic
  function setMainLabel(playing) {
    mainBtn.textContent = playing
      ? "⏸️ Pause (dbl-click = Restart)"
      : "🔊 Generate & Play";
  }
  
  function uiNote(msg, tone = "info") {
    if (!note) return;
    note.textContent = msg || "";
    note.className = `tts-note ${tone === "warn" ? "tts-note--warn" : ""}`;
  }

  let blobUrl = null,
    lastKey = null,
    clickPending = false,
    dblTriggered = false;

  async function ensureAudioReadyAndPlay() {
    const text = getCurrentText();
    if (!text) return alert("Type or select some text first.");

    const voice = voiceSel?.value || VOICES[0].id;
    const speedMult = Number(speedEl.value) || 1;
    const ratePct = Math.round((speedMult - 1) * 100);
    const style = styleSel?.value || "";
    const styledegree = parseFloat(degreeEl?.value || "1");
    const pitchSt = Number(pitchEl.value) || 0;

    const key = `${voice}|${text}|style:${style}|deg:${styledegree}|rate:${ratePct}|pitch:${pitchSt}`;

    // Reuse existing blob if params match
    if (key === lastKey && audio.src) {
      if (window.LuxSelfPB?.setReference) {
        window.LuxSelfPB.setReference({
          audioEl: audio,
          meta: { voice, style, styledegree, rate: speedMult, ratePct, pitchSt },
        });
      }
      try {
        await audio.play();
        setMainLabel(true);
      } catch {}
      return;
    }

    // Generate New
    try {
      const blob = await synthesize({
        text,
        voice,
        ratePct,
        pitchSt,
        style,
        styledegree,
      });
      
      if (blob._meta) {
        const { styleUsed, styleRequested, fallback, message } = blob._meta;
        if (message) uiNote(message, fallback ? "warn" : "info");
        else if (fallback)
          uiNote(`Style '${styleRequested}' unsupported. Playing neutral.`, "warn");
        else if (styleUsed && styleUsed !== "neutral")
          uiNote(`Playing ${voice} in '${styleUsed}'.`);
        else uiNote("");
      }

      if (blobUrl) URL.revokeObjectURL(blobUrl);
      blobUrl = URL.createObjectURL(blob);
      audio.src = blobUrl;
      audio.playbackRate = speedMult;
      lastKey = key;
      
      if (dl) {
        dl.href = blobUrl;
        dl.download = "lux_tts.mp3";
      }

      // Sync with Self Playback
      if (window.LuxSelfPB?.setReference) {
        window.LuxSelfPB.setReference({
          audioEl: audio,
          meta: { voice, style, styledegree, rate: speedMult, ratePct, pitchSt },
        });
      }

      await audio.play();
      setMainLabel(true);
    } catch (e) {
      console.error(e);
      uiNote(e.meta?.message || "Synthesis failed.", "warn");
      alert(e.message || "Text-to-speech failed");
    }
  }

  // Double-click to Restart
  mainBtn.addEventListener("dblclick", async (e) => {
    e.preventDefault();
    dblTriggered = true;
    audio.currentTime = 0;
    if (audio.src) {
      try {
        await audio.play();
        setMainLabel(true);
      } catch {}
    } else {
      await ensureAudioReadyAndPlay();
    }
  });

  // Single-click to Toggle
  mainBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (clickPending) return;
    clickPending = true;
    
    setTimeout(async () => {
      if (!dblTriggered) {
        if (!audio.src || audio.ended) await ensureAudioReadyAndPlay();
        else if (isPlaying(audio)) {
          audio.pause();
          setMainLabel(false);
        } else {
          try {
            await audio.play();
            setMainLabel(true);
          } catch {}
        }
      }
      clickPending = false;
      dblTriggered = false;
    }, 230);
  });

  audio.addEventListener("ended", () => setMainLabel(false));

  (window.luxTTS?.nudge || (() => {}))();
  console.info("[tts-player] azure controls mounted");
}