// ui/lux-warn.js
// Centralized swallowed-error warning control (ON / OFF / IMPORTANT-ONLY)

import { K_WARN_MODE } from '../app-core/lux-storage.js';

const KEY = K_WARN_MODE; // "on" | "off" | "important"

function safeConsoleWarn(prefix, err) {
  try {
    if (typeof console !== "undefined" && console && typeof console.warn === "function") {
      console.warn(prefix, err);
    }
  } catch (e) {
    // Intentionally swallow: logger must never throw.
  }
}

function safeConsoleLog(...args) {
  try {
    if (typeof console !== "undefined" && console && typeof console.log === "function") {
      console.log(...args);
    }
  } catch (e) {
    // Intentionally swallow: logger must never throw.
  }
}

function readMode() {
  try {
    return (localStorage.getItem(KEY) || "").toLowerCase();
  } catch (err) {
    safeConsoleWarn("[ui/lux-warn.js] swallowed error (readMode)", err);
    return "";
  }
}

function defaultMode() {
  // Dev default: IMPORTANT only. Prod default: OFF.
  try {
    if (import.meta && import.meta.env && import.meta.env.PROD) return "off";
  } catch (err) {
    safeConsoleWarn("[ui/lux-warn.js] swallowed error (defaultMode)", err);
  }
  return "important";
}

export function setWarnSwallowMode(mode) {
  const m = String(mode || "").toLowerCase();
  if (!["on", "off", "important"].includes(m)) return false;

  try {
    localStorage.setItem(KEY, m);
  } catch (err) {
    safeConsoleWarn("[ui/lux-warn.js] swallowed error (setWarnSwallowMode)", err);
  }
  return true;
}

export function getWarnSwallowMode() {
  const m = readMode();
  return ["on", "off", "important"].includes(m) ? m : defaultMode();
}

// levels: "low" | "important"
export function warnSwallow(tag, err, level = "low") {
  const mode = getWarnSwallowMode();
  if (mode === "off") return;
  if (mode === "important" && String(level) !== "important") return;

  try {
    if (typeof console !== "undefined" && console && typeof console.warn === "function") {
      console.warn(`[LUX_SWALLOW] ${tag}`, err);
    }
  } catch (e) {
    // Intentionally swallow: logger must never throw.
  }
}

// --- DevTools convenience + global access (no imports needed anywhere) ---
try {
  window.LuxWarn = Object.assign(window.LuxWarn || {}, {
    set: setWarnSwallowMode,
    get: getWarnSwallowMode,
  });

  // Make warnSwallow callable without imports (module scope won't see it otherwise)
  window.warnSwallow = warnSwallow;

  safeConsoleLog("[LuxWarn] ready:", window.LuxWarn.get());
} catch (err) {
  safeConsoleWarn("[ui/lux-warn.js] swallowed error (global attach)", err);
}