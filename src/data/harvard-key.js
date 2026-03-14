// src/data/harvard-key.js
// ONE-LINE: Canonical Harvard list key helpers shared by Harvard feature modules.

export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function harvardKey(n) {
  return `harvard${pad2(n)}`;
}

export function isHarvardKey(k) {
  return /^harvard\d{2}$/i.test(String(k || ""));
}