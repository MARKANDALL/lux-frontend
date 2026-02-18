// features/progress/progress-utils.js
// Tiny shared helpers for progress UI (keep it boring + stable).

import { scoreClass as scoreClassCore } from "../../core/scoring/index.js";

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getColorConfig(s) {
  const n = Number(s) || 0;
  const cls = scoreClassCore(n);
  if (cls === "score-good") return { color: "#2563eb", bg: "#dbeafe" }; // Blue
  if (cls === "score-warn") return { color: "#d97706", bg: "#fef3c7" }; // Yellow
  return { color: "#dc2626", bg: "#fee2e2" }; // Red
}

export function mdToHtml(md = "") {
  if (!md) return "";
 return esc(String(md))
     .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .split("\n")
    .join("<br>");
}

export function mean(nums) {
  const v = (nums || []).filter((x) => Number.isFinite(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}
