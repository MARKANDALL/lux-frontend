// api/index.js
// The Public API Gatekeeper

export { assessPronunciation } from "./assess.js";
export { fetchAIFeedback } from "./ai.js";

// ✅ THE FIX: Export *everything* from attempts.js
// This automatically includes saveAttempt, fetchHistory, AND updateAttempt
export * from "./attempts.js"; 

export { getUID, ensureUID, setUID } from "./identity.js";
export { API_BASE, dbg } from "./util.js";
