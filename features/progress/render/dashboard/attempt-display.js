// features/progress/render/dashboard/attempt-display.js
// Attempt -> UI helper renderers for the Progress dashboard History details.

import { esc } from "../format.js";
import { pickAzure, pickSummary, pickTS } from "./attempt-utils.js";

export function renderAiFeedback(sum) {
  const secs =
    sum?.ai_feedback?.sections ||
    sum?.ai_feedback?.Sections ||
    sum?.aiFeedback?.sections ||
    sum?.sections ||
    [];
  if (!Array.isArray(secs) || !secs.length) return "";
  return `
      <details class="lux-hdetail-ai">
        <summary>🤖 Saved AI feedback (${secs.length})</summary>
        <div class="lux-hdetail-ai-body">
          ${secs
            .map((sec) => {
              const title = sec?.title || sec?.heading || "";
              const bullets = sec?.bullets || sec?.items || sec?.points || [];
              return `
              <div class="lux-ai-sec">
                ${title ? `<div class="lux-ai-sec-title">${esc(title)}</div>` : ``}
                ${
                  Array.isArray(bullets) && bullets.length
                    ? `
                  <ul class="lux-ai-bullets">
                    ${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}
                  </ul>
                `
                    : ``
                }
              </div>
            `;
            })
            .join("")}
        </div>
      </details>
    `;
}

export function attemptPills(a) {
  const sum = pickSummary(a) || {};
  const az = pickAzure(a);
  const nb = az?.NBest?.[0] || az?.nBest?.[0] || null;
  const pa =
    nb?.PronunciationAssessment ||
    nb?.pronunciationAssessment ||
    az?.PronunciationAssessment ||
    null;

  const pills = [];
  const pron = sum?.pron ?? nb?.PronScore ?? pa?.PronScore;
  const acc = sum?.acc ?? pa?.AccuracyScore;
  const flu = sum?.flu ?? pa?.FluencyScore;
  const pro = sum?.pros ?? sum?.pro ?? pa?.ProsodyScore;

  if (pron != null) pills.push(`Pron ${Math.round(Number(pron))}`);
  if (acc != null) pills.push(`Acc ${Math.round(Number(acc))}`);
  if (flu != null) pills.push(`Flu ${Math.round(Number(flu))}`);
  if (pro != null) pills.push(`Pro ${Math.round(Number(pro))}`);

  return pills.map((t) => `<span class="lux-mini-pill">${esc(t)}</span>`).join("");
}

export function attemptOverallScore(a) {
  const sum = pickSummary(a) || {};
  if (sum.pron != null) return Number(sum.pron) || 0;

  const az = pickAzure(a);
  const v = az?.NBest?.[0]?.PronScore;
  return Number(v) || 0;
}

export function attemptDateStr(a) {
  const ts = pickTS(a);
  const d = new Date(ts || Date.now());
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
