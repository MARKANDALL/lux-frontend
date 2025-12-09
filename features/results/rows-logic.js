// ui/views/rows-logic.js
// Pure logic: calculates penalties, classifications, and error strings.

import { classifyTempo, classifyGap } from "./deps.js";

export function calculateWordStats(word, index, timings, medianDuration) {
  const t = timings?.[index] || {};
  const prev = timings?.[index - 1] || {};

  // 1. Classification
  const tempo = classifyTempo?.(t.durationSec, medianDuration) || "ok";
  const gapCls = index > 0 ? classifyGap?.(prev.end, t.start) || "ok" : "ok";

  // 2. Error Text Building
  const err = word.ErrorType && word.ErrorType !== "None" ? word.ErrorType : "";
  
  const notes = [];
  if (gapCls === "missing") notes.push("missing phrase pause");
  else if (gapCls === "unexpected") notes.push("long pause");
  if (tempo === "fast") notes.push("too fast");
  else if (tempo === "slow") notes.push("too slow");

  const errText = [err, ...notes].filter(Boolean).join("; ");

  // 3. Penalty Math
  // (Fast/Slow = -4 points, Bad Gap = -2 points)
  const penalty =
    (tempo === "fast" || tempo === "slow" ? 4 : 0) +
    (gapCls === "missing" || gapCls === "unexpected" ? 2 : 0);

  // 4. Adjusted Score
  const rawScore = word.AccuracyScore ?? 0;
  const adjScore = Math.max(
    0,
    Math.min(100, Math.round(rawScore - penalty))
  );

  return {
    tempo,
    gapCls,
    errText,
    penalty,
    adjScore,
    rawScore
  };
}