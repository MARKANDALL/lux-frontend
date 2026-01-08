// helpers/core.js
import { getUID } from "../api/identity.js";

// Single source of truth for UID:
// - api/identity.js owns generation + persistence + migration
export const LUX_USER_ID = typeof window !== "undefined" ? getUID() : null;

export function scoreClass(score) {
  if (score == null || Number.isNaN(+score)) return "";
  if (score >= 85) return "score-good";
  if (score >= 70) return "score-warn";
  return "score-bad";
}

export const buildYouglishUrl = (w) =>
  `https://youglish.com/pronounce/${encodeURIComponent(w)}/english`;

export const isCorrupt = (s) =>
  /[�‘’“”—–…•\u0080-\uFFFF]/.test(String(s || ""));

export function encouragingLine() {
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
export function mdToHtml(md) {
  md = String(md || "")
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
