// features/features/selfpb/ui.js
// FINAL PIVOT: Using WaveSurfer.js for reliable waveforms.

import { initSelfPBCore } from "./core.js";
import { initWaveSurfer } from "./waveform-logic.js";
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
