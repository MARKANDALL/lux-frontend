// features/progress/attempt-detail/header.js
// Builds the header element for Attempt Details modal (Session Report top area).

import { esc, getColorConfig, mean } from "../progress-utils.js";

export function buildAttemptDetailHeader({
  title,
  mode,
  attemptsCount,
  tsMin,
  tsMax,
  fmtDateTime,
  sid,
  isNoSess,
  dayGroup,
  pronAvg,
  list,
  attemptMetric,
  confidenceLabel,
  confidenceHint,
  nextActions,
  isConvo,
} = {}) {
  const bigScoreColor = getColorConfig(pronAvg).color;

  // Scores (session averages)
  const accAvg = mean((list || []).map((a) => attemptMetric(a, "acc")));
  const fluAvg = mean((list || []).map((a) => attemptMetric(a, "flu")));
  const compAvg = mean((list || []).map((a) => attemptMetric(a, "comp")));
  const prosAvg = mean((list || []).map((a) => attemptMetric(a, "pros")));

  const fmtRoundPct = (v) =>
    v == null || !Number.isFinite(+v) ? "—" : `${Math.round(+v)}%`;

  // New: overall aggregate circle for the modal
  const overallAgg = mean([accAvg, fluAvg, compAvg, prosAvg, pronAvg]);
  const overallColor = getColorConfig(overallAgg).color;

  const tileKV = (label, val) => `
    <div class="lux-scoreTile">
      <div class="lux-scoreTile-label">${esc(label)}</div>
      <div class="lux-scoreTile-value">${fmtRoundPct(val)}</div>
    </div>
  `;

  function pillKV(label, val) {
    return `
      <div style="background:#f8fafc; padding:8px; border-radius:8px; text-align:center;">
        <div style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">${esc(
          label
        )}</div>
        <div style="font-weight:800; color:#334155;">${val}</div>
      </div>
    `;
  }

  const header = document.createElement("div");
  header.innerHTML = `
    <div style="text-align:center; margin-bottom: 14px;">
      <h3 style="margin:0; color:#1e293b; font-size:1.25rem;">Session Report</h3>
      <div style="margin-top:6px; font-weight:900; color:#334155;">${esc(title)}</div>
      <p style="margin:6px 0 0; color:#64748b; font-size:0.92rem;">
        ${esc(mode)} · ${attemptsCount} attempt${attemptsCount === 1 ? "" : "s"}
      </p>

      <div style="margin-top:10px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
<button id="luxPracticeAgainBtn" data-lux-generate-next
  style="border:1px solid #cbd5e1; background:#fff; padding:8px 12px; border-radius:10px; font-weight:900; cursor:pointer; color:#0f172a;">
  ✨ Next conversation
</button>

        ${
          isConvo
            ? `<button id="luxChooseScenarioBtn"
                style="border:1px solid #e2e8f0; background:#f8fafc; padding:8px 12px; border-radius:10px; font-weight:900; cursor:pointer; color:#334155;">
                🗂️ Choose scenario
              </button>`
            : ``
        }
      </div>

      <p style="margin:6px 0 0; color:#64748b; font-size:0.9rem;">
        ${esc(fmtDateTime(tsMin))} → ${esc(fmtDateTime(tsMax))}
      </p>

      <p style="margin:6px 0 0; color:#64748b; font-size:0.9rem; font-weight:900;">
        Confidence: ${esc(confidenceLabel)}
        <span style="color:#94a3b8; font-weight:800;">· ${esc(confidenceHint)}</span>
      </p>

      <p style="margin:6px 0 0; color:#94a3b8; font-size:0.85rem; font-weight:800;">
        ${
          sid
            ? isNoSess
              ? `Grouped by day (no session id): ${esc(dayGroup)}`
              : `Session: ${esc(sid)}`
            : ""
        }
      </p>
    </div>

    <div class="lux-scoreSummary lux-scoreSummary--pyramid" style="margin-bottom:14px;">
      <div class="lux-scoreMain">
        <div class="lux-scoreMainLabel">Overall</div>
<div class="lux-scoreRing lux-scoreRing--overall" style="--lux-score-ring:${overallColor};">
          ${fmtRoundPct(overallAgg)}
        </div>
      </div>

      <div class="lux-scorePyramid">
        <div class="lux-scoreRow lux-scoreRow-mid">
          ${tileKV("Prosody", prosAvg)}
          ${tileKV("Pronunciation", pronAvg)}
        </div>
        <div class="lux-scoreRow lux-scoreRow-bottom">
          ${tileKV("Accuracy", accAvg)}
          ${tileKV("Fluency", fluAvg)}
          ${tileKV("Completeness", compAvg)}
        </div>
      </div>
    </div>

    <div style="border-top:1px solid #e2e8f0; padding-top: 12px;">
      <h4 style="margin:0 0 10px 0; font-size:0.95rem; color:#334155;">✅ What to do next</h4>
      <ul style="margin:0; padding-left:18px; color:#475569; line-height:1.55;">
        ${(nextActions || []).map((x) => `<li style="margin-bottom:6px;">${x}</li>`).join("")}
      </ul>
    </div>
  `;

  const againBtn = header.querySelector("#luxPracticeAgainBtn");
  const chooseBtn = header.querySelector("#luxChooseScenarioBtn");

  return { header, againBtn, chooseBtn };
}
