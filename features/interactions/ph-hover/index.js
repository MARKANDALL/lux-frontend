// features/interactions/ph-hover/index.js
// Public entrypoint for the phoneme hover system.
// Holds shared state + wires DOM/events/rendering together.
//
// Golden rule: this file coordinates the system, but delegates actual work
// to small modules.

import { ensureGlobalTooltip } from "./dom.js";
import { installChipEvents } from "./chip-events.js";
import { installHeaderPreview } from "./header-preview.js";
import { showTooltip } from "./tooltip-render.js";
import { initTooltipTextCarousel } from "./tooltip-carousel.js";
import { initTooltipVideoControls } from "./tooltip-video.js";
import { openVideoFocusModal } from "./tooltip-modal.js";
import { scheduleHide, bindOutsideCloseOnce } from "./dom.js";

// Shared singleton state
const state = {
  globalTooltip: null,
  tooltipContent: null, // inner container so we don't wipe styles
  currentChip: null,
  hideTimeout: null,
  isInitialized: false,

  // Header preview state (persist across hover show/hide)
  headerAudioOn: false,

  // Pinned tooltip (mobile tap behavior / desktop click pin)
  tooltipPinned: false,
  outsideCloseBound: false,

  // filled after init so chip-events can call it safely
  hideTooltip: null,
};

export function setupPhonemeHover() {
  if (state.isInitialized) {
    console.warn("[LUX] Phoneme Hover System already active. Skipping re-init.");
    return;
  }

  // Create tooltip DOM + CSS once
  ensureGlobalTooltip(state, {
    scheduleHide: () => scheduleHide(state, () => hideTooltip(state)),
  });

  // Provide hideTooltip onto shared state for other modules
  state.hideTooltip = hideTooltip;

  // Row chips wiring (hover + capture click trap door)
  installChipEvents(state, {
    showTooltip: (chip, opts) =>
      showTooltip(state, chip, opts, {
        initTooltipTextCarousel,
        initTooltipVideoControls,
        openVideoFocusModal,
        hideTooltip,
      }),

    handleChipClick,
    scheduleHide: () => scheduleHide(state, () => hideTooltip(state)),
    bindOutsideCloseOnce,
  });

  // Header preview wiring (pill hover preview)
  installHeaderPreview(state);

  state.isInitialized = true;
  console.log("[LUX] Phoneme Hover System Active (Robust Mode)");
}

/* ====================== Core Actions ====================== */

function handleChipClick(chip) {
  // Click pins open (mobile-friendly). Nothing autoplays.
  showTooltip(state, chip, { pinned: true }, {
    initTooltipTextCarousel,
    initTooltipVideoControls,
    openVideoFocusModal,
    hideTooltip,
  });

  chip.classList.add("lux-playing-lock");
}

function hideTooltip(s = state) {
  s.tooltipPinned = false;

  if (s.globalTooltip) {
    s.globalTooltip.style.opacity = "0";
    s.globalTooltip.style.visibility = "hidden";

    const vids = [...s.globalTooltip.querySelectorAll("video")];
    for (const v of vids) {
      try {
        v.pause();
      } catch (_) {}
      try {
        v.currentTime = 0;
      } catch (_) {}
    }
  }

  if (s.currentChip) s.currentChip.classList.remove("lux-playing-lock");
  s.currentChip = null;
}
