// app-core/state.js
import { passages } from "../src/data/index.js";

// --- global debug hook (browser only)
if (typeof window !== "undefined") {
  window.LUX_DEBUG = true;
  window.luxDbg = function (label, extra) {
    if (!window.LUX_DEBUG) return;
    const ts = new Date().toISOString().split("T")[1].slice(0, 8);
    console.log(`[LUX ${ts}] ${label}`, extra ?? "");
  };
}

// make a tiny local helper so we don't sprinkle window.* everywhere
const dbg = (label, extra) =>
  typeof window !== "undefined" &&
  typeof window.luxDbg === "function" &&
  window.luxDbg(label, extra);

// safer prod check (won't blow up outside browser)
const IS_PROD =
  typeof location !== "undefined" &&
  /luxurylanguagelearninglab\.com$/.test(location.hostname);

// CHANGE: Default is now custom (blank input)
export const DEFAULT_PASSAGE = "custom"; 

// ---- Mutables (single source of truth)
// CHANGE: Allow 'custom' as a valid key, otherwise fallback to first passage
export let currentPassageKey = DEFAULT_PASSAGE;

// CHANGE: If custom, parts is empty array. If passage, get parts.
export let currentParts = (currentPassageKey === "custom") 
  ? [""] 
  : (passages[currentPassageKey]?.parts || []);

export let currentPartIdx = 0;
export let allPartsResults = [];
export let playbackUrl = null;

// CHANGE: Default isCustom to true
export let isCustom = (currentPassageKey === "custom");

// Small helpers
export const $ = (sel, r = document) => r.querySelector(sel);
export const $$ = (sel, r = document) => Array.from(r.querySelectorAll(sel));

export function setCustom(v) {
  isCustom = !!v;
  dbg("state:setCustom", { isCustom });
}
export function setPassageKey(k) {
  currentPassageKey = k;
  dbg("state:setPassageKey", { currentPassageKey });
}
export function setParts(p) {
  currentParts = p || [];
  dbg("state:setParts", { partsLen: currentParts.length });
}
export function setPartIdx(i) {
  currentPartIdx = i | 0;
  dbg("state:setPartIdx", { currentPartIdx });
}
export function setAllPartsResults(arr) {
  allPartsResults = Array.isArray(arr) ? arr : [];
  dbg("state:setAllPartsResults", { resultsLen: allPartsResults.length });
}
export function setPlaybackUrl(u) {
  playbackUrl = u || null;
  dbg("state:setPlaybackUrl", { playbackUrl });
}

export function getChosenLang() {
  const l1Select = $("#l1Select");
  const v = (l1Select?.value || "").trim();
  const lang = v === "" ? "universal" : v;
  dbg("state:getChosenLang", { lang });
  return lang;
}

// Dev convenience (kept from old file)
export function nukeSWInDev() {
  if (
    !IS_PROD &&
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator
  ) {
    navigator.serviceWorker
      .getRegistrations?.()
      .then((rs) => rs.forEach((r) => r.unregister()))
      .catch(() => {});
    dbg("state:nukeSWInDev", "Service workers unregistered in dev");
  }
}
