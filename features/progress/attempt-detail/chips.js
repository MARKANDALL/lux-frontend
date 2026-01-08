// features/progress/attempt-detail/chips.js
// Small HTML render helpers for Attempt Details modal.

import { esc, getColorConfig } from "../progress-utils.js";

export function pillKV(label, val) {
  return `
    <div style="background:#f8fafc; padding:8px; border-radius:8px; text-align:center;">
      <div style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:700;">${esc(
        label
      )}</div>
      <div style="font-weight:800; color:#334155;">${val}</div>
    </div>
  `;
}

export function chipRowWords(items = []) {
  if (!items.length) {
    return `<p style="color:#94a3b8; font-style:italic;">Not enough word data in this session yet.</p>`;
  }
  return `
    <div class="lux-chiprow">
      ${items
        .slice(0, 12)
        .map(
          (w, i) => `
        <span
          class="lux-chip"
          data-kind="word"
          data-idx="${i}"
          role="button"
          tabindex="0"
          title="${esc(
            `Seen ${w.count}× · ${w.days || 1} day(s) · priority ${
              Number.isFinite(w.priority) ? w.priority.toFixed(2) : "—"
            }`
          )}"
        >
          <span>${esc(w.word)}</span>
          <span class="lux-pill ${
            w.avg >= 80 ? "lux-pill--blue" : w.avg >= 60 ? "lux-pill--yellow" : "lux-pill--red"
          }">${Math.round(Number(w.avg) || 0)}%</span>
        </span>
      `
        )
        .join("")}
    </div>
  `;
}

export function chipRowPhonemes(items = []) {
  if (!items.length) {
    return `<p style="color:#94a3b8; font-style:italic;">Not enough sound data in this session yet.</p>`;
  }
  return `
    <div class="lux-chiprow">
      ${items
        .slice(0, 12)
        .map((p, i) => {
          const ex =
            Array.isArray(p.examples) && p.examples.length
              ? `<div style="margin-top:4px; color:#94a3b8; font-size:0.82rem; font-weight:800;">e.g., ${esc(
                  p.examples.join(", ")
                )}</div>`
              : ``;

          return `
          <div style="display:inline-block;">
            <span
              class="lux-chip"
              data-kind="phoneme"
              data-idx="${i}"
              role="button"
              tabindex="0"
              title="${esc(
                `Seen ${p.count}× · ${p.days || 1} day(s) · priority ${
                  Number.isFinite(p.priority) ? p.priority.toFixed(2) : "—"
                }`
              )}"
            >
              <span>${esc(p.ipa)}</span>
              <span class="lux-pill ${
                p.avg >= 80 ? "lux-pill--blue" : p.avg >= 60 ? "lux-pill--yellow" : "lux-pill--red"
              }">${Math.round(Number(p.avg) || 0)}%</span>
            </span>
            ${ex}
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}
