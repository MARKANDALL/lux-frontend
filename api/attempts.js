// api/attempts.js
// UPDATED: Added updateAttempt() to save AI feedback

import { API_BASE, dbg, jsonOrThrow } from "./util.js";

const ATTEMPT_URL = `${API_BASE}/api/attempt`;
const HISTORY_URL = `${API_BASE}/api/user-recent`;
const UPDATE_URL  = `${API_BASE}/api/update-attempt`; // New!

// Helper: YYYY-MM-DD in the user's local day (best-effort)
function localDayKey(ts) {
  const d = new Date(ts);
  try { return d.toLocaleDateString("en-CA"); } catch (_) {}
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}

export async function saveAttempt({
  uid,
  passageKey,
  partIndex,
  text,
  azureResult,
  l1,
  sessionId,
  localTime,

  // NEW (optional): allow callers to pass extra summary fields later
  summary,

  // NEW (optional): gated raw Azure storage (only if you set true)
  storeRawAzure
}) {
  const effectiveLocalTime = localTime || new Date().toISOString();

  const pk = String(passageKey || "");
  const modeDefault = pk.startsWith("convo:") ? "convo" : "practice";
  const day = localDayKey(effectiveLocalTime);

  const baseMeta = {
    schema_version: "attempt.v2",
    mode: modeDefault,
    client_local_day: day
  };
  if (l1) baseMeta.l1 = l1;

  const inSummary = summary && typeof summary === "object" ? summary : {};
  const inMeta =
    inSummary.meta && typeof inSummary.meta === "object" ? inSummary.meta : {};

  const outSummary = {
    ...inSummary,
    meta: { ...baseMeta, ...inMeta }
  };

  const body = {
    uid,
    passageKey,
    partIndex,
    text,
    azureResult,
    l1,
    sessionId,
    localTime: effectiveLocalTime,

    // NEW: this is what enables Patch B’s merge on the backend
    summary: outSummary,

    // NEW (optional): only send if explicitly enabled
    ...(storeRawAzure === true ? { storeRawAzure: true } : {})
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
