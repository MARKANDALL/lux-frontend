/* ============================================================================
   CANONICAL ROW BUILDER (WORDS + PHONEMES)
   ---------------------------------------------------------------------------
   - REFACTORED: No longer generates internal tooltips/videos.
   - PURE LAYOUT: Generates "dumb" chips with data-ipa attributes.
   - UPDATED: Added 'tooltip' class back to restore hover animations.
============================================================================ */

import { norm } from "../../src/data/phonemes/core.js";
import { buildYouglishUrl } from "../../helpers/core.js";
import { scoreClass } from "../../core/scoring/index.js";

// Logic import
import { calculateWordStats } from "./rows-logic.js";

// View helper imports
import { renderProsodyRibbon } from "./deps.js";

export function buildRows(words, timings, med) {
  return (words || [])
    .map((word, i) => {
      // 1. Calculate Stats
      const { 
        penalty, 
        adjScore, 
        errText, 
        rawScore 
      } = calculateWordStats(word, i, timings, med);

      // 2. Render Components
      const ribbon =
        typeof renderProsodyRibbon === "function"
          ? renderProsodyRibbon(i, words, timings, med)
          : "";

      // 3. Render Phonemes (CLEAN VERSION)
      // We do NOT render .tooltiptext or <video> here anymore.
      // We just render the trigger chip with data attributes.
      const phonemesHtml = (word.Phonemes || [])
        .map((ph) => {
          // Normalize the IPA symbol so the chips system can find it later
          const ipaRaw = ph.Phoneme;
          const ipaNorm = norm(ipaRaw);
          
          // Color class based on score
          const colorCls = scoreClass(ph.AccuracyScore);
          
          // NOTE: We added 'tooltip' class back so it bulges/darkens on hover
          // per your existing CSS, but we DO NOT put content inside it.
          return `
          <span 
            class="phoneme-chip tooltip ${colorCls}" 
            data-ipa="${ipaNorm}"
            data-score="${ph.AccuracyScore}"
            style="cursor: pointer;"
          >
            ${ipaRaw}
            <span style="font-size: 0.8em; opacity: 0.7; margin-left: 2px;">
                (${ph.AccuracyScore}%)
            </span>
          </span>`;
        })
        .join(" "); 

      // 4. Assemble Row
      return `
        <tr>
          <td class="word-cell">
            ${ribbon}
            <a href="${buildYouglishUrl(word.Word)}" 
               target="_blank" 
               rel="noopener noreferrer"
               title="Hear '${word.Word}' on YouGlish" 
               class="${scoreClass(rawScore)}">
              ${word.Word}
            </a>
          </td>
          <td>${
            word.AccuracyScore !== undefined
              ? `${rawScore}%` +
                (penalty
                  ? ` <span title="Prosody-adjusted">· adj ${adjScore}%</span>`
                  : "")
              : "–"
          }</td>
          <td>${errText || ""}</td>
          <td>
            <div style="display:flex; flex-wrap:wrap; gap:6px; justify-content:center;">
              ${phonemesHtml}
            </div>
          </td>
        </tr>`;
    })
    .join("");
}