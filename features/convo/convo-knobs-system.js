// features/convo/convo-knobs-system.js

export function createSetKnobs({ state, stage, levelSel, toneSel, lengthSel }) {
  return function setKnobs(open) {
    state.knobsOpen = !!open;
    stage.classList.toggle("knobs-open", state.knobsOpen);

    // If opening, ensure drawer UI reflects current state
    if (state.knobsOpen) {
      levelSel.sel.value = state.knobs.level;
      toneSel.sel.value = state.knobs.tone;
      lengthSel.sel.value = state.knobs.length;
    }
  };
}