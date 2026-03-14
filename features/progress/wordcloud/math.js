// features/progress/wordcloud/math.js
// ONE-LINE: Canonical small math/string helpers for the wordcloud feature.

export function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export function lower(s) {
  return String(s || "").trim().toLowerCase();
}