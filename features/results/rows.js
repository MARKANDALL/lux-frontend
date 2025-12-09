/* ============================================================================
   ACTIVE MODULE — CANONICAL ROW BUILDER (WORDS + PHONEMES)
   ---------------------------------------------------------------------------
   - Used by ui/views/render-core.js to render the main results table.
   - [Refactored] Logic moved to rows-logic.js. This file is now View-only.
============================================================================ */

import { norm } from "../../src/data/phonemes/core.js";
import { getPhonemeAssetByIPA } from "../../src/data/phonemes/assets.js";
import {
  phonemeDetailsByIPA,
  articulatorPlacement,
} from "../../src/data/phonemes/details.js";
import { buildYouglishUrl } from "../../helpers/core.js";
import { scoreClass } from "../../core/scoring/index.js";

// Logic import
import { calculateWordStats } from "./rows-logic.js";

// View helper imports
import { renderProsodyRibbon } from "./deps.js";

export function buildRows(words, timings, med) {
  return (words || [])
    .map((word, i) => {
      // 1. Calculate Stats (Logic)
      const { 
        penalty, 
        adjScore, 
        errText, 
        rawScore 
      } = calculateWordStats(word, i, timings, med);

      // 2. Render Components (View)
      const ribbon =
        typeof renderProsodyRibbon === "function"
          ? renderProsodyRibbon(i, words, timings, med)
          : "";

      const phonemesHtml = (word.Phonemes || [])
        .map((ph) => {
          const k = norm(ph.Phoneme);
          const res = getPhonemeAssetByIPA(k) || {};
          const details =
            phonemeDetailsByIPA[k] ?? articulatorPlacement[k] ?? {};
          return `
          <span class="tooltip ${scoreClass(ph.AccuracyScore)} phoneme-chip">
            ${res.ipa || ph.Phoneme}
            <span class="tooltiptext">
              ${res.ipa ? `<b>IPA:</b> ${res.ipa}<br>` : ""}
              ${details.tip ? `${details.tip}<br>` : ""}
              ${
                res.img
                  ? `<img src='${res.img}' style='width:110px;margin-top:6px;'>`
                  : ""
              }
              ${
                res.video
                  ? `<br><video src='${res.video}' controls width='280' style='margin-top:6px;border-radius:8px;'></video>`
                  : ""
              }
            </span>
            (${ph.AccuracyScore}%)
          </span>`;
        })
        .join(", ");

      // 3. Assemble Row
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
          <td>${phonemesHtml}</td>
        </tr>`;
    })
    .join("");
}