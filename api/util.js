// api/util.js
const PROD_API = "https://luxury-language-api.vercel.app";

export const API_BASE = (() => {
  const explicit = globalThis.API_BASE || import.meta.env.VITE_API_BASE;

  // ✅ Dev: default to same-origin so "/api/..." hits Vite proxy
  if (import.meta.env.DEV) return explicit || "";

  // ✅ Prod: default to production backend
  return explicit || PROD_API;
})();

export function dbg(...args) {
  if (globalThis?.__DEBUG_AI === true) console.log("[AI]", ...args);
}

export async function jsonOrThrow(resp) {
  const text = await resp.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
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

// Reuse the same admin token storage Streaming uses.
// (Streaming saves to sessionStorage/localStorage key: "lux_admin_token")
export function getAdminToken({
  promptIfMissing = false,
  promptLabel = "Admin Token required.",
} = {}) {
  if (typeof window === "undefined") return "";

  let t =
    sessionStorage.getItem("lux_admin_token") ||
    localStorage.getItem("lux_admin_token") ||
    "";

  if (!t && promptIfMissing) {
    t = prompt(`⚠️ ${promptLabel} Please paste it here:`) || "";
    t = t.trim();
    if (t) {
      sessionStorage.setItem("lux_admin_token", t);
      localStorage.setItem("lux_admin_token", t);
    }
  }

  return t || "";
}

// ─────────────────────────────────────────────────────────────────────────────
// apiFetch — single place that always attaches x-admin-token for admin-gated
// routes. Use this for any new API helpers going forward so the token can
// never be forgotten in an individual file again.
//
// Usage:
//   const data = await apiFetch("/api/some-route", { method: "POST", body: fd });
//
// For multipart FormData, do NOT pass Content-Type — the browser sets it.
// For JSON, pass body: JSON.stringify(payload) and it will set Content-Type automatically.
//
// responseType (default "json"):
//   "json" — parse via jsonOrThrow (existing behavior, all current callers)
//   "blob" — return resp.blob() (for binary audio, images, etc.)
//   "text" — return resp.text() (for plain-text or HTML responses)
//   "response" — return the raw Response object (for custom handling)
// ─────────────────────────────────────────────────────────────────────────────
export async function apiFetch(url, opts = {}) {
  const {
    headers: callerHeaders,
    body,
    promptIfMissing = false,
    promptLabel,
    responseType = "json",
    ...rest
  } = opts;

  // Build-time env token takes priority, then storage, then optionally prompt.
  const envToken = (import.meta?.env?.VITE_ADMIN_TOKEN || "").toString().trim();
  const token = envToken || getAdminToken({ promptIfMissing, promptLabel });

  // Auto Content-Type for JSON strings; leave FormData alone (browser handles it).
  const contentType =
    typeof body === "string" ? { "Content-Type": "application/json" } : {};

  const headers = {
    ...contentType,
    ...(callerHeaders || {}),
    ...(token ? { "x-admin-token": token } : {}),
  };

  const resp = await fetch(url, { headers, body, ...rest });

  if (responseType === "blob") {
    if (!resp.ok) {
      const err = new Error(`Request failed (${resp.status})`);
      err.status = resp.status;
      throw err;
    }
    return resp.blob();
  }

  if (responseType === "text") {
    if (!resp.ok) {
      const err = new Error(`Request failed (${resp.status})`);
      err.status = resp.status;
      throw err;
    }
    return resp.text();
  }

  if (responseType === "response") {
    return resp;
  }

  return jsonOrThrow(resp);
}