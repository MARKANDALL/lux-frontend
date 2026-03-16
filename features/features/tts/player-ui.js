// features/features/tts/player-ui.js
// Logic: Event wiring, audio state management, and API orchestration.
// UPDATED: simplified Waveform handoff (passes Blob directly to WaveSurfer).

import { luxBus } from '../../../app-core/lux-bus.js';

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
  populateStyles,
} from "./player-dom.js";

// NEW IMPORT: simplified blob loader
import { loadReferenceBlob } from "../selfpb/waveform-logic.js";

import { wireTtsProgress } from "./player-ui/progress.js";

import {
  buildWordTimings,
  buildWordTimingsFromBoundaries,
  publishKaraoke,
} from "./player-ui/karaoke.js";

const isPlaying = (audio) =>
  !audio.paused && !audio.ended && audio.currentTime > 0;

function normalizeSourceMode(mode) {
  const m = String(mode || "").trim().toLowerCase();
  return m === "ai" || m === "me" || m === "selection" ? m : "me";
}

function getTtsContext() {
  return luxBus.get("ttsContextApi") || window.LuxTTSContext || null;
}

function getSelfPBApi() {
  return luxBus.get("selfpbApi") || luxBus.get("selfpbApi:core") || null;
}

function isTtsKaraokeActive() {
  return String(luxBus.get("karaoke")?.source || window.LuxKaraokeSource || "") === "tts";
}

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
  const sourceSel = $(host, "#tts-source");
  const autoVoiceEl = $(host, "#tts-autovoice");
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

  // Expand: always open the shared expanded modal (even if SelfPB hasn't been opened yet)
  const expandBtn = $(host, "#tts-expand");
  if (expandBtn && !expandBtn.dataset.luxBound) {
    expandBtn.dataset.luxBound = "1";
    expandBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        luxBus.set('requestSelfPBExpanded', true);
      } catch (err) { globalThis.warnSwallow("features/features/tts/player-ui.js", err, "important"); }
    });
  }

  // Progress fill (safe: only wires if found)
  const progressFill =
    host.querySelector("#tts-progress-fill") ||
    host.querySelector(".tts-progress-fill") ||
    host.querySelector(".tts-progress__fill") ||
    host.querySelector("[data-tts-progress-fill]");

  // 3. Initialize Audio
  const audio = new Audio();
  audio.preload = "auto";
  audio.playbackRate = DEFAULT_SPEED;

  // Apply default source mode (pages like convo can pre-seed via luxBus 'tts')
  const initialMode = normalizeSourceMode(
    luxBus.get('tts')?.sourceMode ||
    getTtsContext()?.defaultSourceMode ||
    "me"
  );
  if (sourceSel) sourceSel.value = initialMode;

  const initialAuto = luxBus.get('tts')?.autoVoice;
  if (autoVoiceEl && typeof initialAuto === "boolean") autoVoiceEl.checked = initialAuto;

  // Expose audio + tts UI state for other panels (like Self Playback sync)
  luxBus.update('tts', {
    audioEl: audio,
    sourceMode: normalizeSourceMode(sourceSel?.value || initialMode),
    autoVoice: autoVoiceEl?.checked !== false,
  });

  function applyVoiceHint(voiceId, caps) {
    if (!voiceId || !voiceSel) return;
    const exists = Array.from(voiceSel.options || []).some((o) => o.value === voiceId);
    if (!exists) return;
    voiceSel.value = voiceId;
    populateStyles(styleSel, caps, voiceSel.value);
  }

  function syncVoiceFromContext(reason, caps) {
    const autoOn = autoVoiceEl ? autoVoiceEl.checked : (luxBus.get('tts')?.autoVoice !== false);
    if (!autoOn) return;
    const ctx = getTtsContext();
    if (!ctx || typeof ctx.getVoiceId !== "function") return;
    const mode = normalizeSourceMode(
      sourceSel?.value || luxBus.get('tts')?.sourceMode || "me"
    );
    const hint = ctx.getVoiceId({ mode });
    applyVoiceHint(hint, caps);
  }

  // Wire progress (always moves while playing)
  // (No-op if progressFill not found)
  const stopProgress = wireTtsProgress(audio, progressFill);

  // Keep SelfPB karaoke cursor synced while TTS plays (no-op if SelfPB isn't mounted)
  const syncSelfPBKaraoke = () => {
    if (!isTtsKaraokeActive()) return;
    getSelfPBApi()?.karaokeUpdate?.();
  };
  audio.addEventListener("timeupdate", syncSelfPBKaraoke);
  audio.addEventListener("play", syncSelfPBKaraoke);

  // 4. Load Capabilities (Async)
  let caps = await getVoiceCaps();
  // In case a page installed a context (e.g. convo), align voice to speaker now.
  syncVoiceFromContext("caps-loaded", caps);
  populateStyles(styleSel, caps, voiceSel.value);

  voiceSel.addEventListener("change", () => {
    // Manual voice change implies “I’m overriding auto”
    if (autoVoiceEl && autoVoiceEl.checked) {
      autoVoiceEl.checked = false;
      luxBus.update('tts', { autoVoice: false });
    }
    populateStyles(styleSel, caps, voiceSel.value);
  });

  if (sourceSel) {
    sourceSel.addEventListener("change", () => {
      const nextMode = normalizeSourceMode(sourceSel.value || "me");
      if (sourceSel.value !== nextMode) sourceSel.value = nextMode;
      luxBus.update('tts', { sourceMode: nextMode });
      syncVoiceFromContext("source-change", caps);
    });
  }

  if (autoVoiceEl) {
    autoVoiceEl.addEventListener("change", () => {
      luxBus.update('tts', { autoVoice: !!autoVoiceEl.checked });
      if (autoVoiceEl.checked) syncVoiceFromContext("autovoice-on", caps);
    });
  }

  luxBus.on('ttsContext', () => syncVoiceFromContext("ctx-event", caps));

  // 5. Wire Inputs
  const updateSpeedOut = () => {
    const v = Number(speedEl.value) || 1;
    speedOut.textContent = v.toFixed(2) + "×";
    audio.playbackRate = v;
    getSelfPBApi()?.setRefRate?.(v);
  };

  const updatePitchOut = () => {
    const p = Number(pitchEl.value) || 0;
    pitchOut.textContent = String(p);
  };

  updateSpeedOut();
  updatePitchOut();

  speedEl.addEventListener("input", updateSpeedOut);
  pitchEl.addEventListener("input", updatePitchOut);

  // 6. Audio Controls (UPDATED to 2 seconds)
  backBtn.addEventListener("click", () => {
    audio.currentTime = Math.max(0, audio.currentTime - 2);
  });

  fwdBtn.addEventListener("click", () => {
    audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + 2);
  });

  // 7. Playback Logic
  function setMainLabel(playing) {
    mainBtn.textContent = playing
      ? "⏸️ Pause (dbl-click = Restart)"
      : "🔊 Play";
  }

  function uiNote(msg, tone = "info") {
    if (!note) return;
    note.textContent = msg || "";
    note.className = `tts-note ${tone === "warn" ? "tts-note--warn" : ""}`;
  }

  let blobUrl = null;
  let lastKey = null;
  let lastBoundaries = null;
  let clickPending = false;
  let dblTriggered = false;

  async function ensureAudioReadyAndPlay() {
    // Right before speaking: re-sync voice to the chosen speaker (AI/Me/etc)
    syncVoiceFromContext("preSpeak", caps);
    const text = getCurrentText();
    if (!text) return alert("Type, select, or click a message bubble first.");

    const voice = voiceSel?.value || VOICES[0].id;
    const speedMult = Number(speedEl.value) || 1;
    const ratePct = Math.round((speedMult - 1) * 100);
    const style = styleSel?.value || "";
    const styledegree = parseFloat(degreeEl?.value || "1");
    const pitchSt = Number(pitchEl.value) || 0;

    const key = `${voice}|${text}|style:${style}|deg:${styledegree}|rate:${ratePct}|pitch:${pitchSt}`;

    // Reuse existing blob if params match
    if (key === lastKey && audio.src) {
      // If key matches last, just replay from start
      audio.currentTime = 0;
      audio.playbackRate = speedMult;
      await audio.play();

      // Optional: push into SelfPB reference track
      const selfpb = getSelfPBApi();
      if (selfpb?.setReference) {
        selfpb.setReference({
          audioEl: audio,
          meta: { voice, style, styledegree, rate: speedMult, ratePct, pitchSt },
        });
      }
      // Karaoke: switch to TTS words + track time on the TTS audio element
      const durNow = audio.duration || 0;
      const wb = Array.isArray(lastBoundaries) ? lastBoundaries : null;
      publishKaraoke(
        "tts",
        wb ? buildWordTimingsFromBoundaries(wb, durNow) : buildWordTimings(text, durNow)
      );

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
        wantWordTimings: true,
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

      // Reset progress UI on new audio (optional but nice)
      if (progressFill) progressFill.style.width = "0%";

      if (blobUrl) URL.revokeObjectURL(blobUrl);
      blobUrl = URL.createObjectURL(blob);
      audio.src = blobUrl;
      audio.playbackRate = speedMult;
      lastKey = key;

      if (dl) {
        dl.href = blobUrl;
        dl.download = "lux_tts.mp3";
      }

      // Karaoke: prefer real word-boundary timings if provided by backend, else fallback
      lastBoundaries = Array.isArray(blob?._wordBoundaries) ? blob._wordBoundaries : null;

      const publishTTSKaraoke = () => {
        const durNow = audio.duration || 0;
        const wb = Array.isArray(lastBoundaries) ? lastBoundaries : null;
        const timingsNow = wb
          ? buildWordTimingsFromBoundaries(wb, durNow)
          : buildWordTimings(text, durNow);
        publishKaraoke("tts", timingsNow);
      };

      if ((audio.duration || 0) > 0) {
        publishTTSKaraoke();
      } else {
        const onMeta = () => {
          audio.removeEventListener("loadedmetadata", onMeta);
          publishTTSKaraoke();
        };
        audio.addEventListener("loadedmetadata", onMeta);
      }

      // --- WAVEFORM HANDOFF (Simplified) ---
      if (blob) {
        loadReferenceBlob(blob);
      }
      // ------------------------------------

      // Sync with Self Playback
      const selfpb = getSelfPBApi();
      if (selfpb?.setReference) {
        selfpb.setReference({
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
      } catch (err) { globalThis.warnSwallow("features/features/tts/player-ui.js", err, "important"); }
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
          } catch (err) { globalThis.warnSwallow("features/features/tts/player-ui.js", err, "important"); }
        }
      }
      clickPending = false;
      dblTriggered = false;
    }, 230);
  });

  audio.addEventListener("ended", () => setMainLabel(false));

  // If Lux ever remounts the player, stop any old RAF loop (defensive)
  // (Right now mount only happens once, but this keeps it safe)
  luxBus.update('tts', { stopProgress });

  // Frozen compat shim — luxBus is the real owner; this is for console debugging only.
  window.luxTTS = luxBus.get('tts');

  console.info("[tts-player] azure controls mounted");
}