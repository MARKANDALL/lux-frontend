// features/convo/convo-knobs.js
// Thin re-exporter — knobs-drawer.js is the canonical owner of knobs read/write.
// This file keeps existing importers (convo-state, convo-bootstrap) stable.

import { getKnobs, setKnobs, TONE_EMOJI } from './knobs-drawer.js';

export function loadKnobs() {
  return getKnobs();
}

export function saveKnobs(knobs) {
  setKnobs(knobs);
}

export function knobsSummaryText(knobs, roleLabel = null) {
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
  const toneEmoji = TONE_EMOJI[knobs.tone] || "";
  const parts = [(knobs.level || "B1").toUpperCase()];
  if (roleLabel) parts.push(roleLabel);
  parts.push(`${toneEmoji} ${cap(knobs.tone)}`);
  parts.push(cap(knobs.length));
  return parts.join(" · ");
}