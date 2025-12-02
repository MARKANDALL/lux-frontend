// api/ai.js
// GPT coaching fetcher (split out of the old monolith)

import { API_BASE, dbg, jsonOrThrow } from "./util.js";

// Endpoint (same base as other API pieces)
const FEEDBACK_URL = `${API_BASE}/api/pronunciation-gpt`;

/**
 * Get GPT-powered coaching sections from the Azure assessment result.
 * @param {{referenceText:string, azureResult:any, firstLang?:string}} params
 * @returns {Promise<{sections?:any[], fallbackSections?:any[]}>}
 */
export async function fetchAIFeedback({
  referenceText,
  azureResult,
  firstLang = "universal",
}) {
  const payload = { referenceText, azureResult, firstLang };
  dbg("POST", FEEDBACK_URL, { firstLang });
  const resp = await fetch(FEEDBACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(resp);
}
