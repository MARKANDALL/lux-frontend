// api/ai.js
// GPT coaching fetcher

import { API_BASE, dbg, jsonOrThrow } from "./util.js";

const FEEDBACK_URL = `${API_BASE}/api/pronunciation-gpt`;

/**
 * Get GPT-powered coaching sections.
 * Now supports 'chunk' to fetch partial reports and 'persona' for tone.
 * Also supports QuickTips paging + optional history injection.
 * @param {{
 * referenceText: string,
 * azureResult: any,
 * firstLang?: string,
 * mode?: "simple"|"detailed",
 * chunk?: number,
 * persona?: "tutor"|"drill"|"linguist",
 * uid?: string,
 * attemptId?: number|null,
 * tipIndex?: number,
 * tipCount?: number,
 * includeHistory?: boolean|undefined
 * }} params
 */
export async function fetchAIFeedback({
  referenceText,
  azureResult,
  firstLang = "universal",
  mode = "detailed",
  chunk = 1,
  persona = "tutor", // <--- Default to Tutor

  // NEW
  uid = window.LUX_USER_ID || "",
  attemptId = window.lastAttemptId || null,
  tipIndex = 0,
  tipCount = 3,
  includeHistory = undefined
}) {
  // Add new fields to payload so backend can do model selection + tip paging + optional history
  const payload = {
    referenceText,
    azureResult,
    firstLang,
    mode,
    chunk,
    persona,
    uid,
    attemptId,
    tipIndex,
    tipCount,
    includeHistory
  };

  dbg("POST", FEEDBACK_URL, { firstLang, mode, chunk, persona, uid, attemptId, tipIndex, tipCount, includeHistory });

  const resp = await fetch(FEEDBACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return jsonOrThrow(resp);
}
