// features/practice-highlight/practice-highlight.js
// ONE-LINE: Renders a highlighted read-only preview of practice text, showing focus phoneme (blue) and trouble words (yellow).

import { highlightHtml } from "../convo/convo-highlight.js";
import { escapeHtml } from "../../helpers/escape-html.js";

/**
 * Build highlighted HTML for practice passage text.
 *
 * @param {string} text        - The plain passage text
 * @param {object} opts
 * @param {string} opts.focusIpa   - IPA phoneme to highlight in blue (e.g. "t", "ð")
 * @param {string[]} opts.wordBank - Trouble words to highlight in yellow
 * @returns {string} Safe HTML with <span class="lux-hl"> and <span class="lux-hl2"> wraps
 */
export function highlightPracticeText(text, opts = {}) {
  if (!text) return "";

  const focusIpa = opts.focusIpa || "";
  const wordBank = opts.wordBank || [];

  // If no targets at all, just return escaped plain text
  if (!focusIpa && !wordBank.length) return escapeHtml(text);

  // Reuse the convo highlighter — it already handles word-bank (yellow)
  // and focus-phoneme (blue) with the same lux-hl / lux-hl2 classes.
  // Pass autoBlue: true so it auto-highlights words containing the phoneme.
  return highlightHtml(text, {
    wordBank,
    focusIpa,
    autoBlue: true,
  });
}

/**
 * Build a compact legend explaining the highlight colors.
 *
 * @param {object} opts
 * @param {string} opts.focusIpa   - IPA phoneme (shown in legend if present)
 * @param {string[]} opts.wordBank - Trouble words (legend shown if present)
 * @returns {string} HTML for the legend
 */
export function buildPracticeLegend(opts = {}) {
  const focusIpa = opts.focusIpa || "";
  const wordBank = (opts.wordBank || []).filter(Boolean);

  if (!focusIpa && !wordBank.length) return "";

  const items = [];

  if (focusIpa) {
    items.push(`<span class="lux-hl2" style="padding:2px 6px; border-radius:4px;">blue</span> = contains /${escapeHtml(focusIpa)}/`);
  }

  if (wordBank.length) {
    items.push(`<span class="lux-hl" style="padding:2px 6px; border-radius:4px;">yellow</span> = trouble word`);
  }

  return `<div class="lux-practice-legend" style="display:flex; gap:14px; flex-wrap:wrap; font-size:12px; color:#64748b; margin-top:6px; align-items:center;">${items.join("")}</div>`;
}

/**
 * Render (or clear) the highlighted preview + legend into a container element.
 *
 * @param {HTMLElement} previewEl - The container element for the preview
 * @param {string} text          - Plain passage text
 * @param {object} opts
 * @param {string} opts.focusIpa
 * @param {string[]} opts.wordBank
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
    <div class="lux-practice-preview-text" style="
      font-size: 15px;
      line-height: 1.7;
      padding: 12px 14px;
      background: rgba(255,255,255,0.9);
      border: 1px solid rgba(15,23,42,0.08);
      border-radius: 12px;
      white-space: pre-wrap;
      word-break: break-word;
    ">${highlighted}</div>
    ${legend}
  `;
  previewEl.hidden = false;
}