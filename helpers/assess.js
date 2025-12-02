// helpers/assess.js
/** Heuristic to decide whether Azure returned usable speech. */
export function speechDetected(res) {
  const nb = res?.NBest?.[0];
  if (!nb) return false;

  const said = (res.DisplayText || nb.Display || "").trim();
  if (!said) return false;

  const words = Array.isArray(nb.Words) ? nb.Words : [];
  if (words.length === 0) return true;

  const anyWordWithScore = words.some((w) => (w?.AccuracyScore ?? 0) > 0);
  const anyPhonemeScore = words.some((w) =>
    (w?.Phonemes || []).some((p) => (p?.AccuracyScore ?? 0) > 0)
  );
  const anyGlobalScore = [
    nb.PronScore,
    nb.AccuracyScore,
    nb.FluencyScore,
    nb.CompletenessScore,
  ].some((v) => typeof v === "number" && v > 0);

  if (anyWordWithScore || anyPhonemeScore || anyGlobalScore) return true;

  const allZeroOmissions = words.every((w) => {
    const acc = Number.isFinite(w?.AccuracyScore) ? w.AccuracyScore : 0;
    const err = w?.ErrorType;
    return (err === "Omission" || err == null) && acc === 0;
  });

  return !allZeroOmissions;
}
