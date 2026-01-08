// features/progress/attempt-detail/metrics.js
// Attempt metric extraction for Attempt Details modal.
// Pulls metrics from summary when present, otherwise falls back to Azure fields.

import { pickSummary, pickAzure } from "../attempt-pickers.js";

export function attemptMetric(a, kind) {
  const sum = pickSummary(a) || {};
  const az = pickAzure(a);
  const nb = az?.NBest?.[0] || az?.nBest?.[0] || null;
  const pa =
    nb?.PronunciationAssessment ||
    nb?.pronunciationAssessment ||
    az?.PronunciationAssessment ||
    null;

  const map = {
    pron: () => (sum.pron != null ? Number(sum.pron) : Number(nb?.PronScore ?? pa?.PronScore)),
    acc: () => (sum.acc != null ? Number(sum.acc) : Number(pa?.AccuracyScore)),
    flu: () => (sum.flu != null ? Number(sum.flu) : Number(pa?.FluencyScore)),
    comp: () => (sum.comp != null ? Number(sum.comp) : Number(pa?.CompletenessScore)),
    pros: () =>
      sum.pros != null
        ? Number(sum.pros)
        : sum.pro != null
        ? Number(sum.pro)
        : Number(pa?.ProsodyScore),
  };

  const fn = map[kind];
  if (!fn) return null;
  const n = fn();
  return Number.isFinite(n) ? n : null;
}
