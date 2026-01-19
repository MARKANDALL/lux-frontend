// features/my-words/normalize.js

/**
 * Mild normalization for de-dupe + search.
 * IMPORTANT: keep it conservative (do NOT strip punctuation aggressively).
 */
export function normalizeText(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function splitLines(raw) {
  return String(raw || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}
