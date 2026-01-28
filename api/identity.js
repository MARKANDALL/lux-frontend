// api/identity.js
// Single source of truth for User Identity (UID).
// Handles generation, persistence (localStorage), and global exposure.

const KEY = "LUX_USER_ID";
// Legacy key that older code wrote to. We'll migrate + keep in sync for now.
const LEGACY_KEY = "lux_user_id";

function isUUID(u) {
  const s = String(u || "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

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
  return isUUID(u);
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

  let fromKey = "";
  let fromLegacy = "";
  try {
    fromKey = localStorage.getItem(KEY) || "";
    fromLegacy = localStorage.getItem(LEGACY_KEY) || "";
  } catch (_) {}

  // Precedence (strongest → weakest):
  // 1) ?uid= (explicit override)
  // 2) localStorage KEY (canonical persisted)
  // 3) window.LUX_USER_ID (runtime)
  // 4) legacy localStorage key (migration)
  const existingWin = (window.LUX_USER_ID || "").trim();

  const finalUID = looksValid(fromQuery)
    ? fromQuery
    : looksValid(fromKey)
    ? fromKey
    : looksValid(existingWin)
    ? existingWin
    : looksValid(fromLegacy)
    ? fromLegacy
    : makeUUID();

  // Persist
  window.LUX_USER_ID = finalUID;
  try {
    localStorage.setItem(KEY, finalUID);
    // Keep legacy in sync temporarily (so any straggler code still sees the same UID).
    localStorage.setItem(LEGACY_KEY, finalUID);
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

/**
 * Canonical setter for UID (used when a "real" UID replaces guest UID).
 * Keeps window + localStorage + <html data-uid> in sync.
 */
export function setUID(uid) {
  if (typeof window === "undefined") return null;

  const u = String(uid || "").trim();
  if (!u) return getUID();

  // Respect existing validation if the file already has a looksValid() helper.
  try {
    if (typeof looksValid === "function" && !looksValid(u)) return getUID();
  } catch (_) {}

  window.LUX_USER_ID = u;

  try {
    // Use same keys the file already uses; if these identifiers exist in the module,
    // this will match your current behavior.
    if (typeof KEY !== "undefined") localStorage.setItem(KEY, u);
    if (typeof LEGACY_KEY !== "undefined") localStorage.setItem(LEGACY_KEY, u);

    // Fallback if those constants don't exist (harmless, and keeps behavior consistent).
    localStorage.setItem("lux.uid", u);
    localStorage.setItem("LUX_USER_ID", u);
  } catch (_) {}

  try {
    document.documentElement.setAttribute("data-uid", u);
  } catch (_) {}

  return u;
}
