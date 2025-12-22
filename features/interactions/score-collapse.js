// ui/interactions/score-collapse.js
export function initScoreErrorCollapse() {
  const box = document.getElementById("prettyResult");
  if (!box || box.dataset.collapseInit) return;
  box.dataset.collapseInit = "yes";

  box.addEventListener("click", (e) => {
    const toggleButton = e.target.closest("button.lux-col-toggle");
    if (toggleButton) {
      const table = toggleButton.closest("table");
      if (!table) return;

      const col = toggleButton.dataset.col;

      if (col === "word") {
        // Capture current (open) width so we can translate the stub inward when collapsing.
        if (!table.classList.contains("collapsed-word")) {
          const th = table.querySelector("th#wordHeader");
          if (th) {
            const w = Math.round(th.getBoundingClientRect().width);
            table.style.setProperty("--word-open-w", `${w}px`);
          }
        }
        table.classList.toggle("collapsed-word");
        return;
      }

      if (col === "phoneme") {
        table.classList.toggle("collapsed-phoneme");
        return;
      }

      return;
    }

    // Existing Score/Error collapse logic (unchanged)
    const cell = e.target.closest("td,th");
    const table = cell && cell.closest("table");
    if (!cell || !table || !Number.isInteger(cell.cellIndex)) return;

    if (cell.cellIndex === 1) table.classList.toggle("collapsed-score");
    else if (cell.cellIndex === 2) table.classList.toggle("collapsed-error");
  });
}
