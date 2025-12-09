// ui/views/summary-feedback.js
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
                 <video src="${asset.video}" controls playsinline preload="none" style="width:100%; border-radius:8px; background:#000; box-shadow:0 2px 5px rgba(0,0,0,0.1);"></video>
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