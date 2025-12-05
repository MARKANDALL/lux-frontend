/* ============================================================================
   CANONICAL SUMMARY BUILDER
   ---------------------------------------------------------------------------
   - Aggregates results from all passage parts.
   - Identifies top error patterns (phonemes) and specific worst words.
   - Renders the "Gold Standard" summary with:
       1. Phoneme Stats
       2. Embedded Video Players (mouth shape)
       3. "Extra Practice" Links (YouTube/YouGlish)
       4. "Book a Lesson" Placeholders (Freemium Upsell)
   - Do NOT attach window.* globals here.
============================================================================ */

import { norm } from "../../src/data/phonemes/core.js";
import { getPhonemeAssetByIPA } from "../../src/data/phonemes/assets.js";
import {
  phonemeDetailsByIPA,
  articulatorPlacement,
} from "../../src/data/phonemes/details.js";
import { isCorrupt, encouragingLine } from "../../helpers/core.js";
import { resolveYTLink } from "./deps.js";

/**
 * Generates the rich HTML for the "Most Frequent Error Patterns" section.
 * Includes Stats, Tips, Mouth Videos, and External Links.
 */
export function detailedPhonemeFeedback(issues, maxCount = 5) {
  let html = "";
  
  // Sort by frequency (most missed first)
  const sorted = Object.entries(issues)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, maxCount);

  if (!sorted.length) {
    return "<div style='padding:10px; color:#059669;'>No major recurring errors found—great job!</div>";
  }

  sorted.forEach(([sound, obj]) => {
    const key = norm(sound);
    const details = phonemeDetailsByIPA[key] ?? articulatorPlacement[key] ?? {};
    const asset = getPhonemeAssetByIPA(key) || {};
    
    // Links
    const ytUrl = resolveYTLink(asset.ipa || sound); // Specific video if mapped, or generic channel link
    
    // Example words string
    const examples = obj.examples
        .filter((e) => !isCorrupt(e.word))
        .slice(0, 3); // Show top 3 examples
    const exStr = examples.map((e) => `<span style="white-space:nowrap;">"${e.word}" (${e.score}%)</span>`).join("; ");

    html += `
        <div style="
            margin-bottom: 24px; 
            padding: 16px; 
            border: 1px solid #e2e8f0; 
            border-radius: 12px; 
            background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        ">
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:8px;">
             <h3 style="margin:0; font-size:1.25em; color:#0f172a;">
               Sound: <span style="font-family:serif; background:#f1f5f9; padding:2px 8px; border-radius:4px;">${asset.ipa || sound}</span>
             </h3>
             <span style="font-size:0.9em; color:#64748b; font-weight:600;">
               Missed ${obj.count} times
             </span>
          </div>

          <div style="font-size:0.95em; color:#475569; margin-bottom:12px; line-height:1.6;">
             <div><b>Lowest Score:</b> <span style="color:#d43c2c; font-weight:700;">${Math.min(...obj.scores)}%</span></div>
             <div><b>Examples:</b> ${exStr || "(none)"}</div>
          </div>

          <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid #f1f5f9; margin-bottom:12px;">
             ${details.tip ? `<div style="margin-bottom:6px;"><strong style="color:#0369a1;">💡 Tip:</strong> ${details.tip}</div>` : ""}
             ${details.mistake ? `<div><strong style="color:#b91c1c;">⚠️ Common Mistake:</strong> ${details.mistake}</div>` : ""}
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:16px; align-items:start; margin-top:12px;">
             
             ${asset.video ? `
               <div style="flex:0 0 auto;">
                 <video src="${asset.video}" controls width="200" style="border-radius:8px; display:block; background:#000; box-shadow:0 2px 5px rgba(0,0,0,0.1);"></video>
                 <div style="text-align:center; font-size:0.8em; color:#64748b; margin-top:4px;">Mouth Shape Demo</div>
               </div>
             ` : ""}

             <div style="flex:1; min-width:200px; display:flex; flex-direction:column; gap:8px;">
                
                ${ytUrl ? `
                  <a href="${ytUrl}" target="_blank" rel="noopener noreferrer" style="
                      display:inline-flex; align-items:center; gap:6px;
                      text-decoration:none; color:#2563eb; font-weight:600; font-size:0.95em;
                  ">
                    <span>📺 Watch Deep Dive Lesson on /${asset.ipa || sound}/</span>
                  </a>
                ` : ""}

                <a href="https://calendly.com/mark-lux/pronunciation-coaching?note=focus_${sound}" target="_blank" rel="noopener noreferrer" style="
                    display:inline-block; 
                    padding:8px 12px; 
                    background:#f0fdf4; 
                    border:1px solid #bbf7d0; 
                    color:#166534; 
                    border-radius:6px; 
                    font-weight:700; 
                    font-size:0.9em; 
                    text-decoration:none;
                    margin-top:4px;
                ">
                   🎓 Book a 1-on-1 Coaching Session for /${asset.ipa || sound}/
                </a>

             </div>
          </div>

          <div style="margin-top:14px; padding-top:10px; border-top:1px solid #e2e8f0; font-size:0.95em; font-weight:bold; color:#059669; text-align:center;">
             ${encouragingLine()}
          </div>

        </div>`;
  });
  return html;
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
    <div style="text-align:center; margin-bottom:20px;">
      <h2 style="margin:0 0 8px 0; color:#1e293b;">Passage Summary</h2>
      <div style="color:#64748b; font-size:1.1em;">Analysis of all ${(currentParts || []).length} parts</div>
    </div>
  `;

  // 1. Detailed Phoneme Cards
  html += `<h3 style="color:#334155; margin-bottom:12px;">🎯 Priority Focus Areas (Phonemes)</h3>`;
  html += detailedPhonemeFeedback(issues);

  // 2. Word List (Serious Errors)
  html += `<h3 style="color:#334155; margin:24px 0 12px 0;">⚠️ Words to Review</h3>`;
  html += worstErrors.length
    ? `<div style="display:flex; flex-wrap:wrap; gap:8px;">` + 
      worstErrors
        .map(
          (err) =>
            `<span style="
                background:#fef2f2; 
                border:1px solid #fecaca; 
                padding:4px 10px; 
                border-radius:20px; 
                color:#991b1b; 
                font-weight:600; 
                font-size:0.95em;
            ">
               ${err.word} (${err.score}%) <span style="font-weight:400; opacity:0.8; font-size:0.9em;">Pt ${err.part}</span>
            </span>`
        )
        .join("") + `</div>`
    : `<div style="color:#059669; font-style:italic;">No word-level scores below 70%. Excellent accuracy!</div>`;

  $out.innerHTML = html;
  
  // Hide the summary button now that we've shown it
  const btn = document.getElementById("showSummaryBtn");
  if (btn) btn.style.display = "none";
}