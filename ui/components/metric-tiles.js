// ui/components/metric-tiles.js
// Shared metric tiles row component. Returns HTML string.
// Tiles are clickable — the click handler is wired externally by the metric-modal system.

import { scoreTier } from './score-ring.js';

const TILE_LABELS = {
  accuracy:     'Accuracy',
  fluency:      'Fluency',
  completeness: 'Complete',
  pronunciation:'Pronun.',
  prosody:      'Prosody',
};

const TILE_KEYS = ['accuracy', 'fluency', 'completeness', 'pronunciation', 'prosody'];

// Mapping from our keys to the metric-modal metricKey names
// (metric-modal expects title-case names like "Accuracy", "Fluency", etc.)
const MODAL_KEY_MAP = {
  accuracy:      'Accuracy',
  fluency:       'Fluency',
  completeness:  'Completeness',
  pronunciation: 'Pronunciation',
  prosody:       'Prosody',
};

/**
 * Format a single tile value.
 * @param {number|null} v
 * @returns {string}
 */
function fmtTile(v) {
  if (v == null || !Number.isFinite(+v)) return '—';
  return `${Math.round(+v)}%`;
}

/**
 * Render the 5-tile metric row.
 *
 * @param {object} scores
 * @param {number|null} scores.accuracy
 * @param {number|null} scores.fluency
 * @param {number|null} scores.completeness
 * @param {number|null} scores.pronunciation
 * @param {number|null} scores.prosody
 * @param {object}      [opts]
 * @param {string}      [opts.rateStr] - speaking rate string (e.g. "~2.3 w/s") shown under Prosody
 * @returns {string} HTML
 */
export function renderMetricTiles(scores = {}, opts = {}) {
  const rateStr = opts.rateStr || '';

  const tiles = TILE_KEYS.map((key) => {
    const val = scores[key];
    const tier = scoreTier(val);
    const label = TILE_LABELS[key];
    const modalKey = MODAL_KEY_MAP[key];
    const meta = key === 'prosody' && rateStr
      ? `<div class="lux-tile__meta">${rateStr}</div>`
      : '';

    return `
      <div class="lux-tile lux-tile--${tier}"
           data-score-key="${modalKey}"
           role="button"
           tabindex="0"
           title="Click for ${label} details">
        <div class="lux-tile__label">${label}</div>
        <div class="lux-tile__value">${fmtTile(val)}</div>
        ${meta}
      </div>
    `;
  });

  return `<div class="lux-tiles">${tiles.join('')}</div>`;
}

export { TILE_KEYS, MODAL_KEY_MAP };
