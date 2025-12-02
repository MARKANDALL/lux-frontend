// prosody/prosody-render-bars.js
// Renders the two-bar prosody ribbon. Classic (non-module).

(function () {
  "use strict";

  // Avoid redefining if another bundle already provided it.
  if (window.renderProsodyRibbon) return;

  // Read helpers from window (prosody-help-bars.js). Provide safe fallbacks.
  const classifyTempo =
    window.classifyTempo ||
    function (durationSec, medianDur) {
      if (!Number.isFinite(durationSec)) return "ok";
      if (Number.isFinite(medianDur) && medianDur > 0) {
        if (durationSec >= medianDur * 1.45) return "slow";
        if (durationSec <= medianDur * 0.6) return "fast";
        return "ok";
      }
      if (durationSec > 0.65) return "slow";
      if (durationSec < 0.3) return "fast";
      return "ok";
    };

  const classifyGap =
    window.classifyGap ||
    function (prevEnd, currStart) {
      if (!Number.isFinite(prevEnd) || !Number.isFinite(currStart)) return "ok";
      const gap = currStart - prevEnd;
      if (!Number.isFinite(gap) || gap < 0) return "ok";
      if (gap > 0.6) return "unexpected";
      if (gap >= 0.35) return "missing";
      return "ok";
    };

  /**
   * @param {number} index     word index in timings
   * @param {Array}  words     (kept for signature parity)
   * @param {Array}  timings   [{ start, end, durationSec }, ...]
   * @param {number} medianDur median word duration (seconds)
   * @returns {string} HTML string
   */
  function renderProsodyRibbon(index, words, timings, medianDur) {
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

  window.renderProsodyRibbon = renderProsodyRibbon;
})();
