// features/progress/render/dashboard/actions-and-trends.js
// ONE-LINE: Dashboard action-button wiring + metric trend card renderer.

// Dashboard action-button wiring + metric trend card renderer.



import { esc } from "../format.js";
import { sparklineSvg } from "../sparkline.js";
import { downloadBlob } from "../export.js";
import { fmtPctCefr } from "../../../../core/scoring/index.js";

export function wireDashboardActions(host, model, attempts) {
  const wc = document.getElementById("luxOpenWordCloud");

  const wc = document.getElementById("luxOpenWordCloud");
  if (wc)
    wc.addEventListener("click", () => {
      window.location.assign("./wordcloud.html");
    });

  const dl = document.getElementById("luxDownloadReport");
  if (dl)
    dl.addEventListener("click", () => {
      const name = `lux-progress-${new Date().toISOString().slice(0, 10)}.json`;
      downloadBlob(name, JSON.stringify({ model }, null, 2), "application/json");
    });

  const dlT = document.getElementById("luxDownloadTrouble");
  if (dlT)
    dlT.addEventListener("click", () => {
      const name = `lux-troubleshooting-${new Date().toISOString().slice(0, 10)}.json`;
      downloadBlob(name, JSON.stringify({ attempts }, null, 2), "application/json");
    });
}

/**
 * Compute a delta indicator HTML snippet.
 * Compares `current` vs `baseline`. Returns "" if either is missing.
 *
 * @param {number|null} current   - the more recent value (e.g., last, avg7)
 * @param {number|null} baseline  - the comparison value (e.g., avg7, avg30)
 * @returns {string} HTML like `<span class="lux-delta lux-delta--up">↑ 5</span>`
 */
export function deltaHtml(current, baseline) {
  if (current == null || baseline == null) return "";
  if (!Number.isFinite(+current) || !Number.isFinite(+baseline)) return "";

  const diff = Math.round(+current - +baseline);
  if (diff === 0) return `<span class="lux-delta lux-delta--flat">→ 0</span>`;
  if (diff > 0) return `<span class="lux-delta lux-delta--up">↑ ${diff}</span>`;
  return `<span class="lux-delta lux-delta--down">↓ ${Math.abs(diff)}</span>`;
}

export function renderMetricTrendCard(m) {
  if (!m) return "";
  const fmtPct = (v) =>
    v == null || !Number.isFinite(+v) ? "—" : fmtPctCefr(Math.round(+v));
  const best =
    m.bestDay?.avg != null ? `${m.bestDay.day} • ${fmtPct(m.bestDay.avg)}` : "—";

  // Delta: compare last session vs 7-day average
  const delta = deltaHtml(m.last, m.avg7);

  return `
    <div class="lux-pcard lux-metricTrendCard">
      <div class="lux-metricTrendTop">
        <div class="lux-pcard-label">${esc(m.label)} ${delta}</div>
        <div class="lux-metricTrendValue">${fmtPct(m.avg30)}</div>
      </div>
      <div class="lux-spark">${sparklineSvg(m.trend || [], { width: 240, height: 42 })}</div>
      <div class="lux-metricTrendMeta">
        <span>Last: <b>${fmtPct(m.last)}</b></span>
        <span>7d: <b>${fmtPct(m.avg7)}</b></span>
        <span>Best: <b>${best}</b></span>
      </div>
    </div>
  `;
}