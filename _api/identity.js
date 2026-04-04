// api/identity.js
// Single source of truth for User Identity (UID).
// Handles generation, persistence (localStorage), and global exposure.

import {
  K_IDENTITY_UID,
  K_IDENTITY_UID_ALIAS,
  K_IDENTITY_UID_LEGACY,
} from "../app-core/lux-storage.js";

const KEY = K_IDENTITY_UID;
// Legacy key that older code wrote to. We'll migrate + keep in sync for now.
const LEGACY_KEY = K_IDENTITY_UID_LEGACY;
const ALIAS_KEY = K_IDENTITY_UID_ALIAS;

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
  let fromAlias = "";
  let fromLegacy = "";
  try {
    fromKey = localStorage.getItem(KEY) || "";
    fromAlias = localStorage.getItem(ALIAS_KEY) || "";
    fromLegacy = localStorage.getItem(LEGACY_KEY) || "";
  } catch (err) { globalThis.warnSwallow("api/identity.js", err, "important"); }

  // Precedence (strongest → weakest):
  // 1) ?uid= (explicit override)
  // 2) localStorage KEY (canonical persisted)
  // 3) window.LUX_USER_ID (runtime)
  // 4) alias localStorage key (older migration path)
  // 5) legacy localStorage key (migration)
  const existingWin = (window.LUX_USER_ID || "").trim();

  const finalUID = looksValid(fromQuery)
    ? fromQuery
    : looksValid(fromKey)
    ? fromKey
    : looksValid(existingWin)
    ? existingWin
    : looksValid(fromAlias)
    ? fromAlias
    : looksValid(fromLegacy)
    ? fromLegacy
    : makeUUID();

  // Persist
  window.LUX_USER_ID = finalUID;
  try {
    localStorage.setItem(KEY, finalUID);
    localStorage.setItem(ALIAS_KEY, finalUID);
    // Keep legacy in sync temporarily (so any straggler code still sees the same UID).
    localStorage.setItem(LEGACY_KEY, finalUID);
  } catch (err) { globalThis.warnSwallow("api/identity.js", err, "important"); }

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
  } catch (err) { globalThis.warnSwallow("api/identity.js", err, "important"); }

  window.LUX_USER_ID = u;

  try {
    localStorage.setItem(KEY, u);
    localStorage.setItem(ALIAS_KEY, u);
    localStorage.setItem(LEGACY_KEY, u);
  } catch (err) { globalThis.warnSwallow("api/identity.js", err, "important"); }

  try {
    document.documentElement.setAttribute("data-uid", u);
  } catch (err) { globalThis.warnSwallow("api/identity.js", err, "important"); }

  return u;
}