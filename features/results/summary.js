// features/results/summary.js
/* ============================================================================
   CANONICAL SUMMARY BUILDER (v1.5.0 ATLAS)
   STATUS: LOCKED to Universal Blue/Yellow/Red Schema (80/60)
   ---------------------------------------------------------------------------
============================================================================ */

import { norm } from "../../src/data/phonemes/core.js";
import { isCorrupt } from "../../helpers/core.js";
import { passages } from "../../src/data/passages.js";
import { detailedPhonemeFeedback } from "./summary-feedback.js";

// --- Universal Color Helper (Inlined for safety) ---
function getColorConfig(s) {
  if (s >= 80) return { color: "#2563eb", bg: "#dbeafe" }; // Blue
  if (s >= 60) return { color: "#d97706", bg: "#fef3c7" }; // Yellow
  return { color: "#dc2626", bg: "#fee2e2" }; // Red
}

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
      
      // Word Errors (Updated to < 60% Red Threshold)
      if (w.AccuracyScore != null && w.AccuracyScore < 60) {
        majorIssues.push({
          part: idx + 1,
          word: w.Word,
          score: w.AccuracyScore,
        });
      }

      // Phoneme Errors (85% trigger for coaching)
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

  // 4. Words to Review (UPDATED: Uses Universal Color Schema)
  html += `<h3 style="color:#334155; margin:32px 0 16px 0; font-size:1.3em;">⚠️ Words to Review</h3>`;
  
  if (worstErrors.length) {
    const pills = worstErrors.map(err => {
      const { color, bg } = getColorConfig(err.score);
      // We use the same 'border' color trick as bg but slightly darker for contrast, 
      // or just standard border. Let's keep it clean.
      return `
        <span style="
            background: ${bg}; 
            color: ${color}; 
            padding: 6px 14px; 
            border-radius: 20px; 
            font-weight: 700; 
            font-size: 0.95em;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        ">
           ${err.word} 
           <span style="opacity:0.8; font-weight:400;">(${err.score}%)</span>
           <span style="font-size:0.75em; opacity:0.6; text-transform:uppercase; letter-spacing:0.5px;">Pt ${err.part}</span>
        </span>
      `;
    }).join("");
    
    html += `<div style="display:flex; flex-wrap:wrap; gap:8px;">${pills}</div>`;
  } else {
    // Perfect Blue
    html += `<div style="color:#2563eb; font-style:italic; padding:10px; background:#dbeafe; border-radius:8px;">No word-level scores below 60%. Excellent accuracy!</div>`;
  }

  $out.innerHTML = html;
}