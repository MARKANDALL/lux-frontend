// api/index.js
export { assessPronunciation } from "./assess.js";
export { fetchAIFeedback } from "./ai.js";
// UPDATE: Export fetchHistory
export { saveAttempt, fetchHistory } from "./attempts.js";
export { getUID, ensureUID } from "./identity.js";
export {
  ENABLE_WIX_SAVE,
  savePronunciationResult,
  saveToWix,
  canSaveToWix,
} from "./wix.js";
export { API_BASE, dbg } from "./util.js";