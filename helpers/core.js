// helpers/core.js
import { getUID } from "../api/identity.js";
import {
  scoreClass as scoreClassCore,
  coachingPreface,
} from "../core/scoring/index.js";

// Single source of truth for UID:
// - api/identity.js owns generation + persistence + migration
export const LUX_USER_ID = typeof window !== "undefined" ? getUID() : null;

export function scoreClass(score) {
  return scoreClassCore(score);
}

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

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function mdToHtml(md) {
  md = escapeHtml(md)
    .replace(/\r\n/g, "\n")
    .replace(/^(#{2,3} .+?)\s+(?=[^\n])/gm, "$1\n")
    .replace(/^#{2,3}\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/(?:^|\n)((?:[-•]\s+.+(?:\n|$))+)/g, (_m, block) => {
      const items = block
        .trim()
        .split("\n")
        .map((l) => l.replace(/^[-•]\s+/, "").trim())
        .filter(Boolean)
        .map((t) => `<li>${t}</li>`)
        .join("");
      return `\n<ul>${items}</ul>\n`;
    })
    .replace(
      /^\s*(🏃‍♂️ Quick Coaching|🔤 Phoneme Profile|✋ Reassurance|💡 Did You Know\?|🌍 World Language Spotlight)\s*$/gm,
      "<h3>$1</h3>"
    );

  return md
    .split("\n")
    .map((line) =>
      line.match(/^<h3|^<ul|^<\/ul|^<li|^<\/li|^\s*$/) ? line : `<p>${line}</p>`
    )
    .join("\n");
}