// features/features/selfpb/ui.js
// FINAL PIVOT: Using WaveSurfer.js for reliable waveforms.

import { initSelfPBCore } from "./core.js";
import { initWaveSurfer, loadLearnerBlob } from "./waveform-logic.js";
import { ensureStyles } from "./styles.js";
import { buildUI } from "./dom.js";
import { initLatestDownload } from "./download-latest.js";
import { makeUISync } from "./ui-sync.js";
import { initKaraoke } from "./karaoke.js";
import { initControls } from "./controls.js";
import { initMediaEvents } from "./media-events.js";
import { initShortcuts } from "./shortcuts.js";

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

  // Bridge: if the user records BEFORE SelfPB ever mounts, recorder can't attach
  // into playbackAudio / WaveSurfer (because they don't exist yet). Recorder DOES
  // store window.LuxLastRecordingBlob, so we attach it here on mount.
  const audioEl = audio;
  function attachLearnerBlob(blob, meta) {
    if (!blob) return;

    // Revoke our prior object URL (if any) to avoid leaks
    try {
      const prev = audioEl?.dataset?.luxBlobUrl;
      if (prev && String(prev).startsWith("blob:")) URL.revokeObjectURL(prev);
    } catch (_) {}

    try {
      const url = URL.createObjectURL(blob);
      audioEl.dataset.luxBlobUrl = url;
      audioEl.src = url;
      try { audioEl.load?.(); } catch (_) {}
    } catch (_) {}

    // Draw waveform from the blob as well
    try { loadLearnerBlob(blob); } catch (_) {}
  }

  // Recorder will call this if present
  window.__attachLearnerBlob = attachLearnerBlob;

  // If we already have a last recording (made before mount), attach it now
  try {
    if (window.LuxLastRecordingBlob) {
      attachLearnerBlob(window.LuxLastRecordingBlob, window.LuxLastRecordingMeta || null);
    }
  } catch (_) {}

  // Also listen for the event (belt + suspenders)
  if (!window.__luxSelfPBLastRecordingBound) {
    window.__luxSelfPBLastRecordingBound = true;
    window.addEventListener(
      "lux:lastRecording",
      (e) => attachLearnerBlob(e?.detail?.blob, e?.detail?.meta),
      { passive: true }
    );
  }

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

  const karaoke = initKaraoke({ ui, api, audio, syncTime, syncScrub });

  const isExpandedOpen = () => {
    const shade = document.getElementById("spb-modalShade");
    if (shade?.classList?.contains("is-open")) return true;

    const float = document.getElementById("spb-float");
    if (float?.classList?.contains("is-open")) return true;

    return false;
  };

  initControls({
    ui,
    api,
    audio,
    st,
    showToast,
    showLoopHint,
    syncButtons,
    syncTime,
    syncScrub,
    syncRateUI,
    isExpandedOpen,
    karaoke,
  });

  const { initialSync } = initMediaEvents({
    audio,
    refAudio,
    syncTime,
    syncScrub,
    syncButtons,
    syncRefUI,
  });

  initShortcuts({ ui, api, audio, syncRateUI });

  initialSync();
window.LuxSelfPB = Object.assign(window.LuxSelfPB || {}, {
    el: ui.host,
    karaokeUpdate: karaoke?.update,
    karaokeRender: karaoke?.renderKaraoke,
  });  console.info("[self-pb] WaveSurfer UI Mounted");
}

export { mountSelfPlaybackLite as default };
