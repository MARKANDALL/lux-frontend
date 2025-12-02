/* ============================================================================
   CANONICAL PROSODY GATEWAY — GLOBAL-BACKED (PHASE-E)
   ---------------------------------------------------------------------------
   - Truthy entrypoint for prosody helpers used by the results renderer.
   - For now, this module simply proxies to globalThis:
       computeTimings, median, classifyTempo, classifyGap, renderProsodyRibbon.
   - View-layer shims (ui/views/deps.js, ui/views/rows.js, ui/views/summary.js)
     should import from here instead of reading globalThis directly.
   - Future Phase-E slices can move real implementations in here while keeping
     the public surface stable.
============================================================================ */

const G = globalThis;

// NOTE: These are intentionally direct references (no wrappers) to avoid
// changing behavior: if a helper is missing, callers will see `undefined`
// just as they did when importing straight from globalThis.
export const computeTimings = G.computeTimings;
export const median = G.median;
export const classifyTempo = G.classifyTempo;
export const classifyGap = G.classifyGap;
export const renderProsodyRibbon = G.renderProsodyRibbon;
