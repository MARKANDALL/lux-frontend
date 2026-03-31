// features/practice-highlight/practice-highlight.js
// ONE-LINE: Renders highlighted practice text with phoneme-containing words (blue), trouble words (yellow), and sub-word letter groups (bold underline).

import { getPhonemeSpellingRule } from "../convo/phoneme-spelling-map.js";
import { escapeHtml } from "../../helpers/escape-html.js";

/**
 * Tokenize text into words and separators, preserving whitespace and punctuation.
 * Returns array of { word, sep } where word is the actual word and sep is trailing separator.
 */
function tokenize(text) {
  const tokens = [];
  const re = /([a-zA-Z'-]+)|([^a-zA-Z'-]+)/g;
  let m;
  while ((m = re.exec(text))) {
    if (m[1]) {
      tokens.push({ type: "word", raw: m[1], index: m.index });
    } else {
      tokens.push({ type: "sep", raw: m[2], index: m.index });
    }
  }
  return tokens;
}

function normWord(w) {
  return String(w || "").trim().toLowerCase().replace(/[^a-z']/g, "");
}

/**
 * Build highlighted HTML for practice passage text.
 * 
 * Words containing the focus phoneme get a blue background (lux-hl2).
 * Within those words, the specific letters producing the phoneme get
 * an extra bold underline (lux-hl-letters).
 * Trouble words get a yellow background (lux-hl).
 * Words that are both get the double-hit style (lux-hl + lux-hl2).
 *
 * @param {string} text
 * @param {object} opts
 * @param {string} opts.focusIpa   - IPA phoneme (e.g. "t", "θ", "ʃ")
 * @param {string[]} opts.wordBank - Trouble words to highlight yellow
 * @returns {string} Safe HTML
 */
export function highlightPracticeText(text, opts = {}) {
  if (!text) return "";

  const focusIpa = String(opts.focusIpa || "").trim();
  const wordBank = (opts.wordBank || []).filter(Boolean);

  if (!focusIpa && !wordBank.length) return escapeHtml(text);

  const rule = focusIpa ? getPhonemeSpellingRule(focusIpa) : null;
  const wbSet = new Set(wordBank.map(normWord).filter(Boolean));

  const tokens = tokenize(text);
  const parts = [];

  for (const tok of tokens) {
    if (tok.type === "sep") {
      parts.push(escapeHtml(tok.raw));
      continue;
    }

    const word = tok.raw;
    const norm = normWord(word);
    const isWb = wbSet.has(norm);
    const isPhoneme = rule ? rule.test(word) : false;

    if (!isWb && !isPhoneme) {
      parts.push(escapeHtml(word));
      continue;
    }

    // Determine the CSS class
    let cls = "";
    if (isWb && isPhoneme) cls = "lux-hl lux-hl2";
    else if (isWb) cls = "lux-hl";
    else cls = "lux-hl2";

    // If phoneme match, try to find the specific letters
    if (isPhoneme && rule) {
      const found = rule.find(word);
      if (found && found.start >= 0 && found.end > found.start && found.end <= word.length) {
        const before = word.slice(0, found.start);
        const letters = word.slice(found.start, found.end);
        const after = word.slice(found.end);

        parts.push(
          `<span class="${cls}">` +
            escapeHtml(before) +
            `<span class="lux-hl-letters">${escapeHtml(letters)}</span>` +
            escapeHtml(after) +
          `</span>`
        );
        continue;
      }
    }

    // Fallback: highlight the whole word without letter marking
    parts.push(`<span class="${cls}">${escapeHtml(word)}</span>`);
  }

  return parts.join("");
}

/**
 * Build a compact legend explaining the highlight colors.
 */
export function buildPracticeLegend(opts = {}) {
  const focusIpa = String(opts.focusIpa || "").trim();
  const wordBank = (opts.wordBank || []).filter(Boolean);

  if (!focusIpa && !wordBank.length) return "";

  const items = [];

  if (focusIpa) {
    items.push(
      `<span class="lux-hl2" style="padding:2px 8px; border-radius:4px; font-weight:700;">` +
        `<span class="lux-hl-letters">blue</span></span>` +
        ` <span style="margin-right:14px;">= contains /${escapeHtml(focusIpa)}/</span>`
    );
  }

  if (wordBank.length) {
    items.push(
      `<span class="lux-hl" style="padding:2px 8px; border-radius:4px; font-weight:700;">yellow</span>` +
        ` <span>= trouble word</span>`
    );
  }

  return `<div class="lux-practice-legend">${items.join("")}</div>`;
}

/**
 * Render (or clear) the highlighted preview + legend into a container element.
 */
export function renderPracticePreview(previewEl, text, opts = {}) {
  if (!previewEl) return;

  const focusIpa = opts.focusIpa || "";
  const wordBank = opts.wordBank || [];

  if (!text || (!focusIpa && !wordBank.length)) {
    previewEl.innerHTML = "";
    previewEl.hidden = true;
    return;
  }

  const highlighted = highlightPracticeText(text, { focusIpa, wordBank });
  const legend = buildPracticeLegend({ focusIpa, wordBank });

  previewEl.innerHTML = `
    <div class="lux-practice-preview-text">${highlighted}</div>
    ${legend}
  `;
  previewEl.hidden = false;
}