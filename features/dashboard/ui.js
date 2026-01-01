// features/dashboard/ui.js
import { computeRollups } from "../progress/rollups.js";
import { renderProgressDashboard } from "../progress/render.js";

export function renderDashboard(targetId) {
  const container = document.getElementById(targetId);
  if (!container) return;

  container.innerHTML = `
    <section class="lux-progress-shell">
      <div style="color:#64748b; padding: 14px 0;">Loading progress…</div>
    </section>
  `;
}

export function renderHistoryRows(attempts) {
  const container = document.getElementById("dashboard-root");
  if (!container) return;

  const model = computeRollups(attempts || [], { windowDays: 30 });
  renderProgressDashboard(container, attempts || [], model);
}

export function renderError(msg) {
  const container = document.getElementById("dashboard-root");
  if (!container) return;
  container.innerHTML = `
    <section class="lux-progress-shell">
      <div class="lux-pcard">
        <div class="lux-pcard-label">Progress</div>
        <div class="lux-pcard-value">—</div>
        <div class="lux-pcard-mini" style="color:#dc2626; font-weight:800">${msg || "Error"}</div>
      </div>
    </section>
  `;
}
