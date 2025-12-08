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

const dbg = (label, extra) =>
  typeof window !== "undefined" &&
  typeof window.luxDbg === "function" &&
  window.luxDbg(label, extra);

const IS_PROD =
  typeof location !== "undefined" &&
  /luxurylanguagelearninglab\.com$/.test(location.hostname);

export const DEFAULT_PASSAGE = "custom"; 

// ---- Mutables (single source of truth)
export let currentPassageKey = DEFAULT_PASSAGE;

export let currentParts = (currentPassageKey === "custom") 
  ? [""] 
  : (passages[currentPassageKey]?.parts || []);

export let currentPartIdx = 0;
export let allPartsResults = []; // <--- The Source of Truth
export let playbackUrl = null;

export let isCustom = (currentPassageKey === "custom");

// ---- Session State
let _sessionId = null;

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

// --- NEW: Atomic State Updates (Cleaner than manual array manipulation) ---
export function pushPartResult(idx, result) {
  allPartsResults[idx] = result;
  dbg("state:pushPartResult", { idx, score: result?.NBest?.[0]?.AccuracyScore });
}

export function resetSessionResults() {
  allPartsResults = [];
  dbg("state:resetSessionResults", "cleared");
}

export function getChosenLang() {
  const l1Select = $("#l1Select");
  const v = (l1Select?.value || "").trim();
  const lang = v === "" ? "universal" : v;
  return lang;
}

export function getSessionId() {
  if (!_sessionId) {
    _sessionId = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
  }
  return _sessionId;
}

export function nukeSWInDev() {
  if (!IS_PROD && typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations?.().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
    dbg("state:nukeSWInDev", "Service workers unregistered");
  }
}