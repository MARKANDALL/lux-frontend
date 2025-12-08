// UI: rendering, event wiring, audio control
import {
  VOICES,
  DEFAULT_SPEED,
  DEFAULT_PITCH_ST,
  getVoiceCaps,
  synthesize,
} from "./player-core.js";

const $ = (root, sel) => root.querySelector(sel);
const isPlaying = (audio) =>
  !audio.paused && !audio.ended && audio.currentTime > 0;

function getCurrentText() {
  const el =
    document.querySelector("#referenceText") ||
    document.querySelector("#free-input") ||
    document.querySelector("#reference-text") ||
    document.querySelector("textarea");
  const typed = el?.value?.trim();
  const sel = window.getSelection()?.toString()?.trim();
  return (typed || sel || "").trim();
}

function renderControls(mount) {
  const voiceOptions = VOICES.map(
    (v) => `<option value="${v.id}">${v.label}</option>`
  ).join("");
  mount.innerHTML = `
      <div id="tts-wrap">
        <div class="tts-box tts-compact">
          <div class="tts-head">
            <div class="tts-title">Text-to-Speech</div>
            <div id="tts-note" class="tts-note" aria-live="polite"></div>
          </div>
  
          <label class="tts-voice"><span>Voice</span>
            <select id="tts-voice">${voiceOptions}</select>
          </label>
  
          <label class="tts-speed"><span>Speed</span>
            <input id="tts-speed" type="range" min="0.7" max="1.3" step="0.05" value="${DEFAULT_SPEED}">
            <span id="tts-speed-out">${DEFAULT_SPEED.toFixed(2)}×</span>
          </label>
  
          <div class="tts-style-row">
            <div class="tts-style-grid">
              <label>Style
                <select id="tts-style"><option value="">(neutral)</option></select>
              </label>
  
              <label>Degree
                <input id="tts-styledegree" type="number" min="0.1" max="2.5" step="0.1" value="1.0"/>
              </label>
            </div>
          </div>
  
          <button id="tts-main" class="tts-btn tts-btn--primary"
            title="Click: play/pause • Double-click: restart & play">🔊 Generate & Play</button>
  
          <label class="tts-pitch">
            <span>Pitch (st)</span>
            <input id="tts-pitch" type="range" min="-12" max="12" step="1" value="${DEFAULT_PITCH_ST}">
            <span id="tts-pitch-out">${DEFAULT_PITCH_ST}</span>
          </label>
  
          <div class="tts-skip">
            <button id="tts-back" class="tts-btn tts-btn--sm" title="Back 5 seconds">↺ 5s</button>
            <button id="tts-fwd"  class="tts-btn tts-btn--sm" title="Forward 5 seconds">↻ 5s</button>
          </div>
  
          <a id="tts-download" class="tts-link" href="#" download="lux_tts.mp3" title="Download last audio">⬇️</a>
        </div>
      </div>
    `;
  const box = mount.querySelector(".tts-compact");
  if (box)
    Object.assign(box.style, {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    });
}

function populateStyles(styleSel, caps, voiceId) {
  if (!styleSel) return;
  const styles = caps?.[voiceId]?.styles || [];
  const keep = styleSel.value;
  styleSel.innerHTML =
    `<option value="">(neutral)</option>` +
    styles.map((s) => `<option value="${s}">${s}</option>`).join("");
  if (keep && styles.includes(keep)) styleSel.value = keep;
}

export async function mountTTSPlayer(hostEl) {
  const host = hostEl || document.getElementById("tts-controls");
  if (!host) return;

  // --- NUCLEAR FIX START ---
  // 1. Kill the guard style tag explicitly
  const guard = document.getElementById("lux-tts-guard-style");
  if (guard) guard.remove();

  // 2. Flip the data attribute
  host.dataset.luxHidden = "0";
  host.removeAttribute("data-luxHidden"); // Double tap

  // 3. Force inline style to override everything (Critical Fix)
  host.style.display = "flex";
  host.style.visibility = "visible";
  host.style.opacity = "1";
  // --- NUCLEAR FIX END ---

  renderControls(host);

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

  const audio = new Audio();
  audio.preload = "auto";
  audio.playbackRate = DEFAULT_SPEED;

  // expose audio for other panels
  window.luxTTS = Object.assign(window.luxTTS || {}, { audioEl: audio });

  // voice capabilities
  let caps = await getVoiceCaps();
  populateStyles(styleSel, caps, voiceSel.value);
  voiceSel.addEventListener("change", () =>
    populateStyles(styleSel, caps, voiceSel.value)
  );

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

  backBtn.addEventListener("click", () => {
    audio.currentTime = Math.max(0, audio.currentTime - 5);
  });
  fwdBtn.addEventListener("click", () => {
    audio.currentTime = Math.min(
      audio.duration || Infinity,
      audio.currentTime + 5
    );
  });

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

    if (key === lastKey && audio.src) {
      if (window.LuxSelfPB?.setReference) {
        window.LuxSelfPB.setReference({
          audioEl: audio,
          meta: {
            voice,
            style,
            styledegree,
            rate: speedMult,
            ratePct,
            pitchSt,
          },
        });
      }
      try {
        await audio.play();
        setMainLabel(true);
      } catch {}
      return;
    }

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
          uiNote(
            `Style '${styleRequested}' unsupported for ${voice}. Playing neutral.`,
            "warn"
          );
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

      if (window.LuxSelfPB?.setReference) {
        window.LuxSelfPB.setReference({
          audioEl: audio,
          meta: {
            voice,
            style,
            styledegree,
            rate: speedMult,
            ratePct,
            pitchSt,
          },
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

export {}; // ESM