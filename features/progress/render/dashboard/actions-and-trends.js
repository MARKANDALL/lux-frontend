// features/progress/render/dashboard/actions-and-trends.js
// Dashboard action-button wiring + metric trend card renderer.

import {
  buildNextActivityPlanFromModel,
  saveNextActivityPlan,
} from "../../../next-activity/next-activity.js";

import { esc } from "../format.js";
import { sparklineSvg } from "../sparkline.js";
import { downloadBlob } from "../export.js";

export function wireDashboardActions(host, model, attempts) {
  const gen = document.getElementById("luxGenerateNextPractice");
  if (gen) {
    gen.addEventListener("click", () => {
      const plan = buildNextActivityPlanFromModel(model, { source: "global" });
      if (!plan) return;
      saveNextActivityPlan(plan);
      window.location.assign("./convo.html#chat");
    });
  }

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

export function renderMetricTrendCard(m) {
  if (!m) return "";
  const fmtPct = (v) =>
    v == null || !Number.isFinite(+v) ? "—" : `${Math.round(+v)}%`;
  const best =
    m.bestDay?.avg != null ? `${m.bestDay.day} • ${fmtPct(m.bestDay.avg)}` : "—";

  return `
    <div class="lux-pcard lux-metricTrendCard">
      <div class="lux-metricTrendTop">
        <div class="lux-pcard-label">${esc(m.label)}</div>
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
