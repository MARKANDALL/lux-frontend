// core/scoring/index.js
/* ============================================================================
   core/scoring/index.js — Canonical Scoring Gateway
   STATUS: LOCKED to Universal Blue/Yellow/Red Schema (80/60)
============================================================================ */

export const fmtPct = (v) => {
  if (v == null || !Number.isFinite(+v)) return "–";
  const n = +v;
  return Number.isInteger(n) ? `${n}%` : `${n.toFixed(1)}%`;
};

// SCORING CONSTITUTION:
// >= 80: Blue (Good)
// >= 60: Yellow (Warn)
// < 60:  Red (Bad)
export const scoreClass = (s) =>
  s == null
    ? ""
    : s >= 80
    ? "score-good"
    : s >= 60
    ? "score-warn"
    : "score-bad";

// CEFR rubric (display-only).
// Calibrated thresholds (from your current score distribution discussion):
// C2: 95+ | C1: 90–94 | B2: 85–89 | B1: 75–84 | A2: 60–74 | A1: <60
export const CEFR_BANDS = [
  { band: "C2", min: 95 },
  { band: "C1", min: 90 },
  { band: "B2", min: 85 },
  { band: "B1", min: 75 },
  { band: "A2", min: 60 },
  { band: "A1", min: 0 },
];

export function cefrBand(score) {
  if (score == null || !Number.isFinite(+score)) return "";
  const n = +score;
  for (const b of CEFR_BANDS) {
    if (n >= b.min) return b.band;
  }
  return "A1";
}

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

  const getSpeakingRate =
    globalThis.getSpeakingRate ||
    function () {
      return { label: "" };
    };

  const rate = getSpeakingRate(data);

  // Updated fallback logic to match new 80/60 threshold
  const fluFallback = rate.label ? (rate.label === "ok" ? 85 : 65) : null;

  return {
    accuracy: accAvg != null ? Math.round(accAvg) : null,
    completeness: completenessFallback,
    overall: overallFallback,
    fluency: fluFallback,
    rate,
  };
}

export default scoreClass;
