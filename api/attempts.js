// api/attempts.js
// UPDATED: Added updateAttempt() to save AI feedback

import { API_BASE, dbg, jsonOrThrow } from "./util.js";

const ATTEMPT_URL = `${API_BASE}/api/attempt`;
const HISTORY_URL = `${API_BASE}/api/user-recent`; 
const UPDATE_URL  = `${API_BASE}/api/update-attempt`; // New!

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
  
  // We need to return the ID so we can update this record later!
  return jsonOrThrow(resp); 
}

export async function fetchHistory(uid) {
  if (!uid) throw new Error("fetchHistory: UID is required");

  const url = `${HISTORY_URL}?uid=${encodeURIComponent(uid)}`;
  dbg("GET", url);

  const resp = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });
  
  const json = await jsonOrThrow(resp);
  return json.rows || [];
}

/**
 * Updates an existing attempt (e.g. to attach AI feedback)
 */
export async function updateAttempt(id, aiFeedbackData) {
  if (!id) {
    console.warn("updateAttempt: No ID provided, cannot save.");
    return;
  }

  const body = {
    id: id,
    ai_feedback: aiFeedbackData
  };

  dbg("POST", UPDATE_URL, body);

  try {
    const resp = await fetch(UPDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return jsonOrThrow(resp);
  } catch (err) {
    console.error("Failed to update attempt:", err);
    // Don't throw, just log. It's not critical if saving feedback fails.
  }
}