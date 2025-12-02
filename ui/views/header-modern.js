/* ============================================================================
   MODERN HEADER BUILDER — CANONICAL SCORING
   ---------------------------------------------------------------------------
   - Pure ES module; no window/globalThis writes.
   - Preferred by ui/views/header.js for Phase-E results rendering.
   - Uses core/scoring/index.js (getAzureScores, deriveFallbackScores,
     fmtPct, scoreClass) to compute overall scores.
   - For now, preserves existing header text ("Score ▸", etc.) and
     only exposes scores via data-attributes + CSS classes.
============================================================================ */

import {
  scoreClass,
  fmtPct,
  getAzureScores,
  deriveFallbackScores,
} from "../../core/scoring/index.js";

function computeHeaderScores(data) {
  let scores = null;

  try {
    if (typeof getAzureScores === "function") {
      scores = getAzureScores(data);
    }
  } catch (_) {
    // ignore and fall through to fallback
  }

  if (!scores && typeof deriveFallbackScores === "function") {
    try {
      scores = deriveFallbackScores(data);
    } catch (_) {
      // ignore
    }
  }

  return scores || {};
}

/**
 * renderResultsHeaderModern
 * -------------------------
 * Returns HTML for the main results header + table shell.
 * Keeps text identical to the legacy header, but decorates the Score
 * header with canonical overall accuracy information via data-attrs.
 */
export function renderResultsHeaderModern(data) {
  const scores = computeHeaderScores(data);

  // Try a few plausible keys for "overall" accuracy.
  const overall =
    typeof scores.overallAccuracy === "number"
      ? scores.overallAccuracy
      : typeof scores.pronunciation === "number"
        ? scores.pronunciation
        : typeof scores.accuracy === "number"
          ? scores.accuracy
          : null;

  const overallLabel =
    overall != null && typeof fmtPct === "function" ? fmtPct(overall) : "";

  const headerScoreClass =
    overall != null && typeof scoreClass === "function"
      ? scoreClass(overall)
      : "";

  const headerDivAttrs = ['id="resultHeader"'];
  if (overall != null) {
    headerDivAttrs.push(`data-overall-accuracy="${overall}"`);
  }
  if (overallLabel) {
    headerDivAttrs.push(`data-overall-label="${overallLabel}"`);
  }

  const scoreHeaderAttrs = ['id="scoreHeader"'];
  scoreHeaderAttrs.push(
    `class="toggle-col${headerScoreClass ? " " + headerScoreClass : ""}"`,
  );

  if (overall != null) {
    scoreHeaderAttrs.push(`data-overall-score="${overall}"`);
  }
  if (overallLabel) {
    scoreHeaderAttrs.push(`data-overall-label="${overallLabel}"`);
  }

  return `
    <div ${headerDivAttrs.join(" ")}></div>
    <table class="score-table collapsed-score collapsed-error">
      <thead>
        <tr>
          <th id="wordHeader">
            <span class="word-chip clickable">Word</span>
          </th>
          <th ${scoreHeaderAttrs.join(" ")}>
            Score ▸
          </th>
          <th id="errorHeader" class="toggle-col">
            Error ▸
          </th>
          <th id="phonemeHeader">
            <span
              class="word-chip phoneme-chip clickable"
              id="phonemeTitle"
            >
              Phoneme
            </span>
          </th>
        </tr>
      </thead>
      <tbody id="resultBody"></tbody>
    </table>
  `;
}
