// features/progress/attempt-detail/attempts-section.js
// Builds the "Attempts in this session" section for the Attempt Details modal.

import { esc } from "../progress-utils.js";
import { pickTS, pickSummary } from "../attempt-pickers.js";
import { fmtDateTime } from "./format.js";
import { attemptMetric } from "./metrics.js";

export function buildAttemptsListSection(list, { maxItems = 20 } = {}) {
  const attemptsCount = Array.isArray(list) ? list.length : 0;

  // Attempts list (collapsed)
  const attemptsWrap = document.createElement("div");
  attemptsWrap.style.cssText = "border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px;";
  attemptsWrap.innerHTML = `
    <details>
      <summary style="cursor:pointer; font-weight:900; color:#334155;">🕘 Attempts in this session (${attemptsCount})</summary>
      <div style="margin-top:10px;"></div>
    </details>
  `;

  const attemptsBody = attemptsWrap.querySelector("details > div");

  (list || []).slice(0, maxItems).forEach((a) => {
    const ts = pickTS(a);
    const sum = pickSummary(a) || {};
    const pron = attemptMetric(a, "pron");
    const acc = attemptMetric(a, "acc");
    const flu = attemptMetric(a, "flu");
    const pros = attemptMetric(a, "pros");
    const text = String(a?.text || "").trim();

    const pills = [];
    if (pron != null) pills.push(`Pron ${Math.round(pron)}`);
    if (acc != null) pills.push(`Acc ${Math.round(acc)}`);
    if (flu != null) pills.push(`Flu ${Math.round(flu)}`);
    if (pros != null) pills.push(`Pro ${Math.round(pros)}`);

    const item = document.createElement("div");
    item.style.cssText =
      "background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px; margin-bottom:10px;";
    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
        <div style="font-weight:900; color:#334155;">${esc(fmtDateTime(ts))}</div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${pills
            .map(
              (t) =>
                `<span style="background:#fff; border:1px solid #e2e8f0; border-radius:999px; padding:3px 8px; font-weight:900; color:#475569; font-size:0.82rem;">${esc(
                  t
                )}</span>`
            )
            .join("")}
        </div>
      </div>
      ${
        text
          ? `<details style="margin-top:8px;">
              <summary style="cursor:pointer; font-weight:900; color:#334155;">📝 Text</summary>
              <div style="margin-top:8px; color:#475569; line-height:1.45;">${esc(text)}</div>
            </details>`
          : ""
      }
    `;

    attemptsBody.appendChild(item);
  });

  return attemptsWrap;
}
