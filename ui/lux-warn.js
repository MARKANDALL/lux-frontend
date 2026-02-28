// ui/lux-warn.js
// Centralized swallowed-error warning control (ON / OFF / IMPORTANT-ONLY)

const KEY = "LUX_WARN_SWALLOW_MODE"; // "on" | "off" | "important"

function readMode() {
  try {
    return (localStorage.getItem(KEY) || "").toLowerCase();
  } catch {
    return "";
  }
}

function defaultMode() {
  // Dev default: IMPORTANT only. Prod default: OFF.
  try {
    if (import.meta && import.meta.env && import.meta.env.PROD) return "off";
  } catch {}
  return "important";
}

export function setWarnSwallowMode(mode) {
  const m = String(mode || "").toLowerCase();
  if (!["on", "off", "important"].includes(m)) return false;
  try { localStorage.setItem(KEY, m); } catch {}
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
    console.warn(`[LUX_SWALLOW] ${tag}`, err);
  } catch {
    // never throw from logger
  }
}

try {
  // Allow call sites to use warnSwallow(...) without imports
  window.warnSwallow = warnSwallow;
} catch {
  // never throw from logger
}

// Optional convenience in DevTools:
//   window.LuxWarn.set("on"|"off"|"important")
try {
  window.LuxWarn = Object.assign(window.LuxWarn || {}, {
    set: setWarnSwallowMode,
    get: getWarnSwallowMode,
  });
} catch {}