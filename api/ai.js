// api/ai.js
// GPT coaching fetcher

import { API_BASE, dbg, jsonOrThrow } from "./util.js";

const FEEDBACK_URL = `${API_BASE}/api/pronunciation-gpt`;

/**
 * Get GPT-powered coaching sections.
 * Now supports 'chunk' to fetch partial reports and 'persona' for tone.
 * @param {{
 * referenceText: string, 
 * azureResult: any, 
 * firstLang?: string, 
 * mode?: "simple"|"detailed",
 * chunk?: number,
 * persona?: "tutor"|"drill"|"linguist"
 * }} params
 */
export async function fetchAIFeedback({
  referenceText,
  azureResult,
  firstLang = "universal",
  mode = "detailed",
  chunk = 1,
  persona = "tutor" // <--- NEW: Default to Tutor
}) {
  // Add persona to payload so the backend knows which style to use
  const payload = { referenceText, azureResult, firstLang, mode, chunk, persona };
  
  dbg("POST", FEEDBACK_URL, { firstLang, mode, chunk, persona });
  
  const resp = await fetch(FEEDBACK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(resp);
}