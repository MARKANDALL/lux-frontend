// features/progress/render/mini.js
// Mini progress widget render functions live here.
// features/progress/render/mini.js
import { fmtScore, fmtDate } from "./format.js";

export function renderMiniProgress(host, model, opts = {}) {
  const title = opts.title || "Progress";
  const totals = model?.totals || {};

  host.innerHTML = `
    <section class="lux-pcard" style="margin-bottom:12px;">
      <div class="lux-pcard-label">${title}</div>
      <div class="lux-pcard-value">${fmtScore(totals.avgScore ?? 0)}</div>
      <div class="lux-pcard-mini">
        Sessions: ${totals.sessions ?? 0} · Attempts: ${totals.attempts ?? 0} · Last: ${fmtDate(
    totals.lastTS
  )}
        · <a href="./progress.html" style="font-weight:800; color:#2563eb; text-decoration:none;">View full</a>
      </div>
    </section>
  `;
}
