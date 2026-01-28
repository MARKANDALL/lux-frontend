// features/interactions/ph-hover/dom.behavior.js

// Schedules hide unless tooltip is pinned.
export function scheduleHide(state, hideTooltip) {
  if (state.tooltipPinned) return;

  if (state.hideTimeout) clearTimeout(state.hideTimeout);

  state.hideTimeout = setTimeout(() => {
    try {
      hideTooltip?.();
    } catch (_) {}
  }, 200);
}

// Close if you click/tap outside tooltip AND outside any phoneme chip
export function bindOutsideCloseOnce(state, hideTooltip) {
  if (state.outsideCloseBound) return;
  state.outsideCloseBound = true;

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (!state.tooltipPinned) return;

      const t = e.target;
      if (!t) return;

      // Click inside tooltip -> keep open
      const tip = state.globalTooltip;
      if (tip && (t === tip || tip.contains(t))) return;

      // Click on a chip -> let chip handler decide
      const chip = t.closest?.(".phoneme-chip[data-hydrated]");
      if (chip && chip.id !== "phonemeTitle") return;

      // Otherwise close
      try {
        hideTooltip?.();
      } catch (_) {}
    },
    { capture: true }
  );
}
