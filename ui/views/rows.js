/* ============================================================================
   ACTIVE MODULE — CANONICAL ROW BUILDER (WORDS + PHONEMES)
   ---------------------------------------------------------------------------
   - Used by ui/views/render-core.js to render the main results table.
   - Pulls truth data from:
       - src/data/phonemes/* (norm, assets, details)
       - core/scoring/index.js (scoreClass, canonical scoring)
   - Still depends on prosody globals via ui/views/deps.js (timings, ribbons).
   - Do NOT move to /legacy while render-core.js imports buildRows(..).
============================================================================ */

import { norm } from "../../src/data/phonemes/core.js";
import { getPhonemeAssetByIPA } from "../../src/data/phonemes/assets.js";
import {
  phonemeDetailsByIPA,
  articulatorPlacement,
} from "../../src/data/phonemes/details.js";
import { isCorrupt, buildYouglishUrl } from "../../helpers/core.js";
import { scoreClass } from "../../core/scoring/index.js";

// ---------------------------------------------------------------------------
// Legacy-only shims + prosody helpers (still global-backed for now)
// ---------------------------------------------------------------------------
import {
  resolveYTLink,
  classifyTempo,
  classifyGap,
  renderProsodyRibbon,
} from "./deps.js";

export function buildRows(words, timings, med) {
  return (words || [])
    .map((word, i) => {
      const err =
        word.ErrorType && word.ErrorType !== "None" ? word.ErrorType : "";

      const t = timings?.[i] || {};
      const prev = timings?.[i - 1] || {};
      const tempo = classifyTempo?.(t.durationSec, med) || "ok";
      const gapCls = i > 0 ? classifyGap?.(prev.end, t.start) || "ok" : "ok";

      const notes = [];
      if (gapCls === "missing") notes.push("missing phrase pause");
      else if (gapCls === "unexpected") notes.push("long pause");
      if (tempo === "fast") notes.push("too fast");
      else if (tempo === "slow") notes.push("too slow");

      const penalty =
        (tempo === "fast" || tempo === "slow" ? 4 : 0) +
        (gapCls === "missing" || gapCls === "unexpected" ? 2 : 0);
      const adj = Math.max(
        0,
        Math.min(100, Math.round((word.AccuracyScore ?? 0) - penalty))
      );
      const errText = [err, ...notes].filter(Boolean).join("; ");

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

      return `
        <tr>
          <td class="word-cell">
            ${ribbon}
            <a href="${buildYouglishUrl(
              word.Word
            )}" target="_blank" rel="noopener noreferrer"
               title="Hear '${word.Word}' on YouGlish" class="${scoreClass(
        word.AccuracyScore
      )}">
              ${word.Word}
            </a>
          </td>
          <td>${
            word.AccuracyScore !== undefined
              ? `${word.AccuracyScore}%` +
                (penalty
                  ? ` <span title="Prosody-adjusted">· adj ${adj}%</span>`
                  : "")
              : "–"
          }</td>
          <td>${errText || ""}</td>
          <td>${phonemesHtml}</td>
        </tr>`;
    })
    .join("");
}
