/* ============================================================================
   CANONICAL PROSODY GATEWAY — ES MODULES (MODERN)
   ---------------------------------------------------------------------------
   - Aggregates the modernized prosody modules.
   - Consumers (like ui/views/rows.js) import from here.
============================================================================ */

export { computeTimings, median } from "../../prosody/core-calc.js";
export { classifyTempo, classifyGap } from "../../prosody/annotate.js";
export { renderProsodyRibbon } from "../../prosody/prosody-render-bars.js";