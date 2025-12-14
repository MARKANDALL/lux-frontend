// api/attempts.js
// UPDATED: Forces the history fetch to use the correct Admin endpoint.

import { API_BASE, dbg, jsonOrThrow } from "./util.js";

const ATTEMPT_URL = `${API_BASE}/api/attempt`;
// ⬇️ THIS IS THE CRITICAL NEW LINE
const HISTORY_URL = `${API_BASE}/api/admin-recent`; 

export async function saveAttempt({
  uid,
  passageKey,
  partIndex,
  text,
  azureResult,
  l1,
  sessionId,
  localTime
}) {
  const body = { 
    uid, 
    passageKey, 
    partIndex, 
    text, 
    azureResult,
    l1,
    sessionId,
    localTime
  };
  
  dbg("POST", ATTEMPT_URL, { uid, passageKey, partIndex, l1 });
  
  const resp = await fetch(ATTEMPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(resp);
}

/**
 * Fetch user history using the admin-recent endpoint
 */
export async function fetchHistory(uid) {
  if (!uid) throw new Error("fetchHistory: UID is required");

  // ⬇️ CRITICAL: Must use HISTORY_URL, not ATTEMPT_URL
  const url = `${HISTORY_URL}?uid=${encodeURIComponent(uid)}&limit=50`;
  
  dbg("GET", url);

  const resp = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  
  const json = await jsonOrThrow(resp);
  // The admin API returns { rows: [...] }
  return json.rows || [];
}