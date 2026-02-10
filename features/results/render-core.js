/* ============================================================================
   PHASE-E RENDER CORE (pure-ish modern trunk)
   ---------------------------------------------------------------------------
   - Moved verbatim from render-modern.js.
   - render-modern.js becomes a thin adapter that calls these.
   - NO behavior changes. Output must remain identical.
============================================================================ */

// ui/views/render-core.js
import { computeTimings, median } from "./deps.js";
import { ensureHeader, wirePostDom } from "./header.js";
import { buildRows } from "./rows.js";
// UPDATED IMPORT: Pointing to the new independent module
import { detailedPhonemeFeedback } from "./summary-feedback.js";
import {
  computeIssueSummary,
  computeTimingsAndMedian,
  buildDetailedAnalysisHTML,
  ensureAnalysisSummaryContainer,
} from "./render-helpers.js";

async function maybeMountSyllablesNow(words) {
  try {
    const host = document.getElementById("prettyResult");
    if (!host) return;

    const table = host.querySelector("table.score-table");
    if (!table) return;

    // If syllables are collapsed, do nothing (they'll mount on toggle).
    if (table.classList.contains("collapsed-syllable")) return;

    // If we already mounted for this render, skip.
    if (table.dataset.syllablesMounted === "yes") return;

    const mod = await import("./syllables.js");
    if (typeof mod.mountSyllablesForTable !== "function") return;

    mod.mountSyllablesForTable(table, words);
    table.dataset.syllablesMounted = "yes";
  } catch (e) {
    try {
      console.warn("[render-core] syllable mount failed", e);
    } catch (_) {}
  }
}

export function renderPrettyResultsCore({ $out, data, nbest }) {
  // Header/shell (legend + table)
  $out.innerHTML = "";
  ensureHeader(data);

  // Timings + median
  const words = nbest.Words || [];
  const { timings, med } = computeTimingsAndMedian(
    words,
    computeTimings,
    median
  );

  // Expose words for lazy syllable rendering (no globals; store on host node)
  const host = document.getElementById("prettyResult");
  if (host) host._luxLastWords = words;

  // Paint rows
  const body = document.getElementById("resultBody");
  if (body) {
    const table = document.querySelector("#prettyResult table.score-table");
    if (table) delete table.dataset.syllablesMounted;

    body.innerHTML = buildRows(words, timings, med);
    // If the syllable column is currently open, mount immediately (fixes "open but empty")
    maybeMountSyllablesNow(words);
  }

  // Post-DOM hooks
  requestAnimationFrame(() => wirePostDom(data));
}

export function renderDetailedAnalysisCore({ $out, data, nbest }) {
  ensureHeader(data);

  const words = nbest.Words || [];
  const { timings, med } = computeTimingsAndMedian(
    words,
    computeTimings,
    median
  );

  const host = document.getElementById("prettyResult");
  if (host) host._luxLastWords = words;

  const body = document.getElementById("resultBody");
  if (body) {
    const table = document.querySelector("#prettyResult table.score-table");
    if (table) delete table.dataset.syllablesMounted;

    body.innerHTML = buildRows(words, timings, med);
    maybeMountSyllablesNow(words);
  }

  requestAnimationFrame(() => wirePostDom(data));

  // Inline detail summary
  const { issues, majorIssues } = computeIssueSummary(words);

  const html = buildDetailedAnalysisHTML({
    issues,
    majorIssues,
    detailedPhonemeFeedback,
  });

  const summary = ensureAnalysisSummaryContainer($out);
  summary.innerHTML = html;
}
