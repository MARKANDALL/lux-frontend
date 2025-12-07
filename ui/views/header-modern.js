/* ============================================================================
   MODERN HEADER BUILDER — CANONICAL SCORING RESTORED
   ---------------------------------------------------------------------------
   - Uses core/scoring/index.js for authoritative score extraction.
   - RESTORES the full "Your Results" dashboard (Prosody, Accuracy, etc.)
     that was present in the legacy header.
   - Retains the modern table structure.
   - Reconnects global speaking rate logic for the "w/s" metric.
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
  Prosody: "Stress, intonation, rhythm, and pacing. Captures phrasing, word stress, and natural flow.",
  Content: "Vocabulary, Grammar, and Topic scoring."
};

/**
 * renderResultsHeaderModern
 * -------------------------
 * Returns HTML for the main results header (Score Chips) + table shell.
 * Now fully populated with the metrics you were missing.
 */
export function renderResultsHeaderModern(data) {
  // 1. SCORING LOGIC: Connect to existing core logic
  let scores = getAzureScores(data);
  
  // Fallback if Azure data is partial/mock
  if (scores.accuracy == null) {
    const fb = deriveFallbackScores(data);
    scores = { ...scores, ...fb };
  }

  const { accuracy, fluency, completeness, overall, prosody, content, nbest } = scores;

  // 2. SPEAKING RATE: Reconnect to global prosody calculator if available
  let rateStr = "";
  if (typeof globalThis.getSpeakingRate === "function") {
      const rate = globalThis.getSpeakingRate(data);
      if (rate && Number.isFinite(rate.wps)) {
          rateStr = ` • ~${rate.wps.toFixed(1)} w/s`;
      }
  }

  // 3. CHIP RENDERER: Recreates the exact look of the old "Score Chips"
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

  // 4. CONTENT SLOT: (Vocab/Grammar)
  let contentHtml = `<span style="margin-right:4px;">Content: –</span>`;
  if (content && (content.vocab || content.grammar)) {
      const parts = [];
      if (content.vocab) parts.push(`Vocab: ${fmtPct(content.vocab)}`);
      if (content.grammar) parts.push(`Grammar: ${fmtPct(content.grammar)}`);
      if (content.topic) parts.push(`Topic: ${fmtPct(content.topic)}`);
      contentHtml = `<span style="margin-right:4px;">Content: ${parts.join(" | ")}</span>`;
  }

  // 5. "WHAT YOU SAID" TEXT
  const saidText = data?.DisplayText || nbest?.Display || "(No speech detected)";

  // 6. HEADER ATTRIBUTES (For the "Score" column collapse color)
  const headerScoreClass = overall != null ? scoreClass(overall) : "";
  const scoreHeaderAttrs = [
    'id="scoreHeader"',
    `class="toggle-col ${headerScoreClass}"`,
    `data-overall-score="${overall || 0}"`
  ].join(" ");

  // 7. FINAL ASSEMBLY
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

    <table class="score-table collapsed-score collapsed-error">
      <thead>
        <tr>
          <th id="wordHeader">
            <span class="word-chip clickable">Word</span>
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
  `;
}