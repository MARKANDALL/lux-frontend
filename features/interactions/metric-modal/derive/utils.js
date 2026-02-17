// features/interactions/metric-modal/derive/utils.js
// Shared private helpers — not exported beyond this folder.

export const PAUSE_MIN_SEC = 0.18; // "pause" threshold

export function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function mean(nums) {
  const v = (nums || []).map(toNum).filter((x) => Number.isFinite(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

export function pickWords(data) {
  return (
    data?.NBest?.[0]?.Words ||
    data?.nBest?.[0]?.Words ||
    data?.PronunciationAssessment?.Words ||
    []
  );
}

export function getDisplayText(data) {
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

export function pickPhonemes(data) {
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