// app-core/phones-normalize.js
export function normalizeAssessmentPhonesInPlace(res) {
  const nbest = Array.isArray(res?.NBest) ? res.NBest : [];
  for (const nb of nbest) {
    const words = Array.isArray(nb.Words) ? nb.Words : [];
    for (const w of words) {
      if (!Array.isArray(w.Phonemes)) continue;
      const src = w.Phonemes;
      const out = [];
      for (let i = 0; i < src.length; i++) {
        const cur = src[i]?.Phoneme;
        const nxt = src[i + 1]?.Phoneme;
        const score = (j) => src[j]?.AccuracyScore ?? 100;
        const err = (j) => src[j]?.ErrorType;

        if (cur === "ax" && nxt === "r") {
          out.push({
            Phoneme: "axr",
            AccuracyScore: Math.min(score(i), score(i + 1)),
            ErrorType: err(i) || err(i + 1),
          });
          i++;
          continue;
        }
        if (cur === "er" && nxt === "r") {
          out.push({
            Phoneme: "er",
            AccuracyScore: Math.min(score(i), score(i + 1)),
            ErrorType: err(i) || err(i + 1),
          });
          i++;
          continue;
        }
        if ((cur === "ah" || cur === "uh") && nxt === "r") {
          out.push({
            Phoneme: "er",
            AccuracyScore: Math.min(score(i), score(i + 1)),
            ErrorType: err(i) || err(i + 1),
          });
          i++;
          continue;
        }
        out.push(src[i]);
      }
      w.Phonemes = out;
    }
  }
}
