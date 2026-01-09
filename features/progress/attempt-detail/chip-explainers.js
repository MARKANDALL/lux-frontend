// features/progress/attempt-detail/chip-explainers.js
// Wires up click/keyboard behavior for trouble chips to show an inline explainer panel.

import { esc } from "../progress-utils.js";

export function wireAttemptDetailChipExplainers(card, { phItems = [], wdItems = [] } = {}) {
  if (!card) return;

  const explainSounds = card.querySelector("#luxExplainSounds");
  const explainWords = card.querySelector("#luxExplainWords");

  let lastPick = ""; // `${kind}:${idx}`

  function showExplain(kind, idx) {
    const key = `${kind}:${idx}`;
    const same = key === lastPick;
    lastPick = same ? "" : key;

    const panel = kind === "phoneme" ? explainSounds : explainWords;
    const items = kind === "phoneme" ? phItems : wdItems;

    if (!panel) return;

    if (same) {
      panel.innerHTML = "";
      panel.setAttribute("hidden", "");
      return;
    }

    const item = items[idx];
    if (!item) return;

    const avg = Math.round(Number(item.avg) || 0);
    const count = Number(item.count) || 0;
    const days = Number(item.days) || 1;
    const pr = Number.isFinite(item.priority) ? item.priority.toFixed(2) : "—";

    const label = kind === "phoneme" ? `Sound ${esc(item.ipa)}` : `Word ${esc(item.word)}`;

    const examples =
      kind === "phoneme" && Array.isArray(item.examples) && item.examples.length
        ? `<div style="margin-top:8px; color:#475569;"><span style="font-weight:900;">Examples:</span> ${esc(
            item.examples.join(", ")
          )}</div>`
        : "";

    panel.innerHTML = `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px;">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px;">
          <div>
            <div style="font-weight:900; color:#334155;">${label}</div>
            <div style="margin-top:4px; color:#64748b; font-weight:800; font-size:0.92rem;">
              Seen ${count}× · ${days} day(s) · Priority ${esc(pr)}
            </div>
          </div>
          <div style="font-weight:900; color:#334155; border:1px solid #e2e8f0; background:#fff; border-radius:999px; padding:6px 10px;">
            Avg ${avg}%
          </div>
        </div>
        ${examples}
        <div style="margin-top:10px; color:#64748b; font-size:0.92rem;">
          <span style="font-weight:900;">Why it’s here:</span> low accuracy + repeated exposure (count/days) increases priority.
        </div>
      </div>
    `;

    panel.removeAttribute("hidden");
    try {
      panel.scrollIntoView({ block: "nearest" });
    } catch (_) {}
  }

  function bindChip(chip) {
    const kind = chip.getAttribute("data-kind");
    const idx = Number(chip.getAttribute("data-idx"));
    if (!kind || !Number.isFinite(idx)) return;

    chip.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      showExplain(kind, idx);
    });

    chip.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        showExplain(kind, idx);
      }
    });
  }

  card.querySelectorAll(".lux-chip[data-kind][data-idx]").forEach(bindChip);
}
