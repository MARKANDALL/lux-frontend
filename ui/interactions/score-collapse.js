// ui/interactions/score-collapse.js
export function initScoreErrorCollapse() {
  const box = document.getElementById("prettyResult");
  if (!box || box.dataset.collapseInit) return;
  box.dataset.collapseInit = "yes";
  box.addEventListener("click", (e) => {
    const cell = e.target.closest("td,th");
    const table = cell && cell.closest("table");
    if (!cell || !table || !Number.isInteger(cell.cellIndex)) return;
    if (cell.cellIndex === 1) table.classList.toggle("collapsed-score");
    else if (cell.cellIndex === 2) table.classList.toggle("collapsed-error");
  });
}
