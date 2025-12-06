/* ============================================================================
   CANONICAL SUMMARY BUILDER (v1.5.0 ATLAS)
   ---------------------------------------------------------------------------
   - Aggregates results from all passage parts.
   - Identifies top error patterns (phonemes) and specific worst words.
   - Renders the "Gold Standard" summary with the video reference restored.
   - Includes all 10 Data Points (Sound, Stats, Tips, Video, Links, etc.)
============================================================================ */

import { norm } from "../../src/data/phonemes/core.js";
import { getPhonemeAssetByIPA } from "../../src/data/phonemes/assets.js";
import {
  phonemeDetailsByIPA,
  articulatorPlacement,
} from "../../src/data/phonemes/details.js";
import { isCorrupt, encouragingLine } from "../../helpers/core.js";
import { resolveYTLink } from "./deps.js";
import { passages } from "../../src/data/passages.js"; 

/**
 * Generates the rich HTML for the "Most Frequent Error Patterns" section.
 * Includes Stats, Tips, Mouth Videos, and External Links (10 Data Points).
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
    // 1. The Sound & 5. IPA
    const key = norm(sound);
    const details = phonemeDetailsByIPA[key] ?? articulatorPlacement[key] ?? {};
    const asset = getPhonemeAssetByIPA(key) || {};
    
    // 9. Recommendation Link (Deep Dive)
    const ytUrl = resolveYTLink(asset.ipa || sound); 
    
    // 4. Examples (Top 3)
    const examples = obj.examples
        .filter((e) => !isCorrupt(e.word))
        .slice(0, 3);
    const exStr = examples.map((e) => `<span style="white-space:nowrap; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${e.word} (${e.score}%)</span>`).join(" ");

    // 10. Encouragement (Random line)
    const encouragement = encouragingLine ? encouragingLine() : "Keep practicing, you're improving!";

    html += `
        <div style="
            margin-bottom: 24px; 
            padding: 20px; 
            border: 1px solid #e2e8f0; 
            border-radius: 12px; 
            background: #fff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        ">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:12px;">
             <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.8em; font-weight:800; color:#0f172a;">/${asset.ipa || sound}/</span>
                <span style="font-size:0.9em; color:#64748b; background:#f8fafc; padding:2px 8px; border-radius:12px; border:1px solid #e2e8f0;">Sound</span>
             </div>
             <div style="text-align:right;">
                <div style="font-size:0.9em; color:#64748b;"><strong>${obj.count}</strong> detections</div>
                <div style="font-size:0.9em; color:#ef4444;">Lowest: <strong>${Math.min(...obj.scores)}%</strong></div>
             </div>
          </div>

          <div style="margin-bottom:16px;">
             <div style="font-size:0.85em; text-transform:uppercase; color:#94a3b8; font-weight:700; margin-bottom:4px;">Problem Words</div>
             <div style="color:#334155; line-height:1.6;">${exStr || "No specific words captured."}</div>
          </div>

          <div style="background:#f8fafc; padding:16px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:16px;">
             ${details.tip ? `<div style="margin-bottom:8px;"><strong style="color:#0369a1;">💡 Tip:</strong> <span style="color:#334155;">${details.tip}</span></div>` : ""}
             ${details.mistake ? `<div><strong style="color:#b91c1c;">⚠️ Trap:</strong> <span style="color:#334155;">${details.mistake}</span></div>` : ""}
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:20px; align-items:flex-start;">
             
             ${asset.video ? `
               <div style="flex:0 0 auto; width:140px;">
                 <video src="${asset.video}" muted loop autoplay playsinline style="width:100%; border-radius:8px; background:#000; box-shadow:0 2px 5px rgba(0,0,0,0.1);"></video>
                 <div style="text-align:center; font-size:0.75em; color:#64748b; margin-top:4px;">Mouth Position</div>
               </div>
             ` : ""}

             <div style="flex:1; min-width:200px; display:flex; flex-direction:column; gap:10px;">
                
                ${ytUrl ? `
                  <a href="${ytUrl}" target="_blank" rel="noopener noreferrer" style="
                      display:flex; align-items:center; gap:8px;
                      padding: 10px; background:#eff6ff; border:1px solid #bfdbfe;
                      border-radius:8px; text-decoration:none; transition:transform 0.1s;
                  ">
                    <span style="font-size:1.2em;">📺</span>
                    <div>
                        <div style="font-weight:700; color:#1d4ed8; font-size:0.95em;">Watch Deep Dive Lesson</div>
                        <div style="font-size:0.8em; color:#60a5fa;">Detailed walkthrough of /${asset.ipa || sound}/</div>
                    </div>
                  </a>
                ` : ""}

                <a href="https://calendly.com/mark-lux/pronunciation-coaching?note=focus_${sound}" target="_blank" rel="noopener noreferrer" style="
                    display:flex; align-items:center; gap:8px;
                    padding: 10px; background:#f0fdf4; border:1px solid #bbf7d0;
                    border-radius:8px; text-decoration:none; transition:transform 0.1s;
                ">
                   <span style="font-size:1.2em;">🎓</span>
                   <div>
                        <div style="font-weight:700; color:#15803d; font-size:0.95em;">Book 1-on-1 Coaching</div>
                        <div style="font-size:0.8em; color:#4ade80;">Master this sound with an expert</div>
                   </div>
                </a>
             </div>
          </div>

          <div style="margin-top:16px; padding-top:12px; border-top:1px dashed #e2e8f0; font-size:0.9em; font-weight:600; color:#059669; text-align:center; font-style:italic;">
             "${encouragement}"
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
  
  // --- TEMPORARY FIX: Button stays visible ---
  // const btn = document.getElementById("showSummaryBtn");
  // if (btn) btn.style.display = "none";
}