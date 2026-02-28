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
  renderAllSummaries();

  // --- Docked-drawer selects → update state + fire unified event ---
  levelSel.sel.addEventListener("change", () => {
    state.knobs.level = levelSel.sel.value;
    saveKnobs(state.knobs);        // fires lux:knobs event
    renderAllSummaries();
  });

  toneSel.sel.addEventListener("change", () => {
    state.knobs.tone = toneSel.sel.value;
    saveKnobs(state.knobs);
    renderAllSummaries();
  });

  lengthSel.sel.addEventListener("change", () => {
    state.knobs.length = lengthSel.sel.value;
    saveKnobs(state.knobs);
    renderAllSummaries();
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
  });

  return { renderAllSummaries };
}