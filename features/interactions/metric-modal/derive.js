// features/interactions/metric-modal/derive.js
// Orchestrator/shim — re-exports all public API from submodules.
// Call sites (render.js etc.) import from here unchanged.

export { getScorePack, getScorePackFromSummary, getScorePackAny, hasRawWordDetail } from "./derive/score.js";
export { deriveTimingStats } from "./derive/timing.js";
export { deriveErrorStats, prettyErrCounts, deriveCompletenessDiff, derivePhonemeClassSplit } from "./derive/errors.js";