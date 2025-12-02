// helpers/core.js
const LUX_KEY = "lux_user_id";

function genUuidV4() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
      12,
      16
    )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 3) | 8;
    return v.toString(16);
  });
}

let _luxId = null;
try {
  _luxId = localStorage.getItem(LUX_KEY) || genUuidV4();
  localStorage.setItem(LUX_KEY, _luxId);
} catch {
  _luxId = genUuidV4();
}

export const LUX_USER_ID = _luxId;
if (typeof window !== "undefined") window.LUX_USER_ID = _luxId;

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
