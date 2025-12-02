/* ============================================================================
   LEGACY / INACTIVE MODULE (do not revive)
   ---------------------------------------------------------------------------
   - Canonical results renderer: ui/views/index.js (lux-results-root)
   - This file is kept only for reference until its useful pieces are ported.
   - Do not attach window.* globals here.
   - Safe to move to /legacy after grep confirms zero callers.
============================================================================ */
// ui/views/render.js
import { computeTimings, median } from "./deps.js";
import { ensureHeader, wirePostDom } from "./header.js";
import { buildRows } from "./rows.js";
import { detailedPhonemeFeedback } from "./summary.js";

export function showPrettyResults(data) {
  const $out = document.getElementById("prettyResult");
  if (!$out) return;

  $out.style.maxHeight = "none";
  $out.style.height = "auto";
  $out.style.overflowY = "visible";

  if (!data || data.error) {
    $out.innerHTML = `<span class="score-bad">Error: ${
      data?.error || "Unknown"
    }</span>`;
    return;
  }
  const nbest = data.NBest && data.NBest[0];
  if (!nbest) {
    $out.innerHTML = `<span>No analysis returned.</span>`;
    return;
  }

  // Header/shell (legend + table)
  $out.innerHTML = "";
  ensureHeader(data);

  // Timings + median
  const words = nbest.Words || [];
  const timings = computeTimings?.(words) || [];
  const med =
    median?.(timings.map((t) => t.durationSec).filter(Number.isFinite)) ?? null;

  // Paint rows
  const body = document.getElementById("resultBody");
  if (body) body.innerHTML = buildRows(words, timings, med);

  // Post-DOM hooks
  requestAnimationFrame(() => wirePostDom(data));
}

export function showDetailedAnalysisSingle(data) {
  const $out = document.getElementById("prettyResult");
  if (!$out) return;

  $out.style.maxHeight = "none";
  $out.style.height = "auto";
  $out.style.overflowY = "visible";

  if (!data || !data.NBest || !data.NBest[0]) {
    $out.innerHTML = `<span>No analysis returned.</span>`;
    return;
  }

  ensureHeader(data);

  const nbest = data.NBest[0];
  const words = nbest.Words || [];
  const timings = computeTimings?.(words) || [];
  const med =
    median?.(timings.map((t) => t.durationSec).filter(Number.isFinite)) ?? null;

  const body = document.getElementById("resultBody");
  if (body) body.innerHTML = buildRows(words, timings, med);

  requestAnimationFrame(() => wirePostDom(data));

  // Inline detail summary
  const issues = {};
  const majorIssues = [];
  (words || []).forEach((w) => {
    if (w.AccuracyScore != null && w.AccuracyScore < 70) {
      majorIssues.push({ word: w.Word, score: w.AccuracyScore });
    }
    (w.Phonemes || []).forEach((p) => {
      if (p.AccuracyScore != null && p.AccuracyScore < 85) {
        const key = ((w) =>
          String(w || "")
            .trim()
            .toLowerCase())(p.Phoneme);
        if (!issues[key]) issues[key] = { count: 0, scores: [], examples: [] };
        issues[key].count++;
        issues[key].scores.push(p.AccuracyScore);
        issues[key].examples.push({ word: w.Word, score: p.AccuracyScore });
      }
    });
  });

  const worstErrors = majorIssues.slice(0, 5);
  let html = `<b>Detailed Pronunciation Analysis</b><hr style="margin:12px 0;">`;
  html += `<b>Most Frequent Error Patterns:</b><br>`;
  html += detailedPhonemeFeedback(issues);
  html += `<b>Most Serious Errors:</b><br>`;
  html += worstErrors.length
    ? worstErrors
        .map(
          (err) =>
            `<div>&bull; <b>${err.word}</b>: <span style="color:#d43c2c;">${err.score}%</span></div>`
        )
        .join("")
    : "<div>No major issues detected.</div>";

  let summary = document.getElementById("customAnalysisSummary");
  if (!summary) {
    summary = document.createElement("div");
    summary.id = "customAnalysisSummary";
    $out.appendChild(summary);
  }
  summary.innerHTML = html;
}
