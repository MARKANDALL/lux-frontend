// ui/interactions/score-collapse.js
export function initScoreErrorCollapse() {
  const root = document.querySelector("#prettyResult");
  if (!root) return;

  // Idempotent init
  if (root.dataset.collapseInit === "yes") return;
  root.dataset.collapseInit = "yes";

  const cols = ["word", "score", "error", "phoneme"];

  const getNodes = () => ({
    sc: root.querySelector(".table-scroll-container"),
    table: root.querySelector("table.score-table") || root.querySelector("table"),
  });

  const isAllCollapsed = (table) =>
    cols.every((c) => table.classList.contains(`collapsed-${c}`));

  const rememberLastOpen = (sc, table) => {
    if (!sc || !table) return;
    if (isAllCollapsed(table)) return;
    const collapseClasses = [...table.classList].filter((c) =>
      c.startsWith("collapsed-")
    );
    sc.dataset.lastOpenClasses = JSON.stringify(collapseClasses);
  };

  const applyAllCollapsedClass = (sc, table) => {
    if (!sc || !table) return;
    sc.classList.toggle("results-all-collapsed", isAllCollapsed(table));
  };

  const restoreFromAllCollapsed = (sc, table) => {
    if (!sc || !table) return;

    sc.classList.remove("results-all-collapsed");

    let last = [];
    try {
      last = JSON.parse(sc.dataset.lastOpenClasses || "[]");
    } catch {}

    // default restore if nothing saved yet
    if (!last.length) last = ["collapsed-score", "collapsed-error"];

    cols.forEach((c) => table.classList.remove(`collapsed-${c}`));
    last.forEach((cls) => table.classList.add(cls));

    applyAllCollapsedClass(sc, table);
  };

  const toggle = (col) => {
    const { sc, table } = getNodes();
    if (!table) return;

    // If we're fully collapsed, first restore so the click "opens" meaningfully
    if (sc?.classList.contains("results-all-collapsed")) {
      restoreFromAllCollapsed(sc, table);
      // continue toggling after restore
    }

    const cls = `collapsed-${col}`;
    table.classList.toggle(cls);

    rememberLastOpen(sc, table);
    applyAllCollapsedClass(sc, table);
  };

  // Delegate clicks inside results area
  root.addEventListener("click", (e) => {
    const { sc, table } = getNodes();
    if (!table) return;

    // Click on the thin collapsed line to reopen
    if (sc?.classList.contains("results-all-collapsed")) {
      e.preventDefault();
      restoreFromAllCollapsed(sc, table);
      return;
    }

    // Word/phoneme toggle buttons
    const btn = e.target.closest(".lux-col-toggle");
    if (btn) {
      const col = btn.dataset.col;
      if (cols.includes(col)) {
        e.preventDefault();
        toggle(col);
      }
      return;
    }

    // Score/error header cells clickable
    const th = e.target.closest("th");
    if (!th) return;
    if (th.id === "scoreHeader") toggle("score");
    if (th.id === "errorHeader") toggle("error");
  });

  // initial bookkeeping
  const { sc, table } = getNodes();
  if (sc && table && !sc.dataset.lastOpenClasses) rememberLastOpen(sc, table);
  applyAllCollapsedClass(sc, table);
}
