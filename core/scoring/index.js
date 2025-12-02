/* ============================================================================
   core/scoring/index.js — Canonical Scoring Gateway (v0)
   ---------------------------------------------------------------------------
   North-star:
   - Pure ES-module exports only (no DOM writes).
   - No window.* attaches here.
   - Legacy globals may still exist elsewhere, but modern code imports from here.
   - Prosody untouched.
============================================================================ */

// Format a numeric score as a percent string.
// Example: 87 -> "87%" ; 87.3 -> "87.3%" ; null/NaN -> "–"
export const fmtPct = (v) => {
  if (v == null || !Number.isFinite(+v)) return "–";
  const n = +v;
  return Number.isInteger(n) ? `${n}%` : `${n.toFixed(1)}%`;
};

// Map a score to a CSS class for coloring.
export const scoreClass = (s) =>
  s == null
    ? ""
    : s >= 85
    ? "score-good"
    : s >= 70
    ? "score-warn"
    : "score-bad";

// Pull Azure-ish scores from the JSON in a resilient way.
// Works with either top-level PronunciationAssessment or NBest[0].
export function getAzureScores(data) {
  const nbest = data?.NBest?.[0] || {};
  const pa =
    nbest?.PronunciationAssessment || data?.PronunciationAssessment || {};
  const ca = nbest?.ContentAssessment || data?.ContentAssessment || {};

  const num = (v) => (Number.isFinite(+v) ? +v : null);

  return {
    accuracy: num(nbest?.AccuracyScore ?? pa?.AccuracyScore),
    fluency: num(nbest?.FluencyScore ?? pa?.FluencyScore),
    completeness: num(nbest?.CompletenessScore ?? pa?.CompletenessScore),
    overall: num(
      nbest?.PronScore ?? pa?.PronunciationScore ?? pa?.PronScore
    ),
    prosody: num(
      nbest?.ProsodyScore ??
        pa?.ProsodyScore ??
        data?.ProsodyScore ??
        data?.PronunciationAssessment?.ProsodyScore
    ),
    content: {
      vocab: num(ca?.vocabularyScore ?? ca?.VocabularyScore),
      grammar: num(ca?.grammarScore ?? ca?.GrammarScore),
      topic: num(ca?.topicScore ?? ca?.TopicScore),
    },
    nbest,
  };
}

// If Azure scores are missing, derive reasonable fallbacks from word data.
// Mirrors legacy behavior but stays importable.
export function deriveFallbackScores(data) {
  const nbest = data?.NBest?.[0] || {};
  const words = nbest?.Words || [];

  const toNum = (x) => (Number.isFinite(+x) ? +x : null);
  const avg = (arr) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  const accs = words
    .map((w) => toNum(w?.AccuracyScore))
    .filter(Number.isFinite);

  const accAvg = avg(accs);

  const okCount = words.filter(
    (w) => !w?.ErrorType || w.ErrorType === "None"
  ).length;

  const completenessFallback = words.length
    ? Math.round((okCount / words.length) * 100)
    : null;

  const pa =
    nbest?.PronunciationAssessment || data?.PronunciationAssessment || {};

  const overallFallback =
    toNum(nbest?.PronScore ?? pa?.PronunciationScore ?? pa?.PronScore) ??
    (accAvg != null ? Math.round(accAvg) : null);

  // Optional legacy helper if it exists (we only READ it, never attach).
  const getSpeakingRate =
    globalThis.getSpeakingRate ||
    function () {
      return { label: "" };
    };

  const rate = getSpeakingRate(data);

  const fluFallback = rate.label ? (rate.label === "ok" ? 85 : 70) : null;

  return {
    accuracy: accAvg != null ? Math.round(accAvg) : null,
    completeness: completenessFallback,
    overall: overallFallback,
    fluency: fluFallback,
    rate,
  };
}

// Back-compat default export in case anyone imports default.
// (Named exports are the real contract.)
export default scoreClass;
