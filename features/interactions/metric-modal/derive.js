// features/interactions/metric-modal/derive.js
// Pure compute helpers for metric explainer modals (NOT AI Coach).

import { getAzureScores, deriveFallbackScores } from "../../../core/scoring/index.js";
import { computeTimings, median } from "../../../prosody/core-calc.js";
import { classifyTempo } from "../../../prosody/annotate.js";

const PAUSE_MIN_SEC = 0.18; // "pause" threshold

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function mean(nums) {
  const v = (nums || []).map(toNum).filter((x) => Number.isFinite(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function pickWords(data) {
  return (
    data?.NBest?.[0]?.Words ||
    data?.nBest?.[0]?.Words ||
    data?.PronunciationAssessment?.Words ||
    []
  );
}

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

export function deriveTimingStats(data) {
  const words = pickWords(data);
  if (!Array.isArray(words) || !words.length) return null;

  const timings = computeTimings(words);

  const starts = timings.map((t) => t?.start).filter(Number.isFinite);
  const ends = timings.map((t) => t?.end).filter(Number.isFinite);

  const minStart = starts.length ? Math.min(...starts) : null;
  const maxEnd = ends.length ? Math.max(...ends) : null;

  let spanSec = null;
  if (Number.isFinite(minStart) && Number.isFinite(maxEnd) && maxEnd > minStart) {
    spanSec = maxEnd - minStart;
  }

  let pauseCount = 0;
  let pauseTotal = 0;
  let pauseLongest = 0;

  for (let i = 1; i < timings.length; i++) {
    const prevEnd = timings[i - 1]?.end;
    const currStart = timings[i]?.start;
    if (!Number.isFinite(prevEnd) || !Number.isFinite(currStart)) continue;

    const gap = currStart - prevEnd;
    if (gap >= PAUSE_MIN_SEC) {
      pauseCount++;
      pauseTotal += gap;
      pauseLongest = Math.max(pauseLongest, gap);
    }
  }

  const wordCount = words.length;

  const wps = Number.isFinite(spanSec) && spanSec > 0 ? wordCount / spanSec : null;
  const wpm = Number.isFinite(wps) ? wps * 60 : null;

  const articulationSec =
    Number.isFinite(spanSec) && spanSec > 0 ? Math.max(0, spanSec - pauseTotal) : null;

  const arWps =
    Number.isFinite(articulationSec) && articulationSec > 0 ? wordCount / articulationSec : null;
  const arWpm = Number.isFinite(arWps) ? arWps * 60 : null;

  const durs = timings.map((t) => t?.durationSec).filter(Number.isFinite);
  const med = median(durs);
  const tempoCounts = { fast: 0, slow: 0, ok: 0 };

  for (const d of durs) {
    const label = classifyTempo(d, med);
    tempoCounts[label] = (tempoCounts[label] || 0) + 1;
  }

  return {
    wordCount,
    spanSec,
    pauseCount,
    pauseTotal,
    pauseLongest,
    wps,
    wpm,
    articulationSec,
    arWps,
    arWpm,
    tempoCounts,
  };
}

export function deriveErrorStats(data) {
  const words = pickWords(data);
  if (!Array.isArray(words) || !words.length) return null;

  const worstWords = words
    .map((w) => {
      const pa = w?.PronunciationAssessment || w?.pronunciationAssessment || {};
      return {
        word: w?.Word || w?.word || "",
        acc: toNum(pa?.AccuracyScore),
        err: String(pa?.ErrorType || pa?.errorType || "").trim(),
      };
    })
    .filter((x) => x.word)
    .sort((a, b) => (a.acc ?? 999) - (b.acc ?? 999))
    .slice(0, 8);

  const errCounts = {};
  for (const w of words) {
    const pa = w?.PronunciationAssessment || w?.pronunciationAssessment || {};
    const t = String(pa?.ErrorType || pa?.errorType || "").trim();
    if (!t) continue;
    errCounts[t] = (errCounts[t] || 0) + 1;
  }

  const phMap = new Map();
  for (const w of words) {
    const phs = w?.Phonemes || w?.phonemes || [];
    for (const ph of phs) {
      const sym = String(ph?.Phoneme || ph?.phoneme || "").trim();
      const pa = ph?.PronunciationAssessment || ph?.pronunciationAssessment || {};
      const acc = toNum(pa?.AccuracyScore);
      if (!sym) continue;

      const prev = phMap.get(sym) || { sum: 0, n: 0 };
      if (Number.isFinite(acc)) {
        prev.sum += acc;
        prev.n += 1;
      }
      phMap.set(sym, prev);
    }
  }

  const worstPhonemes = [...phMap.entries()]
    .map(([sym, v]) => ({ phoneme: sym, avg: v.n ? v.sum / v.n : null, n: v.n }))
    .filter((x) => Number.isFinite(x.avg))
    .sort((a, b) => (a.avg ?? 999) - (b.avg ?? 999))
    .slice(0, 8);

  return { worstWords, worstPhonemes, errCounts };
}

export function prettyErrCounts(errCounts) {
  const entries = Object.entries(errCounts || {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return "—";
  return entries.map(([k, v]) => `${k}: ${v}`).join(" • ");
}
