// api/attempts.js
import { API_BASE, dbg, jsonOrThrow } from "./util.js";

const ATTEMPT_URL = `${API_BASE}/api/attempt`;

export async function saveAttempt({
  uid,
  passageKey,
  partIndex,
  text,
  azureResult,
}) {
  const body = { uid, passageKey, partIndex, text, azureResult };
  dbg("POST", ATTEMPT_URL, { uid, passageKey, partIndex });
  const resp = await fetch(ATTEMPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(resp);
}
