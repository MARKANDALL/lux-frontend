// api/ai.js
// GPT coaching fetcher (split out of the old monolith)

import { API_BASE, dbg, jsonOrThrow } from "./util.js";

// Endpoint (same base as other API pieces)
const FEEDBACK_URL = `${API_BASE}/api/pronunciation-gpt`;

/**
 * Get GPT-powered coaching sections from the Azure assessment result.
 * @param {{referenceText:string, azureResult:any, firstLang?:string, mode?:string}} params
 * @returns {Promise<{sections?:any[], fallbackSections?:any[]}>}
 */
export async function fetchAIFeedback({
  referenceText,
  azureResult,
  firstLang = "universal",
  mode = "detailed" // Default to old behavior
}) {
  const payload = { referenceText, azureResult, firstLang, mode };
  dbg("POST", FEEDBACK_URL, { firstLang, mode });
  const resp = await fetch(FEEDBACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(resp);
}