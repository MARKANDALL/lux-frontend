// features/progress/wordcloud/math.js
// ONE-LINE: Canonical small math/string helpers for the wordcloud feature.

export { clamp } from '../../../helpers/core.js';

export function lower(s) {
  return String(s || "").trim().toLowerCase();
}