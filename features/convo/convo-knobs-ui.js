// features/convo/convo-knobs-ui.js
// Wires the Scene Settings (knobs) UI: header button toggles docked drawer; picker button opens chip drawer; keeps summaries + selects in sync.

import { getKnobsDrawerInstance, onKnobsChange, peekKnobsDrawer, unpeekKnobsDrawer } from "./knobs-drawer.js";

export function wireConvoKnobsUI({
  state,
  setKnobs,
  knobsBtn,
  pickerKnobsBtn,
  pickerKnobsSummary,
  closeDrawer,
  scrim,
  levelSel,
  toneSel,
  lengthSel,
  knobsSummaryText,
  saveKnobs,
  SCENARIOS,
}) {
  // Chat-mode header button → opens docked drawer (unchanged)
  knobsBtn.addEventListener("click", () => setKnobs(!state.knobsOpen));

  // Picker-mode button → opens the chip-pill knobs drawer (PASS 1 fix)
  if (pickerKnobsBtn) {
    pickerKnobsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      getKnobsDrawerInstance().open();
    });
  }

  if (pickerKnobsBtn) {
    pickerKnobsBtn.addEventListener("mouseenter", () => peekKnobsDrawer());
    pickerKnobsBtn.addEventListener("mouseleave", () => unpeekKnobsDrawer());
  }

  closeDrawer.addEventListener("click", () => setKnobs(false));
  scrim.addEventListener("click", () => setKnobs(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setKnobs(false);
  });

  // Initialize drawer selects from stored knobs
  levelSel.sel.value = state.knobs.level;
  toneSel.sel.value = state.knobs.tone;
  lengthSel.sel.value = state.knobs.length;

  // --- Summary display (PASS 2: always in sync) ---
  function renderAllSummaries() {
    if (pickerKnobsSummary) {
      const s = SCENARIOS?.[state.scenarioIdx];
      const roleLabel = s?.roles?.[state.roleIdx ?? 0]?.label || null;
      pickerKnobsSummary.textContent = knobsSummaryText(state.knobs, roleLabel);
    }
  }

  // --- Picker summary pill micro-interactions (subtle + visible) ---
  let _pulseTimer = null;
  function setHoverLabel(label) {
    if (!pickerKnobsSummary) return;
    pickerKnobsSummary.dataset.hover = label || "";
  }
  function clearHoverLabel() {
    setHoverLabel("");
  }
  function pulseSummary() {
    if (!pickerKnobsSummary) return;
    pickerKnobsSummary.dataset.pulse = "1";
    if (_pulseTimer) clearTimeout(_pulseTimer);
    _pulseTimer = setTimeout(() => {
      pickerKnobsSummary.dataset.pulse = "0";
    }, 320);
  }
  function bindHover(el, labelFn) {
    if (!el) return;
    const on = () => setHoverLabel(labelFn());
    const off = () => clearHoverLabel();
    el.addEventListener("mouseenter", on);
    el.addEventListener("mouseleave", off);
    el.addEventListener("focus", on);
    el.addEventListener("blur", off);
  }

  renderAllSummaries();

  // --- Docked-drawer selects → update state + fire unified event ---
  levelSel.sel.addEventListener("change", () => {
    state.knobs.level = levelSel.sel.value;
    saveKnobs(state.knobs);        // fires lux:knobs event
    renderAllSummaries();
    pulseSummary();
  });

  toneSel.sel.addEventListener("change", () => {
    state.knobs.tone = toneSel.sel.value;
    saveKnobs(state.knobs);
    renderAllSummaries();
    pulseSummary();
  });

  lengthSel.sel.addEventListener("change", () => {
    state.knobs.length = lengthSel.sel.value;
    saveKnobs(state.knobs);
    renderAllSummaries();
    pulseSummary();
  });

  // Hover-preview: when you hover the controls, the pill “bulges” + shows a tiny tag
  bindHover(levelSel.sel, () => `Level • ${(levelSel.sel.value || "").toUpperCase()}`);
  bindHover(toneSel.sel, () => `Tone • ${toneSel.sel.value}`);
  bindHover(lengthSel.sel, () => `Length • ${lengthSel.sel.value}`);

  // Allow other modules (characters drawer, etc.) to drive the same subtle preview/pulse
  document.addEventListener("lux:pickerSummaryHover", (e) => {
    setHoverLabel(e?.detail?.label || "");
  });
  document.addEventListener("lux:pickerSummaryHoverClear", () => {
    clearHoverLabel();
  });
  document.addEventListener("lux:pickerSummaryPulse", () => {
    pulseSummary();
  });

  // --- Chip drawer → sync back into state + docked-drawer selects (PASS 2) ---
  onKnobsChange((knobs) => {
    state.knobs.level = knobs.level;
    state.knobs.tone = knobs.tone;
    state.knobs.length = knobs.length;

    // Keep docked-drawer selects in sync
    levelSel.sel.value = knobs.level;
    toneSel.sel.value = knobs.tone;
    lengthSel.sel.value = knobs.length;

    renderAllSummaries();
    pulseSummary();
  });

  return { renderAllSummaries };
}