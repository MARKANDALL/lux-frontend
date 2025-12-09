// ui/interactions/index.js
import { safePlay, playWithGesture, prepareVideo } from "./utils.js";
import { installLegendCueStyles } from "./cue-styles.js";
import { initScoreErrorCollapse } from "./score-collapse.js";
import { initProsodyLegendToggle } from "./legend-toggle.js";
import { setupYGHover } from "./yg-hover.js";
import { setupPhonemeHover } from "./ph-hover.js"; // ← portal-capable
import { initPhonemeAudio } from "./ph-audio.js";
import { initPhonemeChipBehavior } from "./ph-chips.js";
import { animateMetricTips } from "./tips.js";
import { showClickHint, keepTooltipInView } from "./helpers.js";
import { bootInteractions } from "./boot.js";

// Re-attach legacy globals (no fallback for setupPhonemeHover)
globalThis.initScoreErrorCollapse =
  globalThis.initScoreErrorCollapse || initScoreErrorCollapse;
globalThis.initProsodyLegendToggle =
  globalThis.initProsodyLegendToggle || initProsodyLegendToggle;
globalThis.animateMetricTips =
  globalThis.animateMetricTips || animateMetricTips;
globalThis.setupYGHover = globalThis.setupYGHover || setupYGHover;

// Always prefer the portal-capable version
globalThis.setupPhonemeHover = setupPhonemeHover;

globalThis.initPhonemeAudio = globalThis.initPhonemeAudio || initPhonemeAudio;
globalThis.initPhonemeChipBehavior =
  globalThis.initPhonemeChipBehavior || initPhonemeChipBehavior;
globalThis.showClickHint = globalThis.showClickHint || showClickHint;
globalThis.keepTooltipInView =
  globalThis.keepTooltipInView || keepTooltipInView;

// Utils
globalThis.safePlay = globalThis.safePlay || safePlay;
globalThis.playWithGesture = globalThis.playWithGesture || playWithGesture;
globalThis.prepareVideo = globalThis.prepareVideo || prepareVideo;

// Optional: expose style injector
globalThis.installLegendCueStyles =
  globalThis.installLegendCueStyles || installLegendCueStyles;

// Auto-boot same as old file did
bootInteractions();

// Named exports
export {
  safePlay,
  playWithGesture,
  prepareVideo,
  installLegendCueStyles,
  initScoreErrorCollapse,
  initProsodyLegendToggle,
  setupYGHover,
  setupPhonemeHover,
  initPhonemeAudio,
  initPhonemeChipBehavior,
  animateMetricTips,
  showClickHint,
  keepTooltipInView,
  bootInteractions,
};
