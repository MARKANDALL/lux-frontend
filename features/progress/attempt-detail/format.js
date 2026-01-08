// features/progress/attempt-detail/format.js
// Pure formatting helpers for Attempt Details modal.

import { passages } from "../../../src/data/passages.js";
import { SCENARIOS } from "../../convo/scenarios.js";

export function fmtDateTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
