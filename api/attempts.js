// api/attempts.js
import { API_BASE, dbg, jsonOrThrow } from "./util.js";

const ATTEMPT_URL = `${API_BASE}/api/attempt`;

export async function saveAttempt({
  uid,
  passageKey,
  partIndex,
  text,
  azureResult,
  // New Atlas Fields
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