// features/interactions/metric-modal/derive/errors.js

import { toNum, pickWords, getDisplayText, pickPhonemes } from "./utils.js";

export function deriveErrorStats(data) {
  const words = pickWords(data);
  if (!Array.isArray(words) || !words.length) return null;

  const worstWords = words
    .map((w) => {
      const pa = w?.PronunciationAssessment || w?.pronunciationAssessment || {};
      return {
        word: w?.Word || w?.word || "",
        acc:  toNum(pa?.AccuracyScore),
        err:  String(pa?.ErrorType || pa?.errorType || "").trim(),
      };
    })
    .filter((x) => x.word)
    .sort((a, b) => (a.acc ?? 999) - (b.acc ?? 999))
    .slice(0, 8);

  const errCounts = {};
  for (const w of words) {
    const pa = w?.PronunciationAssessment || w?.pronunciationAssessment || {};
    const t  = String(pa?.ErrorType || pa?.errorType || "").trim();
    if (!t) continue;
    errCounts[t] = (errCounts[t] || 0) + 1;
  }

  const phMap = new Map();
  for (const w of words) {
    const phs = w?.Phonemes || w?.phonemes || [];
    for (const ph of phs) {
      const sym = String(ph?.Phoneme || ph?.phoneme || "").trim();
      const pa  = ph?.PronunciationAssessment || ph?.pronunciationAssessment || {};
      const acc = toNum(pa?.AccuracyScore);
      if (!sym) continue;

      const prev = phMap.get(sym) || { sum: 0, n: 0 };
      if (Number.isFinite(acc)) {
        prev.sum += acc;
        prev.n   += 1;
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

export function deriveCompletenessDiff(referenceText, data) {
  const ref = tokenizeWords(referenceText);
  if (!ref.length) return null;

  // Prefer word-level tokens from Azure if available
  const saidWords = pickWords(data)
    .map((w) => (w.word || w.Word || "").toLowerCase())
    .filter(Boolean);

  const said = saidWords.length ? saidWords : tokenizeWords(getDisplayText(data));

  const refCount  = new Map();
  const saidCount = new Map();

  for (const w of ref)  refCount.set(w,  (refCount.get(w)  || 0) + 1);
  for (const w of said) saidCount.set(w, (saidCount.get(w) || 0) + 1);

  const missing = [];
  const extra   = [];

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
    refCount:   ref.length,
    saidCount:  said.length,
    missing:    missing.slice(0, 8),
    extra:      extra.slice(0, 8),
    divergedAt,
  };
}

/* ---------------------------------------------------------------------------
   Accuracy/Pronunciation helper: vowel vs consonant weakness split
--------------------------------------------------------------------------- */

const VOWEL_SET = new Set([
  "a", "e", "i", "o", "u",
  "æ", "ɑ", "ɒ", "ɔ", "ʊ", "ʌ", "ə", "ɚ", "ɝ", "ɪ", "ɛ", "ɜ",
  // common Azure-ish / CMU-ish
  "aa", "ae", "ah", "ao", "aw", "ax", "ay",
  "eh", "er", "ey",
  "ih", "iy",
  "ow", "oy",
  "uh", "uw",
]);

function isVowelSymbol(ph) {
  const s = (ph || "").toLowerCase();
  if (VOWEL_SET.has(s)) return true;
  return /[aeiouæɑɔəɪɛʊʌ]/.test(s);
}

export function derivePhonemeClassSplit(data, { weakThreshold = 80 } = {}) {
  const phs = pickPhonemes(data);
  if (!phs.length) return null;

  let vTotal = 0, cTotal = 0;
  let vWeak  = 0, cWeak  = 0;

  for (const p of phs) {
    const isV = isVowelSymbol(p.ph);
    const sc  = Number(p.score);
    const weak = Number.isFinite(sc) && sc < weakThreshold;

    if (isV) { vTotal++; if (weak) vWeak++; }
    else     { cTotal++; if (weak) cWeak++; }
  }

  const total = vTotal + cTotal;
  if (!total) return null;

  return {
    vTotal, cTotal, vWeak, cWeak,
    weakThreshold,
    weakShareVowels:     vTotal ? vWeak / vTotal : 0,
    weakShareConsonants: cTotal ? cWeak / cTotal : 0,
  };
}