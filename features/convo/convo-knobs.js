// features/convo/convo-knobs.js

const KNOBS_KEY = "lux_knobs_v2";  // ← bumped version so old localStorage doesn't conflict
const KNOBS_DEFAULTS = { level: "B1", mood: "neutral", length: "short" };

function loadKnobs() {
  try {
    const raw = localStorage.getItem(KNOBS_KEY);
    if (!raw) return { ...KNOBS_DEFAULTS };
    const parsed = JSON.parse(raw);
    return { ...KNOBS_DEFAULTS, ...(parsed || {}) };
  } catch {
    return { ...KNOBS_DEFAULTS };
  }
}

function saveKnobs(knobs) {
  try {
    localStorage.setItem(KNOBS_KEY, JSON.stringify(knobs));
  } catch {}
}

function knobsSummaryText(knobs) {
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
  return `Level: ${(knobs.level || "B1").toUpperCase()} • Mood: ${cap(knobs.mood)} • Length: ${cap(knobs.length)}`;
}

export { loadKnobs, saveKnobs, knobsSummaryText };