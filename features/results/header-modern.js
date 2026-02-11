/* =============================================================================
   FILE: features/results/header-modern.js
   ONE-LINE: Builds the “Word & Phoneme chart” accordion markup (summary handle + chart body).
============================================================================= */

/* ============================================================================
   MODERN HEADER BUILDER
   ---------------------------------------------------------------------------
   - Fixed White Space Issue (Bottom of results).
   - Unified Phoneme Tooltips (Using shared Global logic).
   - Sticky Header + Contained Scroll.
============================================================================ */

import {
  scoreClass,
  fmtPct,
  getAzureScores,
  deriveFallbackScores,
} from "../../core/scoring/index.js";

const TOOLTIPS = {
  Accuracy: "How close your pronunciation is to a native speaker.",
  Fluency: "How smooth and natural your speech was.",
  Completeness: "Did you say all the words in the reference?",
  Pronunciation: "Overall pronunciation quality.",
  Prosody: "Stress, intonation, rhythm, and pacing.",
  Phoneme: "The smallest possible sound in a language.",
  Overall: "Aggregate score across all categories combined.",
};

export function renderResultsHeaderModern(data) {
  // 1. SCORING LOGIC
  let scores = getAzureScores(data);
  if (scores.accuracy == null) {
    const fb = deriveFallbackScores(data);
    scores = { ...scores, ...fb };
  }
  const { accuracy, fluency, completeness, overall, prosody, nbest } = scores;

  // 2. SPEAKING RATE
  let rateStr = "";
  if (typeof globalThis.getSpeakingRate === "function") {
      const rate = globalThis.getSpeakingRate(data);
      if (rate && Number.isFinite(rate.wps)) {
          rateStr = ` • ~${rate.wps.toFixed(1)} w/s`;
      }
  }

  // 3) PYRAMID SCORE UI (Overall circle + 5 tiles)

  const fmtRoundPct = (v) =>
    v == null || !Number.isFinite(+v) ? "—" : `${Math.round(+v)}%`;

  const meanAvail = (...vals) => {
    const v = vals.map((x) => +x).filter((x) => Number.isFinite(x));
    if (!v.length) return null;
    return v.reduce((a, b) => a + b, 0) / v.length;
  };

  // Treat "overall" from Azure as Pronunciation (tile)
  const pronunciation = overall;

  // Overall aggregate (your new blue circle)
  const overallAgg = meanAvail(accuracy, fluency, completeness, prosody, pronunciation);

  const getRingColor = (v) => {
    const n = +v;
    if (!Number.isFinite(n)) return "#cbd5e1";
    if (n >= 80) return "#2563eb";
    if (n >= 60) return "#d97706";
    return "#dc2626";
  };

  const overallRingColor = getRingColor(overallAgg);

  const renderMetricTile = (label, val, key, meta = "") => {
    const labelHtml = label;

    return `
      <div class="lux-scoreTile" data-score-key="${key}">
        <div class="lux-scoreTile-label">
          ${labelHtml}
          <span class="tooltip result-tip tip-${key}">(?) 
            <span class="tooltiptext">${TOOLTIPS[key] || ""}</span>
          </span>
        </div>
        <div class="lux-scoreTile-value">${fmtRoundPct(val)}</div>
        ${meta ? `<div class="lux-scoreTile-meta">${meta}</div>` : ``}
      </div>
    `;
  };

  const saidText = data?.DisplayText || nbest?.Display || "(No speech detected)";
  // Expose for other modules (e.g., syllable alt meaning tooltip)
  try { window.LuxLastSaidText = saidText; } catch {}

  const headerScoreClass = overallAgg != null ? scoreClass(overallAgg) : "";
  const scoreHeaderAttrs = [
    'id="scoreHeader"',
    `class="toggle-col ${headerScoreClass}"`,
    `data-overall-score="${overallAgg || 0}"`
  ].join(" ");

  // 4. PROSODY LEGEND
  const legendHtml = `
    <div id="prosodyLegend" class="prosody-legend prosody-legend--side hidden" role="note" aria-live="polite">
      <div class="legend-row">
        <div class="sample">
          <div class="prosody-ribbon">
            <span class="pr-seg pr-gap ok" style="width:12px"></span>
            <span class="pr-seg pr-tempo ok" style="width:28px"></span>
          </div>
          <span class="label">Normal</span>
        </div>

        <div class="sample">
          <div class="prosody-ribbon">
            <span class="pr-seg pr-gap missing" style="width:20px"></span>
            <span class="pr-seg pr-tempo ok" style="width:28px"></span>
          </div>
          <span class="label">Pause</span>
        </div>

        <div class="sample">
          <div class="prosody-ribbon">
            <span class="pr-seg pr-gap unexpected" style="width:34px"></span>
            <span class="pr-seg pr-tempo ok" style="width:28px"></span>
          </div>
          <span class="label">Long pause</span>
        </div>

        <div class="sample">
          <div class="prosody-ribbon">
            <span class="pr-seg pr-gap ok" style="width:12px"></span>
            <span class="pr-seg pr-tempo fast" style="width:16px"></span>
          </div>
          <span class="label">Fast word</span>
        </div>

        <div class="sample">
          <div class="prosody-ribbon">
            <span class="pr-seg pr-gap ok" style="width:12px"></span>
            <span class="pr-seg pr-tempo slow" style="width:60px"></span>
          </div>
          <span class="label">Slow word</span>
        </div>
      </div>
      <div class="note">Bars show pause (left) and tempo (right).</div>
    </div>
  `;

  // 5. FINAL ASSEMBLY
  // FIX: Styles specifically tuned to kill white space and scrolling issues.
  // display: block; height: auto; flex: none; -> Forces container to shrink to content.
  return `
    <div id="resultHeader" style="margin-bottom: 20px;">
      <div style="margin-bottom: 12px;">
        <b style="font-size: 1.1em;">Your Results:</b>

        <details class="lux-results-accordion lux-results-accordion--scores" id="luxScoreAccordion" open>
          <summary class="lux-results-accordion-handle lux-scoreAccordion-handle" title="Show/hide score breakdown">
            <span class="lux-scoreAccWord lux-scoreAccWord--left">Overall</span>

            <div class="lux-scoreRing lux-scoreRing--overall lux-scoreAccRing" style="--lux-score-ring:${overallRingColor};">
              ${fmtRoundPct(overallAgg)}
            </div>

            <span class="lux-scoreAccWord lux-scoreAccWord--right">Score</span>
          </summary>

          <div class="lux-scoreAccBody">
            <div class="lux-scorePyramid">
              <div class="lux-scoreRow lux-scoreRow-mid">
                ${renderMetricTile("Prosody", prosody, "Prosody", rateStr ? rateStr.replace(/^ • /, "") : "")}
                ${renderMetricTile("Pronunciation", pronunciation, "Pronunciation")}
              </div>

              <div class="lux-scoreRow lux-scoreRow-bottom">
                ${renderMetricTile("Accuracy", accuracy, "Accuracy")}
                ${renderMetricTile("Fluency", fluency, "Fluency")}
                ${renderMetricTile("Completeness", completeness, "Completeness")}
              </div>
            </div>
          </div>
        </details>
      </div>
  
      <div style="margin-bottom: 16px; color:#334155;">
        <b>What you said:</b>
        <span style="font-style:italic;">"${saidText}"</span>
      </div>
    </div>

    <details class="lux-results-accordion" id="luxWpAccordion" open>
      <summary class="lux-results-accordion-handle" title="Show/hide Word & Phoneme chart">
        <span class="lux-toggleHint lux-toggleHint--closed" aria-hidden="true">Open</span>
        <span class="lux-toggleHint lux-toggleHint--open" aria-hidden="true">Close</span>
        <span class="lux-acc-title">Word &amp; Phoneme chart</span>
        <button type="button" id="prosodyLegendToggle" class="prosody-legend-toggleBtn" aria-controls="prosodyLegend" aria-expanded="false" title="Show/hide prosody bars key">Key</button>
      </summary>

      <div class="results-flex">
        ${legendHtml}

        <div class="table-scroll-container custom-scrollbar">
<table class="score-table collapsed-score collapsed-error">
            <thead style="position: sticky; top: 0; z-index: 20; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <tr>
                <th id="wordHeader">
                  <button class="lux-col-toggle" type="button" data-col="word" aria-label="Collapse/expand Word column" title="Collapse/expand Word column">▸</button>
                  <span class="word-chip clickable">Word</span>
                </th>

                <th id="syllableHeader">
                  <button class="lux-col-toggle" type="button" data-col="syllable" aria-label="Collapse/expand Syllable column" title="Collapse/expand Syllable column">▸</button>
                  <span class="word-chip syllable-chip">Syllable</span>
                </th>

                <th ${scoreHeaderAttrs}>Score ▸</th>
                <th id="errorHeader" class="toggle-col">Error ▸</th>
                <th id="phonemeHeader">
                  <button class="lux-col-toggle" type="button" data-col="phoneme" aria-label="Collapse/expand Phoneme column" title="Collapse/expand Phoneme column">▸</button>
                  <span class="word-chip phoneme-chip clickable" id="phonemeTitle">Phoneme</span>
                  <span class="tooltip result-tip tip-Phoneme" style="margin-left:6px;">(?)<span class="tooltiptext">${TOOLTIPS.Phoneme}</span></span>
                </th>
              </tr>
            </thead>
            <tbody id="resultBody"></tbody>
          </table>
        </div>
      </div>
    </details>
  `;
}
