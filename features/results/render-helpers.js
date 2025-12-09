// ui/views/render-helpers.js
import { speechDetected } from "../../helpers/assess.js";
// UPDATED IMPORT: Circular dependency resolved by using the new leaf module
import { detailedPhonemeFeedback } from "./summary-feedback.js";

export function computeIssueSummary(words) {
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

  return { issues, majorIssues };
}

export function computeTimingsAndMedian(words, computeTimings, median) {
  const timings = computeTimings?.(words) || [];
  const med =
    median?.(timings.map((t) => t.durationSec).filter(Number.isFinite)) ?? null;

  return { timings, med };
}

/**
 * Prepares the output container.
 * RESTORED: Uses speechDetected() to show the "Graceful Fallback" message
 * if Azure returns valid JSON but no audible speech.
 */
export function preparePrettyOut(data) {
  const $out = document.getElementById("prettyResult");
  if (!$out) return { $out: null, nbest: null, stop: true };

  $out.style.maxHeight = "none";
  $out.style.height = "auto";
  $out.style.overflowY = "visible";

  // 1. Hard API Errors
  if (!data || data.error) {
    $out.innerHTML = `<span class="score-bad">Error: ${
      data?.error || "Unknown"
    }</span>`;
    return { $out, nbest: null, stop: true };
  }

  // 2. Graceful Fallback: No Speech Detected
  // This catches silence, mic errors, or empty results
  if (!speechDetected(data)) {
    $out.innerHTML = `
      <div style="padding: 10px 0;">
        <h3 style="margin-top:0; color:#1f2937;">No speech detected.</h3>
        <p style="color:#b91c1c; font-weight:700; margin-bottom: 0;">
          Sorry, but we didn’t hear anything. Please check your mic and try again.
        </p>
      </div>
    `;
    // We stop here to prevent rendering a broken table
    return { $out, nbest: null, stop: true };
  }

  // 3. Valid Result
  const nbest = data.NBest && data.NBest[0];
  return { $out, nbest, stop: false };
}

export function preparePrettyOutSingle(data) {
  const $out = document.getElementById("prettyResult");
  if (!$out) return { $out: null, nbest: null, stop: true };

  $out.style.maxHeight = "none";
  $out.style.height = "auto";
  $out.style.overflowY = "visible";

  if (!speechDetected(data)) {
    $out.innerHTML = `<span>No analysis returned.</span>`;
    return { $out, nbest: null, stop: true };
  }

  const nbest = data.NBest[0];
  return { $out, nbest, stop: false };
}

export function buildDetailedAnalysisHTML({
  issues,
  majorIssues,
  detailedPhonemeFeedback,
}) {
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

  return html;
}

export function ensureAnalysisSummaryContainer($out) {
  let summary = document.getElementById("customAnalysisSummary");
  if (!summary) {
    summary = document.createElement("div");
    summary.id = "customAnalysisSummary";
    $out.appendChild(summary);
  }
  return summary;
}