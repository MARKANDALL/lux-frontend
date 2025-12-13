// api/ai.js
// GPT coaching fetcher

import { API_BASE, dbg, jsonOrThrow } from "./util.js";

const FEEDBACK_URL = `${API_BASE}/api/pronunciation-gpt`;

/**
 * Get GPT-powered coaching sections.
 * Now supports 'chunk' to fetch partial reports.
 * * @param {{
 * referenceText: string, 
 * azureResult: any, 
 * firstLang?: string, 
 * mode?: "simple"|"detailed",
 * chunk?: number
 * }} params
 */
export async function fetchAIFeedback({
  referenceText,
  azureResult,
  firstLang = "universal",
  mode = "detailed",
  chunk = 1
}) {
  const payload = { referenceText, azureResult, firstLang, mode, chunk };
  dbg("POST", FEEDBACK_URL, { firstLang, mode, chunk });
  
  const resp = await fetch(FEEDBACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(resp);
}