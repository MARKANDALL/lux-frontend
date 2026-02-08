// features/harvard/modal-phoneme-rows.js
import { getHarvardMeta, metaForKey } from "./modal-phoneme-metrics.js";

export function renderHarvardPhonemeRows(n, phonRowsEl) {
  while (phonRowsEl.firstChild) phonRowsEl.removeChild(phonRowsEl.firstChild);

  const meta = getHarvardMeta(n);
  const top3 = meta?.top3;

  if (!Array.isArray(top3) || top3.length === 0) {
    const empty = document.createElement("div");
    empty.className = "lux-harvard-status";
    empty.textContent = "Phoneme stats not available yet.";
    phonRowsEl.appendChild(empty);
    return;
  }

  top3.forEach((p) => {
    const row = document.createElement("div");
    row.className = "lux-harvard-phoneme-row";

    const chip = document.createElement("span");
    chip.className = "lux-harvard-phoneme-chip";
    chip.textContent = p.ph;

    const metaTxt = document.createElement("span");
    metaTxt.className = "lux-harvard-phoneme-meta";
    metaTxt.textContent = `${p.count} • ${(p.pct * 100).toFixed(1)}% • ×${p.lift.toFixed(2)}`;

    row.appendChild(chip);
    row.appendChild(metaTxt);
    phonRowsEl.appendChild(row);
  });
}

export function renderPassagePhonemeRows(key, phonRowsEl) {
  while (phonRowsEl.firstChild) phonRowsEl.removeChild(phonRowsEl.firstChild);

  const m = metaForKey(key);
  const counts = m?.counts;

  if (!counts || typeof counts !== "object") {
    const empty = document.createElement("div");
    empty.className = "lux-harvard-status";
    empty.textContent = "Phoneme stats not available yet.";
    phonRowsEl.appendChild(empty);
    return;
  }

  const total = Number(m?.totalPhones || 0);
  const rows = Object.entries(counts)
    .map(([ph, c]) => ({ ph: String(ph).toUpperCase(), c: Number(c || 0) }))
    .filter((x) => x.c > 0)
    .sort((a, b) => b.c - a.c)
    .slice(0, 6);

  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "lux-harvard-status";
    empty.textContent = "Phoneme stats not available yet.";
    phonRowsEl.appendChild(empty);
    return;
  }

  rows.forEach((p) => {
    const row = document.createElement("div");
    row.className = "lux-harvard-phoneme-row";

    const chip = document.createElement("span");
    chip.className = "lux-harvard-phoneme-chip";
    chip.textContent = p.ph;

    const metaTxt = document.createElement("span");
    metaTxt.className = "lux-harvard-phoneme-meta";
    if (total) metaTxt.textContent = `${p.c} • ${((p.c / total) * 100).toFixed(1)}%`;
    else metaTxt.textContent = `${p.c}`;

    row.appendChild(chip);
    row.appendChild(metaTxt);
    phonRowsEl.appendChild(row);
  });
}
