// features/convo/convo-knobs-system.js

export function createSetKnobs({ state, stage, toneSel, stressSel, paceSel }) {
  return function setKnobs(open) {
    state.knobsOpen = !!open;
    stage.classList.toggle("knobs-open", state.knobsOpen);

    // If opening, ensure drawer UI reflects current state
    if (state.knobsOpen) {
      toneSel.sel.value = state.knobs.tone;
      stressSel.sel.value = state.knobs.stress;
      paceSel.sel.value = state.knobs.pace;
    }
  };
}
