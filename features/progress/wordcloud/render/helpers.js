// features/progress/wordcloud/render/helpers.js
// One-line: Pure helper utilities for the wordcloud canvas renderer (move-only extraction from render-canvas.js).

import { clamp, lower } from "../math.js";

export { clamp, lower };

export function idOfWord(d) {
  const meta = d?.meta || {};
  return String(meta.word ?? meta.ipa ?? d?.text ?? "").trim().toLowerCase();
}

export function hexToRgba(hex = "#000000", a = 0.2) {
  const h = String(hex).replace("#", "").trim();
  if (h.length !== 6) return `rgba(0,0,0,${a})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}