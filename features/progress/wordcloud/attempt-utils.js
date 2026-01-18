// features/progress/wordcloud/attempt-utils.js
// Wordcloud attempt helpers (recents list + labels)
// ✅ extracted from index.js to shrink controller file

import { pickTS, pickAzure, pickSummary, pickPassageKey } from "../attempt-pickers.js";
import { titleFromPassageKey } from "../render/format.js";
import { lower } from "./compute.js";

// ---------- Action Sheet helpers ----------
export function attemptOverallScore(a) {
  const sum = pickSummary(a) || {};
  if (sum.pron != null) return Number(sum.pron) || 0;
  const az = pickAzure(a);
  return Number(az?.NBest?.[0]?.PronScore) || 0;
}
export function attemptWhen(a) {
  const ts = pickTS(a);
  return ts ? new Date(ts).toLocaleString() : "";
}
export function attemptTitle(a) {
  const pk = pickPassageKey(a);
  return titleFromPassageKey(pk);
}
export function findRecentAttemptsForWord(attempts, word, limit = 6) {
  const needle = lower(word);
  if (!needle) return [];

  const out = [];
  const list = Array.isArray(attempts) ? attempts.slice() : [];
  list.sort((a, b) => +new Date(pickTS(b) || 0) - +new Date(pickTS(a) || 0));

  for (const a of list) {
    if (out.length >= limit) break;

    const az = pickAzure(a);
    const W = az?.NBest?.[0]?.Words || [];
    if (!Array.isArray(W) || !W.length) continue;

    const found = W.some((w) => lower(w?.Word) === needle);
    if (!found) continue;

    out.push({
      attempt: a,
      title: attemptTitle(a),
      when: attemptWhen(a),
      score: attemptOverallScore(a),
    });
  }
  return out;
}
export function findRecentAttemptsForPhoneme(attempts, ipa, limit = 6) {
  const needle = String(ipa || "").trim();
  if (!needle) return [];

  const out = [];
  const list = Array.isArray(attempts) ? attempts.slice() : [];
  list.sort((a, b) => +new Date(pickTS(b) || 0) - +new Date(pickTS(a) || 0));

  for (const a of list) {
    if (out.length >= limit) break;

    const az = pickAzure(a);
    const W = az?.NBest?.[0]?.Words || [];
    if (!Array.isArray(W) || !W.length) continue;

    let found = false;
    for (const w of W) {
      const P = Array.isArray(w?.Phonemes) ? w.Phonemes : [];
      if (P.some((p) => String(p?.Phoneme || "").trim() === needle)) {
        found = true;
        break;
      }
    }
    if (!found) continue;

    out.push({
      attempt: a,
      title: attemptTitle(a),
      when: attemptWhen(a),
      score: attemptOverallScore(a),
    });
  }
  return out;
}
