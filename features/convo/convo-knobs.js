// features/convo/convo-knobs.js

const KNOBS_KEY = "lux_knobs_v3";  // v3: mood→tone, expanded options
const KNOBS_DEFAULTS = { level: "B1", tone: "neutral", length: "medium" };

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
    // Fire unified event so all listeners (chip drawer, summaries) stay in sync
    window.dispatchEvent(new CustomEvent("lux:knobs", { detail: knobs }));
} catch (err) { console.warn("[features/convo/convo-knobs.js] swallowed error", err); }
}

function knobsSummaryText(knobs, roleLabel = null) {
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
  const EMOJI = {
    neutral:"😐", formal:"👔", friendly:"😊", enthusiastic:"🤩", encouraging:"💪",
    playful:"😜", flirty:"😏", sarcastic:"🙄", tired:"😴", distracted:"📱",
    cold:"🧊", blunt:"🔨", impatient:"⏱️", irritable:"😤", angry:"🔥", emotional:"🥺",
  };
  const toneEmoji = EMOJI[knobs.tone] || "";
  const parts = [(knobs.level || "B1").toUpperCase()];
  if (roleLabel) parts.push(roleLabel);
  parts.push(`${toneEmoji} ${cap(knobs.tone)}`);
  parts.push(cap(knobs.length));
  return parts.join(" · ");
}

export { loadKnobs, saveKnobs, knobsSummaryText };