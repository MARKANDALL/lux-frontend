// features/convo/convo-knobs.js

import { luxBus } from '../../app-core/lux-bus.js';

import { K_CONVO_KNOBS as KNOBS_KEY, getJSON, setJSON } from '../../app-core/lux-storage.js';
const KNOBS_DEFAULTS = { level: "B1", tone: "neutral", length: "medium" };

function loadKnobs() {
  const parsed = getJSON(KNOBS_KEY, null);
  return { ...KNOBS_DEFAULTS, ...(parsed || {}) };
}

function saveKnobs(knobs) {
  setJSON(KNOBS_KEY, knobs);
  // Fire unified event so all listeners (chip drawer, summaries) stay in sync
  luxBus.set('knobs', knobs);
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