// features/results/index.js
// Thin adapter/re-export for results rendering.
// Canonical implementation lives in ui/views/index.js.

import {
  showPrettyResults,
  showDetailedAnalysisSingle,
  showSummary,
  showRawData,
  updateSummaryVisibility,
} from "../../ui/views/index.js";

export {
  showPrettyResults,
  showDetailedAnalysisSingle,
  showSummary,
  showRawData,
  updateSummaryVisibility,
};

// Back-compat globals
if (typeof window !== "undefined") {
  window.showPrettyResults = window.showPrettyResults || showPrettyResults;
  window.showSummary = window.showSummary || showSummary;
  window.showDetailedAnalysisSingle =
    window.showDetailedAnalysisSingle || showDetailedAnalysisSingle;
  window.showRawData = window.showRawData || showRawData;
  window.updateSummaryVisibility =
    window.updateSummaryVisibility || updateSummaryVisibility;
}
