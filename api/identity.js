// api/identity.js
// Single source of truth for User Identity (UID).
// Handles generation, persistence (localStorage), and global exposure.

const KEY = "LUX_USER_ID";

function makeUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older envs
  const s = [];
  const h = "0123456789abcdef";
  for (let i = 0; i < 36; i++) s[i] = h[Math.floor(Math.random() * 16)];
  s[14] = "4";
  s[19] = h[(parseInt(s[19], 16) & 0x3) | 0x8];
  s[8] = s[13] = s[18] = s[23] = "-";
  return s.join("");
}

function looksValid(u) {
  return typeof u === "string" && (/^[0-9a-f-]{18,}$/i.test(u) || u.length >= 6);
}

/**
 * Initializes the UID.
 * 1. Checks URL param ?uid=...
 * 2. Checks localStorage
 * 3. Checks global window.LUX_USER_ID
 * 4. Generates new if missing.
 * 5. Saves to all stores.
 */
export function ensureUID() {
  if (typeof window === "undefined") return null;

  const qs = new URLSearchParams(location.search);
  const fromQuery = (qs.get("uid") || "").trim();
  const existing = window.LUX_USER_ID || localStorage.getItem(KEY) || "";

  const finalUID = looksValid(fromQuery)
    ? fromQuery
    : looksValid(existing)
    ? existing
    : makeUUID();

  // Persist
  window.LUX_USER_ID = finalUID;
  try {
    localStorage.setItem(KEY, finalUID);
  } catch (_) {}
  
  // Set attribute for CSS/DOM queries
  document.documentElement.setAttribute("data-uid", finalUID);

  return finalUID;
}

/**
 * Passive getter. Returns currently active UID or null.
 */
export function getUID() {
  if (typeof window !== "undefined" && window.LUX_USER_ID) {
    return window.LUX_USER_ID;
  }
  return ensureUID(); // lazy init if needed
}