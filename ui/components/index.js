// ui/components/index.js
// Barrel export for unified card components.

// ── Building blocks ──
export { renderScoreRing, scoreTier } from './score-ring.js';
export { renderMetricTiles, TILE_KEYS, MODAL_KEY_MAP } from './metric-tiles.js';
export { renderTroubleSection, wireTroubleChips } from './trouble-chips.js';

// ── Composed card ──
export {
  renderCardRow,
  renderCardExpanded,
  renderDetailSection,
  wireCard,
} from './lux-card.js';
