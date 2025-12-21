// ui/interactions/score-collapse.js
export function initScoreErrorCollapse() {
  const box = document.getElementById("prettyResult");
  if (!box || box.dataset.collapseInit) return;
  box.dataset.collapseInit = "yes";
  box.addEventListener("click", (e) => {
    const toggleButton = e.target.closest("button.lux-col-toggle");
    if (toggleButton) {
      const table = toggleButton.closest("table");
      const col = toggleButton.dataset.col;
      if (!table || !col) return;
      if (col === "word") table.classList.toggle("collapsed-word");
      if (col === "phoneme") table.classList.toggle("collapsed-phoneme");
      return;
    }
    const cell = e.target.closest("td,th");
    const table = cell && cell.closest("table");
    if (!cell || !table || !Number.isInteger(cell.cellIndex)) return;
    if (cell.cellIndex === 1) table.classList.toggle("collapsed-score");
    else if (cell.cellIndex === 2) table.classList.toggle("collapsed-error");
  });
}
