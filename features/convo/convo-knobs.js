// features/convo/convo-knobs.js

const KNOBS_KEY = "lux_knobs_v1";
const KNOBS_DEFAULTS = { tone: "friendly", stress: "low", pace: "normal" };

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
  return `Tone: ${cap(knobs.tone)} • Stress: ${cap(knobs.stress)} • Pace: ${cap(knobs.pace)}`;
}

export { loadKnobs, saveKnobs, knobsSummaryText };
