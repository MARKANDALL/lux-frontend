// features/progress/render/format.js
// Formatting helpers live here (fmtScore, fmtDate, etc).
// features/progress/render/format.js
// Formatting + labels used by Progress renders.

import { passages } from "../../../src/data/passages.js";
import { SCENARIOS } from "../../convo/scenarios.js";

export function scoreClass(score) {
  if (score >= 80) return "lux-pill--blue";
  if (score >= 60) return "lux-pill--yellow";
  return "lux-pill--red";
}

export function fmtScore(score) {
  return `${Math.round(score)}%`;
}

export function fmtDate(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function titleFromPassageKey(pk = "") {
  const s = String(pk);
  if (s.startsWith("convo:")) {
    const id = s.slice("convo:".length);
    const hit = SCENARIOS.find((x) => x.id === id);
    return hit ? `AI Conversation · ${hit.title}` : `AI Conversation · ${id}`;
  }
  const hit = passages?.[s];
  return hit?.name || s || "Practice";
}

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
