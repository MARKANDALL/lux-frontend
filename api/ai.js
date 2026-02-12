// api/ai.js
// GPT coaching fetcher

import { API_BASE, dbg, jsonOrThrow } from "./util.js";
import { getUID } from "./identity.js";
import { getLastAttemptId } from "../app-core/runtime.js";

const FEEDBACK_URL = `${API_BASE}/api/pronunciation-gpt`;
const ADMIN_TOKEN = (import.meta?.env?.VITE_ADMIN_TOKEN || "").toString().trim();

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
  uid = getUID() || "",
  attemptId = getLastAttemptId() || null,
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
    headers: {
      "Content-Type": "application/json",
      ...(ADMIN_TOKEN ? { "x-admin-token": ADMIN_TOKEN } : {}),
    },
    body: JSON.stringify(payload),
  });

  return jsonOrThrow(resp);
}
