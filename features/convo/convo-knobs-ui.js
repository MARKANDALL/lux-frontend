// features/convo/convo-knobs-ui.js

export function wireConvoKnobsUI({
  state,
  setKnobs,
  knobsBtn,
  pickerKnobsBtn,
  pickerKnobsSummary,
  closeDrawer,
  scrim,
  toneSel,
  stressSel,
  paceSel,
  knobsSummaryText,
  saveKnobs,
}) {
  knobsBtn.addEventListener("click", () => setKnobs(!state.knobsOpen));

  if (pickerKnobsBtn) {
    pickerKnobsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // IMPORTANT: don't advance deck / trigger other clicks
      setKnobs(true);
    });
  }

  closeDrawer.addEventListener("click", () => setKnobs(false));
  scrim.addEventListener("click", () => setKnobs(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setKnobs(false);
  });

  // Initialize drawer selects from stored knobs
  toneSel.sel.value = state.knobs.tone;
  stressSel.sel.value = state.knobs.stress;
  paceSel.sel.value = state.knobs.pace;

  // Picker summary (if present)
  function renderPickerKnobsSummary() {
    if (!pickerKnobsSummary) return;
    pickerKnobsSummary.textContent = knobsSummaryText(state.knobs);
  }
  renderPickerKnobsSummary();

  toneSel.sel.addEventListener("change", () => {
    state.knobs.tone = toneSel.sel.value;
    saveKnobs(state.knobs);
    renderPickerKnobsSummary();
  });

  stressSel.sel.addEventListener("change", () => {
    state.knobs.stress = stressSel.sel.value;
    saveKnobs(state.knobs);
    renderPickerKnobsSummary();
  });

  paceSel.sel.addEventListener("change", () => {
    state.knobs.pace = paceSel.sel.value;
    saveKnobs(state.knobs);
    renderPickerKnobsSummary();
  });
}
