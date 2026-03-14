// helpers/core.js
import { getUID } from "../api/identity.js";
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