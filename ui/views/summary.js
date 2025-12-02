/* ============================================================================
   HYBRID MODULE — SUMMARY VIEW + DETAILED FEEDBACK
   ---------------------------------------------------------------------------
   - Canonical results renderer: ui/views/index.js (lux-results-root)
   - ACTIVE EXPORTS:
       • detailedPhonemeFeedback  (used by render-core / render-modern helpers)
       • showSummary              (called via ui/views/index.js::showSummary)
   - Legacy-only parts: treat everything else as implementation detail until
     we fully port this into a new summary module.
   - Do NOT attach window.* globals here.
============================================================================ */

// ui/views/summary.js


import { norm } from "../../src/data/phonemes/core.js";
import { getPhonemeAssetByIPA } from "../../src/data/phonemes/assets.js";
import {
  phonemeDetailsByIPA,
  articulatorPlacement,
} from "../../src/data/phonemes/details.js";
import { isCorrupt, encouragingLine } from "../../helpers/core.js";

// ---------------------------------------------------------------------------
// Legacy-only shim import (still global-backed for now)
// ---------------------------------------------------------------------------
import { resolveYTLink } from "./deps.js";

export function detailedPhonemeFeedback(issues, maxCount = 5) {
  let html = "";
  const sorted = Object.entries(issues)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, maxCount);

  if (!sorted.length)
    return "<div>No major recurring errors found—great job!</div>";

  sorted.forEach(([sound, obj]) => {
    const key = norm(sound);
    const details = phonemeDetailsByIPA[key] ?? articulatorPlacement[key] ?? {};
    const examples = obj.examples.filter((e) => !isCorrupt(e.word)).slice(0, 2);
    const res = getPhonemeAssetByIPA(key) || {};
    const link = resolveYTLink(res.ipa || sound);
    const exStr = examples.map((e) => `"${e.word}" (${e.score}%)`).join("; ");

    html += `
        <div style="margin-bottom:16px;border-bottom:1px solid #eee;padding-bottom:12px;">
          <b>Sound:</b> <span style="font-size:1.13em;">${
            res.ipa || sound
          }</span><br>
          <span style="color:#777;">Times Detected:</span> ${obj.count}<br>
          <span style="color:#777;">Lowest Score:</span> ${Math.min(
            ...obj.scores
          )}%<br>
          <span style="color:#777;">Examples:</span> ${exStr}<br>
          <span class="ipa"><b>IPA:</b> ${res.ipa || ""}</span><br>
          <span style="color:#205080;"><b>Tip:</b> ${
            details.tip || ""
          }</span><br>
          <span style="color:#963;"><b>Common Mistake:</b> ${
            details.mistake || ""
          }</span><br>
          ${
            res.img
              ? `<img class="mouth-img" src="${res.img}" style="width:120px;margin:6px 0;">`
              : ""
          }
          ${
            res.video
              ? `<br><video src='${res.video}' controls width='180' style='margin-top:6px;border-radius:10px;'></video>`
              : ""
          }
          ${
            link
              ? `<br><span style="color:#31708f;">Recommendation: <a href="${link}" target="_blank" rel="noopener noreferrer">Extra practice video</a></span>`
              : ""
          }
          <br><span style="color:#17823e;font-weight:bold;">${encouragingLine()}</span>
        </div>`;
  });
  return html;
}

export function showSummary({ allPartsResults, currentParts }) {
  const $out = document.getElementById("prettyResult");
  if (!$out) return;

  $out.style.maxHeight = "none";
  $out.style.height = "auto";
  $out.style.overflowY = "visible";

  const issues = {};
  const majorIssues = [];

  (allPartsResults || []).forEach((part, idx) => {
    const nb = part?.NBest?.[0];
    if (!nb) return;
    (nb.Words || []).forEach((w) => {
      if (isCorrupt(w.Word)) return;
      if (w.AccuracyScore != null && w.AccuracyScore < 70) {
        majorIssues.push({
          part: idx + 1,
          word: w.Word,
          score: w.AccuracyScore,
        });
      }
      (w.Phonemes || []).forEach((p) => {
        if (p.AccuracyScore != null && p.AccuracyScore < 85) {
          const key = norm(p.Phoneme);
          if (!issues[key])
            issues[key] = { count: 0, scores: [], examples: [] };
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

  let html = `<b>Summary of All ${
    (currentParts || []).length
  } Parts</b><hr style="margin:12px 0;">`;
  html += `<b>Most Frequent Error Patterns:</b><br>`;
  html += detailedPhonemeFeedback(issues);
  html += `<b>Most Serious Errors:</b><br>`;

  html += worstErrors.length
    ? worstErrors
        .map(
          (err) =>
            `<div>&bull; <b>${err.word}</b> (part ${err.part}): <span style="color:#d43c2c;">${err.score}%</span></div>`
        )
        .join("")
    : `<div>No major issues detected.</div>`;

  $out.innerHTML = html;
  const btn = document.getElementById("showSummaryBtn");
  if (btn) btn.style.display = "none";
}
