// ui/components/score-ring.js
// Shared score ring component. Returns HTML string.

import { scoreClass as scoreClassCore, fmtPct, cefrBand } from '../../core/scoring/index.js';

/**
 * Returns the color token for a score value.
 * @param {number|null} score
 * @returns {'good'|'warn'|'bad'|'na'}
 */
export function scoreTier(score) {
  if (score == null || !Number.isFinite(+score)) return 'na';
  const cls = scoreClassCore(+score);
  if (cls === 'score-good') return 'good';
  if (cls === 'score-warn') return 'warn';
  return 'bad';
}

/**
 * Render the overall score ring.
 *
 * @param {number|null} score  - 0–100 overall score
 * @param {object}      [opts]
 * @param {'sm'|'md'|'lg'} [opts.size='md'] - ring size variant
 * @param {boolean}     [opts.showCefr=false] - show CEFR band below %
 * @returns {string} HTML
 */
export function renderScoreRing(score, opts = {}) {
  const size = opts.size || 'md';
  const showCefr = !!opts.showCefr;

  const tier = scoreTier(score);
  const pct = score == null || !Number.isFinite(+score) ? '—' : fmtPct(Math.round(+score));
  const band = showCefr && score != null ? cefrBand(Math.round(+score)) : '';

  return `
    <div class="lux-ring lux-ring--${size} lux-ring--${tier}">
      <span class="lux-ring__pct">${pct}</span>
      ${band ? `<span class="lux-ring__band">${band}</span>` : ''}
      <span class="lux-ring__label">Overall</span>
    </div>
  `;
}
