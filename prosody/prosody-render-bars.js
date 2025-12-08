// prosody/prosody-render-bars.js
// Renders the two-bar prosody ribbon.

import { classifyTempo, classifyGap } from "./annotate.js";

/**
 * @param {number} index     word index in timings
 * @param {Array}  words     (kept for signature parity)
 * @param {Array}  timings   [{ start, end, durationSec }, ...]
 * @param {number} medianDur median word duration (seconds)
 * @returns {string} HTML string
 */
export function renderProsodyRibbon(index, words, timings, medianDur) {
  const t = (timings && timings[index]) || {};
  const prev = (timings && timings[index - 1]) || {};

  const tempo = classifyTempo(t.durationSec, medianDur);
  const gapVal =
    Number.isFinite(prev.end) && Number.isFinite(t.start)
      ? t.start - prev.end
      : null;
  const gapCls = index > 0 ? classifyGap(prev.end, t.start) : "ok";

  // Width scaling (elongated, readable bars)
  const baselineTempo = Number.isFinite(medianDur) ? medianDur : 0.45;
  const tempoRatio = Number.isFinite(t.durationSec)
    ? t.durationSec / baselineTempo
    : 1;
  const tempoW = Math.min(150, Math.max(16, Math.round(110 * tempoRatio)));

  const baselineGap = 0.35;
  const gapRatio = Number.isFinite(gapVal) ? gapVal / baselineGap : 1;
  const gapW = Math.min(160, Math.max(10, Math.round(100 * gapRatio)));

  // Tooltip strings
  const gapTitle = Number.isFinite(gapVal)
    ? `Pause before word: ${gapVal.toFixed(2)}s (${gapCls})`
    : "Pause before word: —";
  const tempoTitle = Number.isFinite(t.durationSec)
    ? `Word length: ${t.durationSec.toFixed(2)}s (${tempo})`
    : "Word length: —";

  const esc = (s) => String(s).replace(/"/g, "&quot;");

  return (
    '<div class="prosody-ribbon" role="img" aria-label="' +
    esc(gapTitle + "; " + tempoTitle) +
    '">' +
    // Gap (pause-before-word)
    '<span class="prosody-bar pr-seg pr-gap ' +
    gapCls +
    '" style="width:' +
    gapW +
    'px" data-tip="' +
    esc(gapTitle) +
    '" aria-label="' +
    esc(gapTitle) +
    '"></span>' +
    // Word length (tempo)
    '<span class="prosody-bar pr-seg pr-tempo ' +
    tempo +
    '" style="width:' +
    tempoW +
    'px" data-tip="' +
    esc(tempoTitle) +
    '" aria-label="' +
    esc(tempoTitle) +
    '"></span>' +
    "</div>"
  );
}