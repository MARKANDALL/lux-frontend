// features/interactions/ph-hover/chip-events.js
// Row chip event wiring:
// - hover in/out shows tooltip (unless pinned)
// - capture-phase click "trap door" pins tooltip (mobile-friendly)
// - CRITICAL: never swallow header pill clicks (#phonemeTitle)

export function installChipEvents(state, { showTooltip, handleChipClick, scheduleHide, bindOutsideCloseOnce }) {
  const root = document.body;

  // Hover in: show tooltip for row chips
  root.addEventListener("mouseover", (e) => {
    if (state.tooltipPinned) return;

    const chip = e.target.closest(".phoneme-chip[data-hydrated]");
    if (!chip) return;
    if (chip.id === "phonemeTitle") return;

    if (state.hideTimeout) clearTimeout(state.hideTimeout);

    showTooltip?.(chip, { pinned: false });
  });

  // Hover out: hide tooltip (but DON'T hide if moving into tooltip itself)
  root.addEventListener("mouseout", (e) => {
    if (state.tooltipPinned) return;

    const chip = e.target.closest(".phoneme-chip[data-hydrated]");
    if (!chip) return;
    if (chip.id === "phonemeTitle") return;

    const to = e.relatedTarget;

    // If moving into tooltip, don't hide
    const tip = state.globalTooltip;
    if (to && tip && (to === tip || tip.contains(to))) return;

    scheduleHide?.(state);
  });

  // === CRITICAL: Capture-phase click handler ("trap door") ===
  // Never swallow header pill clicks.
  // Row chip click pins the tooltip and NEVER autoplays.
  root.addEventListener(
    "click",
    (e) => {
      const chip = e.target.closest(".phoneme-chip[data-hydrated]");
      if (!chip) return;

      // Let header pill clicks pass through (ph-audio.js and/or header preview click)
      if (chip.id === "phonemeTitle") return;

      // We handle row-chip clicks -> pin tooltip
      e.preventDefault();
      e.stopPropagation();

      // Toggle behavior: clicking the same chip while pinned closes it
      if (state.tooltipPinned && state.currentChip === chip) {
        state.hideTooltip?.();
        return;
      }

      if (state.hideTimeout) clearTimeout(state.hideTimeout);

      handleChipClick?.(chip);
    },
    { capture: true }
  );

  // Ensure outside-close exists (once)
  bindOutsideCloseOnce?.(state, state.hideTooltip);
}
