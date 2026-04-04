// api/ai.js
// GPT coaching fetcher

import { API_BASE, dbg, apiFetch } from "./util.js";
import { getUID } from "./identity.js";
import { getLastAttemptId } from "../app-core/runtime.js";

const FEEDBACK_URL = `${API_BASE}/api/pronunciation-gpt`;

/**
 * Get GPT-powered coaching sections.
 * Now supports 'chunk' to fetch partial reports and 'persona' for tone.
 * Also supports QuickTips paging + optional history injection.
 */
export async function fetchAIFeedback({
  referenceText,
  azureResult,
  firstLang = "universal",
  mode = "detailed",
  chunk = 1,
  persona = "tutor",
  uid = getUID() || "",
  attemptId = getLastAttemptId() || null,
  tipIndex = 0,
  tipCount = 3,
  includeHistory = undefined
}) {
  const payload = {
    referenceText, azureResult, firstLang, mode, chunk, persona,
    uid, attemptId, tipIndex, tipCount, includeHistory
  };

  dbg("POST", FEEDBACK_URL, { firstLang, mode, chunk, persona, uid, attemptId, tipIndex, tipCount, includeHistory });

  return apiFetch(FEEDBACK_URL, {
    method: "POST",
    promptIfMissing: true,
    promptLabel: "Admin Token required for AI Coach (Quick Tips)",
    body: JSON.stringify(payload),
  });
}