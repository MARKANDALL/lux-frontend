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
