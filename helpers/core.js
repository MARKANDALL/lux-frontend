// helpers/core.js
// One-line: Shared core helpers for user identity, friendly feedback text, markdown rendering, clamping, and in-place shuffling.


import { getUID } from "../_api/identity.js";
import { coachingPreface } from "../core/scoring/index.js";
import { mdToHtml as renderMdToHtml } from "./md-to-html.js";

// Single source of truth for UID:
// - api/identity.js owns generation + persistence + migration
export const LUX_USER_ID = typeof window !== "undefined" ? getUID() : null;

export const buildYouglishUrl = (w) =>
  `https://youglish.com/pronounce/${encodeURIComponent(w)}/english`;

export const isCorrupt = (s) =>
  /[�‘’“”—–…•\u0080-\uFFFF]/.test(String(s || ""));

export function encouragingLine(score) {
  // If a score is provided, use canonical humanistic coaching preface
  // (includes explicit “you’re in the green” for 80–84).
  if (score !== undefined && score !== null) {
    const s = coachingPreface(score);
    if (s) return s;
  }

  const msgs = [
    "Great effort! Keep going—your persistence is paying off.",
    "Nice work! Every attempt brings you closer to perfect pronunciation.",
    "You're improving with every try—keep it up!",
    "Excellent focus! Small adjustments make a big difference.",
    "Keep practicing—you're making real progress!",
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

/** Tiny MD → HTML tailored for the AI feedback */

export function mdToHtml(md = "") {
  return renderMdToHtml(md, {
    headings: true,
    specialHeadings: true,
    lists: true,
    paragraphs: true,
    preserveLineBreaks: false,
  });
}

/** Clamp a number between lo and hi (inclusive). */
export function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/** Fisher-Yates in-place shuffle (Math.random). */
export function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}