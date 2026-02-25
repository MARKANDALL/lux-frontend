// features/progress/render/format.js
// ONE-LINE: Formatting + labels used by Progress renders (fmtScore, fmtDate, titleFromPassageKey, esc).

// Formatting helpers live here (fmtScore, fmtDate, etc).
// features/progress/render/format.js
// Formatting + labels used by Progress renders.

import { passages } from "../../../src/data/passages.js";
import { SCENARIOS } from "../../convo/scenarios.js";
import {
  scoreClass as scoreClassCore,
  fmtPctCefr,
} from "../../../core/scoring/index.js";

export function scoreClass(score) {
  const cls = scoreClassCore(score);
  if (cls === "score-good") return "lux-pill--blue";
  if (cls === "score-warn") return "lux-pill--yellow";
  if (cls === "score-bad") return "lux-pill--red";
  return "";
}

export function fmtScore(score) {
  const n = Number(score);
  return Number.isFinite(n) ? `${Math.round(n)}%` : "—";
}

export function fmtScoreCefr(score) {
  const n = Number(score);
  return Number.isFinite(n) ? fmtPctCefr(Math.round(n)) : "—";
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