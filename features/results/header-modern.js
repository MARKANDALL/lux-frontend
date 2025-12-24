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
  Phoneme: "The smallest possible sound in a language." 
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

  // 3. CHIP RENDERER
  const renderChip = (label, val, key, extra = "") => {
      const cls = scoreClass(val); 
      return `
        <span class="${cls}" style="white-space:nowrap; margin-right:4px; display:inline-block;">
          ${label}
          <span class="tooltip result-tip tip-${key}">(?) 
            <span class="tooltiptext">${TOOLTIPS[key] || ""}</span>
          </span>
          : ${fmtPct(val)}${extra}
        </span>
      `;
  };

  const saidText = data?.DisplayText || nbest?.Display || "(No speech detected)";

  const headerScoreClass = overall != null ? scoreClass(overall) : "";
  const scoreHeaderAttrs = [
    'id="scoreHeader"',
    `class="toggle-col ${headerScoreClass}"`,
    `data-overall-score="${overall || 0}"`
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
      </div>
      <div class="note">Bars show pause (left) and tempo (right).</div>
    </div>
  `;

  // 5. FINAL ASSEMBLY
  // FIX: Styles specifically tuned to kill white space and scrolling issues.
  // display: block; height: auto; flex: none; -> Forces container to shrink to content.
  return `
    <div id="resultHeader" style="margin-bottom: 20px;">
      <div style="margin-bottom: 12px; font-size: 1.1em;">
        <b>Your Results:</b><br>
        <div style="margin-top:8px; line-height: 2.2;">
            ${renderChip("Prosody", prosody, "Prosody", rateStr)} | 
            ${renderChip("Accuracy", accuracy, "Accuracy")} | 
            ${renderChip("Fluency", fluency, "Fluency")} | 
            ${renderChip("Completeness", completeness, "Completeness")} | 
            ${renderChip("Pronunciation", overall, "Pronunciation")}
        </div>
      </div>
  
      <div style="margin-bottom: 16px; color:#334155;">
        <b>What you said:</b>
        <span style="font-style:italic;">"${saidText}"</span>
      </div>
    </div>

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
              <th ${scoreHeaderAttrs}>Score ▸</th>
              <th id="errorHeader" class="toggle-col">Error ▸</th>
              <th id="phonemeHeader">
                <button class="lux-col-toggle" type="button" data-col="phoneme" aria-label="Collapse/expand Phoneme column" title="Collapse/expand Phoneme column">▸</button>
                <span class="word-chip phoneme-chip clickable" id="phonemeTitle">Phoneme</span>
                <span class="tooltip result-tip tip-Phoneme" style="margin-left: 8px;">(?)<span class="tooltiptext">${TOOLTIPS.Phoneme}</span></span>
              </th>
            </tr>
          </thead>
          <tbody id="resultBody"></tbody>
        </table>
      </div>
    </div>
  `;
}