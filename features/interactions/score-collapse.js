// ui/interactions/score-collapse.js
export function initScoreErrorCollapse() {
  const box = document.getElementById("prettyResult");
  if (!box || box.dataset.collapseInit) return;
  box.dataset.collapseInit = "yes";

  box.addEventListener("click", (e) => {
    // NEW: Dedicated toggle buttons for Word/Phoneme columns.
    // This prevents interfering with the existing header "pill" click behaviors.
    const toggleButton = e.target.closest("button.lux-col-toggle");
    if (toggleButton) {
      const table = toggleButton.closest("table");
      if (!table) return;

      const col = toggleButton.dataset.col;
      if (col === "word") table.classList.toggle("collapsed-word");
      else if (col === "phoneme") table.classList.toggle("collapsed-phoneme");

      return; // Critical: don't fall through to Score/Error cellIndex logic.
    }

    // EXISTING: Score/Error collapse based on clicked column index.
    const cell = e.target.closest("td,th");
    const table = cell && cell.closest("table");
    if (!cell || !table || !Number.isInteger(cell.cellIndex)) return;

    // With the correct 4-column table:
    // 0=Word, 1=Score, 2=Error, 3=Phoneme
    if (cell.cellIndex === 1) table.classList.toggle("collapsed-score");
    else if (cell.cellIndex === 2) table.classList.toggle("collapsed-error");
  });
}
