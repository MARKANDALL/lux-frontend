// api.js
// Centralized network calls used by the app.

/* ================== Feature flags & debug ================== */
export const ENABLE_WIX_SAVE = false; // flip to true only on prod when CORS is fixed
if (window && typeof window.__DEBUG_AI !== "boolean") {
  window.__DEBUG_AI = true;
}
export function dbg(...args) {
  if (window?.__DEBUG_AI) console.log("[AI]", ...args);
}

/* ================== Endpoints & base resolvers ================== */
export const API_BASE = "https://luxury-language-api.vercel.app";
const ASSESS_URL = `${API_BASE}/api/assess`;
const FEEDBACK_URL = `${API_BASE}/api/pronunciation-gpt`;
const ATTEMPT_URL = `${API_BASE}/api/attempt`;

/** Read the UID that GuaranteeAUID sets (index.html). */
export function getUID() {
  return (
    window.LUX_USER_ID ||
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("LUX_USER_ID")) ||
    null
  );
}

function isProdHost() {
  try {
    return location.hostname.endsWith("luxurylanguagelearninglab.com");
  } catch {
    return false;
  }
}
function wixFunctionsBase() {
  const host = (typeof location !== "undefined" && location.hostname) || "";
  return host.includes("wix-editor")
    ? "https://www.luxurylanguagelearninglab.com/_functions-dev"
    : "https://www.luxurylanguagelearninglab.com/_functions";
}

/* ================== Internal fetch helpers ================== */
async function jsonOrThrow(resp) {
  const text = await resp.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    const snippet = text?.slice(0, 200) || "(empty)";
    const err = new Error(`Bad JSON (${resp.status}): ${snippet}`);
    err.status = resp.status;
    throw err;
  }
  if (!resp.ok) {
    const msg =
      (data && (data.error || data.message)) ||
      resp.statusText ||
      "Request failed";
    const err = new Error(msg);
    err.status = resp.status;
    err.body = data;
    throw err;
  }
  return data;
}

/* ================== Public API surface ================== */

/**
 * Upload a recording + reference text for Azure assessment.
 * @param {{audioBlob: Blob, text: string, firstLang?: string}} params
 * @returns {Promise<any>} Parsed JSON assessment payload (Azure result)
 */
export async function assessPronunciation({ audioBlob, text, firstLang }) {
  const fd = new FormData();
  fd.append("audio", audioBlob, "recording.wav");
  fd.append("text", text ?? "");
  if (firstLang) fd.append("firstLang", firstLang);

  dbg("POST", ASSESS_URL, { textLen: (text || "").length, firstLang });
  const resp = await fetch(ASSESS_URL, { method: "POST", body: fd });
  return jsonOrThrow(resp);
}

/**
 * Get GPT-powered coaching sections from the assessment result.
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

/**
 * Save a single attempt to your backend (Supabase pipeline behind /api/attempt).
 * Call this RIGHT AFTER Azure returns, so the row is written even if the user
 * closes the page before AI feedback finishes.
 *
 * @param {{ uid:string, passageKey:string, partIndex:number, text:string, azureResult:any }} payload
 * @returns {Promise<any>}
 */
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

/**
 * Save a single pronunciation result to Wix Functions (gated by flag + host).
 * Returns `{skipped:true}` when disabled or not on prod host.
 * @param {{userId?:string|null, passageKey:string, partIndex:number, text:string, azureResult:any}} payload
 * @returns {Promise<any>|{skipped:true}}
 */
export async function savePronunciationResult({
  userId = null,
  passageKey,
  partIndex,
  text,
  azureResult,
}) {
  const url = `${wixFunctionsBase()}/pronunciationResults`;

  if (!(ENABLE_WIX_SAVE && isProdHost())) {
    console.info("Skipping Wix save (disabled or not on prod host).");
    return { skipped: true };
  }

  const body = { userId, passageKey, partIndex, text, azureResult };
  dbg("POST", url, { passageKey, partIndex });
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return jsonOrThrow(resp);
}

/** Compatibility wrapper if existing code calls `saveToWix(payload)`. */
export function saveToWix(payload) {
  return savePronunciationResult(payload);
}

/** Quick helper the UI can use to decide whether to show "saving" UI */
export function canSaveToWix() {
  return ENABLE_WIX_SAVE && isProdHost();
}

/* ================== How/where to call saveAttempt (example) ==================

In your recording flow (likely in app-core.js):

  import { assessPronunciation, saveAttempt, getUID, fetchAIFeedback } from './api.js';

  // ... after you stop recording and have the blob/text:
  const azureResult = await assessPronunciation({ audioBlob, text, firstLang });

  // Write the attempt immediately so it persists even if user navigates away
  await saveAttempt({
    uid: getUID(),           // comes from GuaranteeAUID script in index.html
    passageKey,              // e.g. 'rainbow'
    partIndex,               // current part number
    text,                    // reference text read by the user
    azureResult              // the full Azure JSON you just received
  });

  // (optional) then fetch AI coaching
  const ai = await fetchAIFeedback({ referenceText: text, azureResult, firstLang });

============================================================================= */
