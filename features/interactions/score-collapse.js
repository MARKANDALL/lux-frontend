// features/interactions/score-collapse.js
// One-line: Handles score/error column collapse and lazily mounts syllables when the Syllable column is expanded.

async function ensureSyllablesMounted(table) {
  if (!table || table.dataset.syllablesMounted === "yes") return;

  const host = document.getElementById("prettyResult");
  const words = host?._luxLastWords;
  if (!Array.isArray(words) || !words.length) return;

  try {
    // IMPORTANT:
    // This file is in features/interactions/.
    // Syllables module is in features/results/.
    const mod = await import("../results/syllables.js");

    if (typeof mod.mountSyllablesForTable === "function") {
      mod.mountSyllablesForTable(table, words);
      table.dataset.syllablesMounted = "yes";
      return;
    }

    try {
      console.warn(
        "[score-collapse] syllables module loaded but mountSyllablesForTable missing",
        { keys: Object.keys(mod || {}) }
      );
    } catch (_) {}
  } catch (e) {
    try {
      console.warn("[score-collapse] syllable mount failed", e);
      console.warn("[score-collapse] import path was: ../results/syllables.js");
    } catch (_) {}
  }
}

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

      if (col === "syllable") {
        table.classList.toggle("collapsed-syllable");
        if (!table.classList.contains("collapsed-syllable")) {
          ensureSyllablesMounted(table);
        }
      }

      if (col === "phoneme") table.classList.toggle("collapsed-phoneme");
      return;
    }

    const cell = e.target.closest("td,th");
    const table = cell && cell.closest("table");
    if (!cell || !table || !Number.isInteger(cell.cellIndex)) return;

    const hasSyllables = !!table.querySelector("#syllableHeader");
    const scoreIdx = hasSyllables ? 2 : 1;
    const errorIdx = hasSyllables ? 3 : 2;

    if (cell.cellIndex === scoreIdx) table.classList.toggle("collapsed-score");
    else if (cell.cellIndex === errorIdx) table.classList.toggle("collapsed-error");
  });
}
