// features/convo/convo-knobs-ui.js

export function wireConvoKnobsUI({
  state,
  setKnobs,
  knobsBtn,
  pickerKnobsBtn,
  pickerKnobsSummary,
  closeDrawer,
  scrim,
  levelSel,
  moodSel,
  lengthSel,
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
  levelSel.sel.value = state.knobs.level;
  moodSel.sel.value = state.knobs.mood;
  lengthSel.sel.value = state.knobs.length;

  // Picker summary (if present)
  function renderPickerKnobsSummary() {
    if (!pickerKnobsSummary) return;
    pickerKnobsSummary.textContent = knobsSummaryText(state.knobs);
  }
  renderPickerKnobsSummary();

  levelSel.sel.addEventListener("change", () => {
    state.knobs.level = levelSel.sel.value;
    saveKnobs(state.knobs);
    renderPickerKnobsSummary();
  });

  moodSel.sel.addEventListener("change", () => {
    state.knobs.mood = moodSel.sel.value;
    saveKnobs(state.knobs);
    renderPickerKnobsSummary();
  });

  lengthSel.sel.addEventListener("change", () => {
    state.knobs.length = lengthSel.sel.value;
    saveKnobs(state.knobs);
    renderPickerKnobsSummary();
  });
}