// ui/views/summary.js
/* ============================================================================
   CANONICAL SUMMARY BUILDER (v1.5.0 ATLAS)
   ---------------------------------------------------------------------------
   - Aggregates results from all passage parts.
   - Identifies top error patterns (phonemes) and specific worst words.
   - Renders the "Gold Standard" summary with the video reference restored.
   - [Refactored] Feedback card generation moved to summary-feedback.js
============================================================================ */

import { norm } from "../../src/data/phonemes/core.js";
import { isCorrupt } from "../../helpers/core.js";
import { passages } from "../../src/data/passages.js";
import { detailedPhonemeFeedback } from "./summary-feedback.js";

/**
 * Main Entry Point: Renders the Summary to #prettyResult.
 * Called by summary-shell.js
 */
export function showSummary({ allPartsResults, currentParts }) {
  const $out = document.getElementById("prettyResult");
  if (!$out) return;

  $out.style.maxHeight = "none";
  $out.style.height = "auto";
  $out.style.overflowY = "visible";

  // 1. Resolve Passage Data for Golden Standard Video
  const passageKey = allPartsResults?.[0]?.passage_key || "rainbow"; 
  const passageData = passages[passageKey];
  const youtubeId = passageData?.youtubeId;

  const issues = {};
  const majorIssues = [];

  // Aggregate stats across all parts
  (allPartsResults || []).forEach((part, idx) => {
    const nb = part?.NBest?.[0];
    if (!nb) return;
    
    (nb.Words || []).forEach((w) => {
      if (isCorrupt(w.Word)) return;
      
      // Word Errors
      if (w.AccuracyScore != null && w.AccuracyScore < 70) {
        majorIssues.push({
          part: idx + 1,
          word: w.Word,
          score: w.AccuracyScore,
        });
      }

      // Phoneme Errors
      (w.Phonemes || []).forEach((p) => {
        if (p.AccuracyScore != null && p.AccuracyScore < 85) {
          const key = norm(p.Phoneme);
          if (!issues[key]) issues[key] = { count: 0, scores: [], examples: [] };
          
          issues[key].count++;
          issues[key].scores.push(p.AccuracyScore);
          issues[key].examples.push({
            word: w.Word,
            part: idx + 1,
            score: p.AccuracyScore,
          });
        }
      });
    });
  });

  const worstErrors = majorIssues.filter((e) => !isCorrupt(e.word)).slice(0, 5);

  let html = `
    <div style="text-align:center; margin-bottom:24px;">
      <h2 style="margin:0 0 8px 0; color:#1e293b; font-size: 2rem;">Passage Summary</h2>
      <div style="color:#64748b; font-size:1.1em;">Analysis of all ${(currentParts || []).length} parts</div>
    </div>
  `;

  // === 2. THE GOLDEN STANDARD ACCORDION ===
  if (youtubeId) {
    html += `
      <details style="
        margin-bottom: 32px;
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      ">
        <summary style="
          padding: 16px 20px;
          cursor: pointer;
          font-weight: 700;
          color: #0f172a;
          list-style: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
        ">
          <span style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:1.2em">📺</span> 
            Reference: Hear Native Speaker
          </span>
          <span style="font-size: 0.8em; opacity: 0.6;">▼</span>
        </summary>
        <div style="padding: 0 16px 16px 16px; background:#fff;">
          <div style="margin-top:16px; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px; border:1px solid #e2e8f0;">
            <iframe 
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" 
              src="https://www.youtube.com/embed/${youtubeId}" 
              title="YouTube video player" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen>
            </iframe>
          </div>
          <div style="margin-top:12px; font-size: 0.9em; color: #64748b; text-align: center; font-style:italic;">
            Compare your rhythm, melody, and pacing to this reference.
          </div>
        </div>
      </details>
    `;
  }

  // 3. Priority Focus Areas (Phonemes)
  html += `<h3 style="color:#334155; margin-bottom:16px; font-size:1.3em;">🎯 Priority Focus Areas (Phonemes)</h3>`;
  html += detailedPhonemeFeedback(issues);

  // 4. Words to Review
  html += `<h3 style="color:#334155; margin:32px 0 16px 0; font-size:1.3em;">⚠️ Words to Review</h3>`;
  html += worstErrors.length
    ? `<div style="display:flex; flex-wrap:wrap; gap:8px;">` + 
      worstErrors
        .map(
          (err) =>
            `<span style="
                background:#fef2f2; 
                border:1px solid #fecaca; 
                padding:6px 14px; 
                border-radius:20px; 
                color:#991b1b; 
                font-weight:600; 
                font-size:0.95em;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            ">
               ${err.word} (${err.score}%) <span style="font-weight:400; opacity:0.7; font-size:0.85em; margin-left:4px;">Pt ${err.part}</span>
            </span>`
        )
        .join("") + `</div>`
    : `<div style="color:#059669; font-style:italic; padding:10px; background:#f0fdf4; border-radius:8px; border:1px solid #bbf7d0;">No word-level scores below 70%. Excellent accuracy!</div>`;

  $out.innerHTML = html;
}