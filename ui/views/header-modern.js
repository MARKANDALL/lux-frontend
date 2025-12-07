/* ============================================================================
   MODERN HEADER BUILDER — CANONICAL SCORING + PROSODY LEGEND RESTORED
   ---------------------------------------------------------------------------
   - Uses core/scoring/index.js for authoritative score extraction.
   - RESTORES the "Your Results" dashboard (Score Chips).
   - RESTORES the Prosody Legend (Toggle + Slide-out Panel) by wrapping the
     table in .results-flex and adding the #prosodyLegendToggle trigger.
   - The interaction logic lives in ui/interactions/legend-toggle.js and
     will automatically attach to these elements.
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
  Prosody: "Stress, intonation, rhythm, and pacing. Captures phrasing, word stress, and natural flow."
};

/**
 * renderResultsHeaderModern
 * -------------------------
 * Returns HTML for:
 * 1. The Score Summary (Chips)
 * 2. The Sliding Prosody Legend (Hidden by default)
 * 3. The Main Table
 */
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

  // 4. "WHAT YOU SAID"
  const saidText = data?.DisplayText || nbest?.Display || "(No speech detected)";

  // 5. HEADER ATTRIBUTES
  const headerScoreClass = overall != null ? scoreClass(overall) : "";
  const scoreHeaderAttrs = [
    'id="scoreHeader"',
    `class="toggle-col ${headerScoreClass}"`,
    `data-overall-score="${overall || 0}"`
  ].join(" ");

  // 6. PROSODY LEGEND HTML (Restored from Legacy)
  // This hidden block slides out when the user clicks the (?) trigger.
  const legendHtml = `
    <div id="prosodyLegend" class="prosody-legend prosody-legend--side hidden" role="note" aria-live="polite">
      <div class="legend-row">
        <div class="sample">
          <div class="prosody-ribbon">
            <span class="pr-seg pr-gap ok" style="width:12px"></span>
            <span class="pr-seg pr-tempo ok" style="width:28px"></span>
          </div>
          <span class="label">Normal pause & tempo</span>
        </div>
        <div class="sample">
          <div class="prosody-ribbon">
            <span class="pr-seg pr-gap missing" style="width:20px"></span>
            <span class="pr-seg pr-tempo ok" style="width:28px"></span>
          </div>
          <span class="label">Phrase break (medium pause)</span>
        </div>
        <div class="sample">
          <div class="prosody-ribbon">
            <span class="pr-seg pr-gap unexpected" style="width:30px"></span>
            <span class="pr-seg pr-tempo ok" style="width:28px"></span>
          </div>
          <span class="label">Long / unexpected pause</span>
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
            <span class="pr-seg pr-tempo slow" style="width:42px"></span>
          </div>
          <span class="label">Slow word</span>
        </div>
      </div>
      <div class="note">
        Left mini segment = <b>pause before the word</b>. Right bar = <b>word length</b> (tempo).
        <i>Color</i> = status, <i>width</i> = how big the effect is.
      </div>
    </div>
  `;

  // 7. FINAL ASSEMBLY
  // Note the use of .results-flex wrapper to handle the side-by-side sliding animation
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

      <table class="score-table collapsed-score collapsed-error">
        <thead>
          <tr>
            <th id="wordHeader">
              <span class="word-chip clickable">Word</span>
              
              <span id="prosodyLegendToggle" class="tooltip result-tip tip-ProsodyBars" style="margin-left:8px;">
                (?) <span class="tooltiptext">
                  These bars show <b>pause</b> (left) and <b>word length</b> (right). Click to show a quick legend.
                </span>
              </span>

            </th>
            <th ${scoreHeaderAttrs}>
              Score ▸
            </th>
            <th id="errorHeader" class="toggle-col">
              Error ▸
            </th>
            <th id="phonemeHeader">
              <span class="word-chip phoneme-chip clickable" id="phonemeTitle">
                Phoneme
              </span>
            </th>
          </tr>
        </thead>
        <tbody id="resultBody"></tbody>
      </table>
    </div>
  `;
}