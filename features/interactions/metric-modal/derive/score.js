// features/interactions/metric-modal/derive/score.js

import { getAzureScores, deriveFallbackScores } from "../../../../core/scoring/index.js";
import { toNum, mean, pickWords } from "./utils.js";

export function getScorePack(data) {
  let s = getAzureScores(data);
  if (s.accuracy == null) {
    const fb = deriveFallbackScores(data);
    s = { ...s, ...fb };
  }

  // getAzureScores().overall === Azure "Pronunciation score" (PronScore)
  const pron = toNum(s.overall);
  const agg = mean([s.accuracy, s.fluency, s.completeness, s.prosody, pron]);

  return {
    accuracy: toNum(s.accuracy),
    fluency: toNum(s.fluency),
    completeness: toNum(s.completeness),
    prosody: toNum(s.prosody),
    pronunciation: pron,
    overallAgg: agg,
  };
}

export function hasRawWordDetail(data) {
  const words = pickWords(data);
  return Array.isArray(words) && words.length > 0;
}

function numFromSummary(summary, keys = []) {
  if (!summary || typeof summary !== "object") return null;
  for (const k of keys) {
    const v = Number(summary?.[k]);
    if (Number.isFinite(v)) return v;
  }
  return null;
}

export function getScorePackFromSummary(summary) {
  if (!summary || typeof summary !== "object") return null;

  const accuracy     = numFromSummary(summary, ["acc", "accuracy"]);
  const fluency      = numFromSummary(summary, ["flu", "fluency"]);
  const completeness = numFromSummary(summary, ["comp", "completeness"]);
  const prosody      = numFromSummary(summary, ["pros", "prosody"]);
  const pronunciation = numFromSummary(summary, ["pron", "pronunciation"]);

  const overallAgg = mean([accuracy, fluency, completeness, prosody, pronunciation]);

  return { accuracy, fluency, completeness, prosody, pronunciation, overallAgg };
}

export function getScorePackAny(azureResult, summary) {
  const base = azureResult
    ? getScorePack(azureResult)
    : {
        accuracy: null,
        fluency: null,
        completeness: null,
        prosody: null,
        pronunciation: null,
        overallAgg: null,
      };

  const s = getScorePackFromSummary(summary);
  if (!s) return base;

  return {
    accuracy:      base.accuracy      ?? s.accuracy,
    fluency:       base.fluency       ?? s.fluency,
    completeness:  base.completeness  ?? s.completeness,
    prosody:       base.prosody       ?? s.prosody,
    pronunciation: base.pronunciation ?? s.pronunciation,
    overallAgg:    base.overallAgg    ?? s.overallAgg,
  };
}