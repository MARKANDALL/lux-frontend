// helpers/md-to-html.js
// Canonical markdown-to-HTML helper.
// Escapes first, then applies a tiny stable subset of formatting.

import { escapeHtml } from "./escape-html.js";

const SPECIAL_H3_RE =
  /^\s*(🏃‍♂️ Quick Coaching|🔤 Phoneme Profile|✋ Reassurance|💡 Did You Know\?|🌍 World Language Spotlight)\s*$/gm;

const BLOCK_TAG_RE = /^<(?:h3|ul|\/ul|li|\/li)>/;

export function mdToHtml(md = "", options = {}) {
  const {
    lists = true,
    headings = false,
    specialHeadings = false,
    paragraphs = false,
    preserveLineBreaks = true,
  } = options;

  const src = String(md || "");
  if (!src.trim()) return "";

  let html = escapeHtml(src).replace(/\r\n/g, "\n");

  if (headings) {
    html = html
      .replace(/^(#{2,3} .+?)\s+(?=[^\n])/gm, "$1\n")
      .replace(/^#{2,3}\s+(.+)$/gm, "<h3>$1</h3>");
  }

  if (specialHeadings) {
    html = html.replace(SPECIAL_H3_RE, "<h3>$1</h3>");
  }

  html = html
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

  if (lists) {
    html = html.replace(/(?:^|\n)((?:[-•]\s+.+(?:\n|$))+)/g, (_m, block) => {
      const items = block
        .trim()
        .split("\n")
        .map((line) => line.replace(/^[-•]\s+/, "").trim())
        .filter(Boolean)
        .map((text) => `<li>${text}</li>`)
        .join("");

      return `\n<ul>${items}</ul>\n`;
    });
  }

  if (paragraphs) {
    return html
      .split("\n")
      .map((line) =>
        BLOCK_TAG_RE.test(line) || !line.trim() ? line : `<p>${line}</p>`
      )
      .join("\n");
  }

  if (!preserveLineBreaks) return html;

  return html
    .split("\n")
    .map((line) => {
      if (!line.trim()) return "<br>";
      if (BLOCK_TAG_RE.test(line)) return line;
      return `${line}<br>`;
    })
    .join("")
    .replace(/(?:<br>)+$/, "");
}