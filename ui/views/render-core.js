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
import { detailedPhonemeFeedback } from "./summary.js";
import {
  computeIssueSummary,
  computeTimingsAndMedian,
  buildDetailedAnalysisHTML,
  ensureAnalysisSummaryContainer,
} from "./render-helpers.js";

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

  // Paint rows
  const body = document.getElementById("resultBody");
  if (body) body.innerHTML = buildRows(words, timings, med);

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

  const body = document.getElementById("resultBody");
  if (body) body.innerHTML = buildRows(words, timings, med);

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
