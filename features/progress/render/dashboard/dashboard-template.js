// features/progress/render/dashboard/dashboard-template.js
// ONE-LINE: Builds the Progress dashboard HTML string using the unified card components.

import { renderTroubleSection } from '../../../../ui/components/trouble-chips.js';
import { renderCardRow } from '../../../../ui/components/lux-card.js';

import { fmtDate, fmtScoreCefr, titleFromPassageKey, esc } from '../format.js';
import { sparklineSvg } from '../sparkline.js';
import { renderMetricTrendCard } from './actions-and-trends.js';

export function buildProgressDashboardHtml({
  model,
  title,
  subtitle,
  showActions,
  showCoach,
  showNextPractice,
  showMetricTrends,
  totals,
  trouble,
  trend,
  sessions,
  topPh,
  topWd,
  nextPracticePlan,
}) {
  // ── Header + action buttons ──
  const actionsHtml = showActions
    ? `
      <div class="lux-progress-actions">
        <button class="lux-pbtn" id="luxGenerateNextPractice" data-lux-generate-next>
          ✨ Next conversation
        </button>
        <button class="lux-pbtn lux-pbtn--ghost" id="luxOpenWordCloud">
          ☁️ Cloud Visuals
        </button>
        <button class="lux-pbtn" id="luxDownloadReport">Download report</button>
        <button class="lux-pbtn lux-pbtn--ghost" id="luxDownloadTrouble">Download troubleshooting report</button>
      </div>
    `
    : '';

  // ── Summary strip ──
  const avgScore = totals.avgScore ?? 0;
  const summaryHtml = `
    <div class="lux-progress-cards">
      <div class="lux-pcard">
        <div class="lux-pcard-label">Recordings</div>
        <div class="lux-pcard-value">${totals.attempts ?? 0}</div>
      </div>

      <div class="lux-pcard">
        <div class="lux-pcard-label">Average score</div>
        <div class="lux-pcard-value">${fmtScoreCefr(avgScore)}</div>
        <div class="lux-pcard-mini">Last activity: ${fmtDate(totals.lastTS)}</div>
      </div>

      <div class="lux-pcard">
        <div class="lux-pcard-label">Trend (last 30 days)</div>
        ${sparklineSvg(trend)}
        <div class="lux-pcard-mini">Tap sections below for details</div>
      </div>
    </div>
  `;

  // ── Score trends by category (All Data page only) ──
  const metricTrendsHtml =
    showMetricTrends && model?.metrics
      ? `
      <details class="lux-progress-sec" open>
        <summary>Score trends (by category)</summary>
        <div class="lux-sec-body">
          <div class="lux-metricTrendsGrid">
            ${renderMetricTrendCard(model.metrics.acc)}
            ${renderMetricTrendCard(model.metrics.flu)}
            ${renderMetricTrendCard(model.metrics.comp)}
            ${renderMetricTrendCard(model.metrics.pron)}
          </div>
          <div class="lux-metricTrendsNote">
            Prosody trend will be added once we store/compute it.
          </div>
        </div>
      </details>
      `
      : '';

  // ── Trouble Sounds (using shared component) ──
  const troubleSoundsHtml = `
    <details class="lux-progress-sec">
      <summary>Trouble Sounds <span style="color:#94a3b8; font-weight:800">${
        (trouble.phonemesAll || []).length
      }</span></summary>
      <div class="lux-sec-body">
        ${renderTroubleSection('sounds', topPh, { max: 12 })}
      </div>
    </details>
  `;

  // ── Trouble Words (using shared component) ──
  const troubleWordsHtml = `
    <details class="lux-progress-sec">
      <summary>Trouble Words <span style="color:#94a3b8; font-weight:800">${
        (trouble.wordsAll || []).length
      }</span></summary>
      <div class="lux-sec-body">
        ${renderTroubleSection('words', topWd, { max: 12 })}
      </div>
    </details>
  `;

  // ── History (using shared card rows) ──
  const historyRows = sessions
    .slice(0, 12)
    .map((s) => renderCardRow(s))
    .join('');

  const historyHtml = `
    <details class="lux-progress-sec">
      <summary>History</summary>
      <div class="lux-sec-body">
        <div class="lux-history" style="display:flex; flex-direction:column; gap:8px;">
          ${historyRows || '<div style="color:#64748b">No sessions yet.</div>'}
        </div>
      </div>
    </details>
  `;

  // ── AI Coach (optional, All Data page) ──
  const coachHtml = showCoach
    ? `
      <details id="aiCoachDrawer" class="lux-progress-drawer lux-ai-drawer">
        <summary class="lux-progress-drawer-summary">
          <div class="lux-progress-drawer-left">
            <div class="lux-progress-drawer-title">AI Coach</div>
            <div class="lux-progress-drawer-mini">
              <span class="lux-mini-open">Hide AI Coach</span>
              <span class="lux-mini-closed">Show AI Coach?</span>
            </div>
          </div>
          <div class="lux-progress-drawer-right">
            <span class="lux-progress-drawer-chev" aria-hidden="true">▾</span>
          </div>
        </summary>
        <div class="lux-progress-drawer-body">
          <div id="aiFeedbackSection">
            <div id="aiFeedback"></div>
          </div>
        </div>
      </details>
      `
    : '';

  // ── Assemble ──
  return `
    <a id="lux-my-progress"></a>
    <section class="lux-progress-shell">
      <div class="lux-progress-head">
        <div>
          <h2 class="lux-progress-title">${esc(title)}</h2>
          <div class="lux-progress-sub">${esc(subtitle)}</div>
        </div>
        ${actionsHtml}
      </div>

      ${summaryHtml}
      ${metricTrendsHtml}
      ${troubleSoundsHtml}
      ${troubleWordsHtml}
      ${historyHtml}
      ${coachHtml}
    </section>
  `;
}