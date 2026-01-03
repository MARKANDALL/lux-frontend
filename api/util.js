// api/util.js
const PROD_API = "https://luxury-language-api.vercel.app";

export const API_BASE = (() => {
  const API_BASE = globalThis.API_BASE || import.meta.env.VITE_API_BASE || PROD_API;
  return API_BASE;
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
