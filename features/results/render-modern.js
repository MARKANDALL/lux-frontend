/* ============================================================================
   PHASE-E CANONICAL RENDERER (thin adapter)
   ---------------------------------------------------------------------------
   - Calls into render-core.js for the real work.
   - Keeps legacy guards & output identical.
   - NO behavior changes.
============================================================================ */

// ui/views/render-modern.js
import { preparePrettyOut, preparePrettyOutSingle } from "./render-helpers.js";
import {
  renderPrettyResultsCore,
  renderDetailedAnalysisCore,
} from "./render-core.js";

export function showPrettyResults(data) {
  const { $out, nbest, stop } = preparePrettyOut(data);
  if (stop) return;

  renderPrettyResultsCore({ $out, data, nbest });
}

export function showDetailedAnalysisSingle(data) {
  const { $out, nbest, stop } = preparePrettyOutSingle(data);
  if (stop) return;

  renderDetailedAnalysisCore({ $out, data, nbest });
}
