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
import { attachLearnerBlobToAudio } from "./attach-learner-blob.js";
import { luxBus } from "../../../app-core/lux-bus.js";

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
    attachLearnerBlobToAudio({ audioEl, blob, loadLearnerBlob });
  }

  // Recorder will call this if present
  window.__attachLearnerBlob = attachLearnerBlob;

  // If we already have a last recording (made before mount), attach it now
  try {
    if (window.LuxLastRecordingBlob) {
      attachLearnerBlob(window.LuxLastRecordingBlob, window.LuxLastRecordingMeta || null);
    }
  } catch (err) { globalThis.warnSwallow("features/features/selfpb/ui.js", err, "important"); }

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

  luxBus.set("selfpbApi", {
    attachLearnerBlob,
    setReference: (...args) => api?.setReference?.(...args),
    setRefRate: (...args) => api?.setRefRate?.(...args),
    karaokeUpdate: (...args) => karaoke?.update?.(...args),
    karaokeRender: (...args) => karaoke?.renderKaraoke?.(...args),
    el: ui.host,
  });

  // Legacy compat mirrors — keep until all cross-feature readers are bus-first
  window.__attachLearnerBlob = attachLearnerBlob;
  window.LuxSelfPB = Object.assign(window.LuxSelfPB || {}, {
    attachLearnerBlob,
    el: ui.host,
    karaokeUpdate: karaoke?.update,
    karaokeRender: karaoke?.renderKaraoke,
  });

  console.info("[self-pb] WaveSurfer UI Mounted");
}

export { mountSelfPlaybackLite as default };