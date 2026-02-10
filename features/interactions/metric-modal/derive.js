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

function getDisplayText(data) {
  return (
    data?.DisplayText ||
    data?.displayText ||
    data?.NBest?.[0]?.Display ||
    data?.NBest?.[0]?.DisplayText ||
    data?.NBest?.[0]?.display ||
    data?.Text ||
    data?.text ||
    ""
  );
}

function pickPhonemes(data) {
  const words = pickWords(data);
  const out = [];
  for (const w of words || []) {
    const phs = w?.Phonemes || w?.phonemes || [];
    for (const ph of phs || []) {
      const sym = String(ph?.Phoneme || ph?.phoneme || "").trim();
      const pa = ph?.PronunciationAssessment || ph?.pronunciationAssessment || {};
      const score = toNum(pa?.AccuracyScore);
      if (!sym) continue;
      out.push({ ph: sym, score });
    }
  }
  return out;
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

  const accuracy = numFromSummary(summary, ["acc", "accuracy"]);
  const fluency = numFromSummary(summary, ["flu", "fluency"]);
  const completeness = numFromSummary(summary, ["comp", "completeness"]);
  const prosody = numFromSummary(summary, ["pros", "prosody"]);
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
    accuracy: base.accuracy ?? s.accuracy,
    fluency: base.fluency ?? s.fluency,
    completeness: base.completeness ?? s.completeness,
    prosody: base.prosody ?? s.prosody,
    pronunciation: base.pronunciation ?? s.pronunciation,
    overallAgg: base.overallAgg ?? s.overallAgg,
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
  let longestPause = 0;

  for (let i = 1; i < timings.length; i++) {
    const prevEnd = timings[i - 1]?.end;
    const currStart = timings[i]?.start;
    if (!Number.isFinite(prevEnd) || !Number.isFinite(currStart)) continue;

    const gap = currStart - prevEnd;
    if (gap >= PAUSE_MIN_SEC) {
      pauseCount++;
      pauseTotal += gap;
      longestPause = Math.max(longestPause, gap);
    }
  }

  const wordsCount = words.length;

  const wps = Number.isFinite(spanSec) && spanSec > 0 ? wordsCount / spanSec : null;
  const wpm = Number.isFinite(wps) ? wps * 60 : null;

  const articulationSec =
    Number.isFinite(spanSec) && spanSec > 0 ? Math.max(0, spanSec - pauseTotal) : null;

  const arWps =
    Number.isFinite(articulationSec) && articulationSec > 0
      ? wordsCount / articulationSec
      : null;
  const arWpm = Number.isFinite(arWps) ? arWps * 60 : null;

  const durs = timings.map((t) => t?.durationSec).filter(Number.isFinite);
  const med = median(durs);

  const tempoMix = { fast: 0, ok: 0, slow: 0 };
  for (const d of durs) {
    const label = classifyTempo(d, med);
    tempoMix[label] = (tempoMix[label] || 0) + 1;
  }

  // ✅ Sanity + pause ratios (catch garbage spans / WPM)
  const pauseRatio = spanSec ? pauseTotal / spanSec : null; // pause share of total span
  const pauseToSpeechRatio = articulationSec ? pauseTotal / articulationSec : null; // pause share vs spoken time

  const isSane =
    Number.isFinite(spanSec) &&
    spanSec > 0.25 &&
    spanSec < 60 &&
    (!wpm || (wpm > 20 && wpm < 400)); // keep wide; just catch garbage

  return {
    wordsCount,
    spanSec,
    wpm,
    wps,
    articulationSec,
    arWpm,
    pauseCount,
    pauseTotal,
    longestPause,
    tempoMix,
    pauseRatio,
    pauseToSpeechRatio,
    isSane,
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

/* ---------------------------------------------------------------------------
   Completeness-only helper: missing/extra words vs reference
--------------------------------------------------------------------------- */

function tokenizeWords(s) {
  return (s || "").toLowerCase().match(/[a-z0-9']+/g) || [];
}

// ✅ Completeness-only: missing/extra words vs reference
export function deriveCompletenessDiff(referenceText, data) {
  const ref = tokenizeWords(referenceText);
  if (!ref.length) return null;

  // Prefer word-level tokens from Azure if available
  const saidWords = pickWords(data)
    .map((w) => (w.word || w.Word || "").toLowerCase())
    .filter(Boolean);

  const said = saidWords.length ? saidWords : tokenizeWords(getDisplayText(data));

  const refCount = new Map();
  const saidCount = new Map();

  for (const w of ref) refCount.set(w, (refCount.get(w) || 0) + 1);
  for (const w of said) saidCount.set(w, (saidCount.get(w) || 0) + 1);

  const missing = [];
  const extra = [];

  for (const [w, n] of refCount.entries()) {
    const got = saidCount.get(w) || 0;
    if (got < n) missing.push(w);
  }

  for (const [w, n] of saidCount.entries()) {
    const exp = refCount.get(w) || 0;
    if (n > exp) extra.push(w);
  }

  // first divergence (simple sequential compare)
  let divergedAt = null;
  const L = Math.min(ref.length, said.length);
  for (let i = 0; i < L; i++) {
    if (ref[i] !== said[i]) {
      divergedAt = i + 1; // 1-based word index
      break;
    }
  }

  return {
    refCount: ref.length,
    saidCount: said.length,
    missing: missing.slice(0, 8),
    extra: extra.slice(0, 8),
    divergedAt,
  };
}

/* ---------------------------------------------------------------------------
   Accuracy/Pronunciation helper: vowel vs consonant weakness split
--------------------------------------------------------------------------- */

const VOWEL_SET = new Set([
  // Common vowel IPA + common symbolic vowel sets
  "a",
  "e",
  "i",
  "o",
  "u",
  "æ",
  "ɑ",
  "ɒ",
  "ɔ",
  "ʊ",
  "ʌ",
  "ə",
  "ɚ",
  "ɝ",
  "ɪ",
  "ɛ",
  "ɜ",
  // common Azure-ish / CMU-ish
  "aa",
  "ae",
  "ah",
  "ao",
  "aw",
  "ax",
  "ay",
  "eh",
  "er",
  "ey",
  "ih",
  "iy",
  "ow",
  "oy",
  "uh",
  "uw",
]);

function isVowelSymbol(ph) {
  const s = (ph || "").toLowerCase();
  if (VOWEL_SET.has(s)) return true;
  // fallback: any obvious vowel char
  return /[aeiouæɑɔəɪɛʊʌ]/.test(s);
}

export function derivePhonemeClassSplit(data, { weakThreshold = 80 } = {}) {
  const phs = pickPhonemes(data);
  if (!phs.length) return null;

  let vTotal = 0,
    cTotal = 0;
  let vWeak = 0,
    cWeak = 0;

  for (const p of phs) {
    const isV = isVowelSymbol(p.ph);
    const sc = Number(p.score);
    const weak = Number.isFinite(sc) && sc < weakThreshold;

    if (isV) {
      vTotal++;
      if (weak) vWeak++;
    } else {
      cTotal++;
      if (weak) cWeak++;
    }
  }

  const total = vTotal + cTotal;
  if (!total) return null;

  return {
    vTotal,
    cTotal,
    vWeak,
    cWeak,
    weakThreshold,
    weakShareVowels: vTotal ? vWeak / vTotal : 0,
    weakShareConsonants: cTotal ? cWeak / cTotal : 0,
  };
}
