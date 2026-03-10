// api/attempts.js
// UPDATED: Added updateAttempt() to save AI feedback

import { API_BASE, dbg, apiFetch, getAdminToken } from "./util.js";

const ATTEMPT_URL = `${API_BASE}/api/attempt`;
const HISTORY_URL = `${API_BASE}/api/user-recent`;
const UPDATE_URL  = `${API_BASE}/api/update-attempt`;

function getTokenForWrites() {
  const ENV_ADMIN_TOKEN = (import.meta?.env?.VITE_ADMIN_TOKEN || "").toString().trim();
  return (
    ENV_ADMIN_TOKEN ||
    getAdminToken({
      promptIfMissing: true,
      promptLabel: "Admin Token required to save attempts",
    })
  );
}

// Helper: YYYY-MM-DD in the user's local day (best-effort)
function localDayKey(ts) {
  const d = new Date(ts);
  try { return d.toLocaleDateString("en-CA"); } catch (err) { globalThis.warnSwallow("./api/attempts.js", err); }
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
  summary,
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
    summary: outSummary,
    ...(storeRawAzure === true ? { storeRawAzure: true } : {})
  };

  dbg("POST", ATTEMPT_URL, { uid, passageKey, partIndex, l1 });

  return apiFetch(ATTEMPT_URL, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchHistory(uid) {
  if (!uid) throw new Error("fetchHistory: UID is required");

  const url = `${HISTORY_URL}?uid=${encodeURIComponent(uid)}`;
  dbg("GET", url);

  const json = await apiFetch(url, {
    method: "GET",
  });
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
    return await apiFetch(UPDATE_URL, {
      method: "POST",
      promptIfMissing: true,
      promptLabel: "Admin Token required to save attempts",
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("Failed to update attempt:", err);
  }
}