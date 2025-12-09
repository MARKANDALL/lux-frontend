/* ============================================================================
   CANONICAL SHIM — PROSODY + TIMING GLOBAL BACKFILL
   ---------------------------------------------------------------------------
   - Canonical results renderer imports from here for timing/prosody helpers.
   - Prosody helpers are now sourced from core/prosody/index.js, which is
     currently global-backed but will be the long-term truth source.
   - This file must NOT attach window/globalThis.
   - Phase-E slice: removed hooks shim (header now imports boots directly).
============================================================================ */

import {
  computeTimings,
  median,
  classifyTempo,
  classifyGap,
  renderProsodyRibbon,
} from "../../core/prosody/index.js";

const G = globalThis;

// ------------------------------------------------------------
// Legacy shim (still global-backed for now)
// ------------------------------------------------------------
export const resolveYTLink =
  G.resolveYTLink ||
  ((arg) => {
    try {
      if (typeof G.ytLink === "function") return G.ytLink(arg);
      if (typeof G.ytLink === "string") return G.ytLink;
    } catch {}
    return null;
  });

// ------------------------------------------------------------
// Prosody helpers (re-exported from canonical gateway)
// ------------------------------------------------------------
export { computeTimings, median, classifyTempo, classifyGap, renderProsodyRibbon };
