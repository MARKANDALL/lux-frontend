/* ============================================================================
   LEGACY HEADER SYSTEM (DOM + STATE)
   ---------------------------------------------------------------------------
   - Legacy header builder used by:
       - Old UI entrypoints (if any still call ensureResultsHeader/renderResultsHeader)
       - ui/views/header.js as a *fallback* only.
   - Do NOT use for new code. Modern header: ui/views/header-modern.js.
   - Safe to move to /legacy once grep shows zero references outside shims.
============================================================================ */
/* ============================================================================
   LEGACY / INACTIVE MODULE (do not revive)
   ---------------------------------------------------------------------------
   - Canonical results renderer: ui/views/index.js (lux-results-root)
   - This file is kept only for reference until its useful pieces are ported.
   - Do not attach window.* globals here.
   - Safe to move to /legacy after grep confirms zero callers.
============================================================================ */
/*
// ui/headers/dom.js — DOM fill & toggles (relies on state.js functions)
(function () {
  const G = window;

  function fillProsodyAndContentSlots(data) {
    const { prosody, content } = (
      G.getAzureScores ||
      function () {
        return {};
      }
    )(data);
    const rate = (
      G.getSpeakingRate ||
      function () {
        return {};
      }
    )(data);

    const prosodySlot = document.getElementById("prosodyScoreSlot");
    if (prosodySlot) {
      const rateStr = Number.isFinite(rate.wps)
        ? ` • ~${rate.wps.toFixed(1)} w/s`
        : "";
      const pVal = prosody == null ? null : prosody;
      prosodySlot.innerHTML = `
          <span class="${(G.scoreClass || (() => ""))(pVal)}">
            Prosody
            <span class="tooltip result-tip tip-Prosody">(?) 
              <span class="tooltiptext">
                Stress, intonation, rhythm, and pacing. Captures phrasing, word stress, and natural flow.
              </span>
            </span>
            : ${(G.fmtPct || (() => "–"))(pVal)}${rateStr}
          </span>`;
    }

    const contentSlot = document.getElementById("contentScoreSlot");
    if (contentSlot) {
      const bits = [];
      if (content?.vocab != null)
        bits.push(`Vocab: ${(G.fmtPct || (() => "–"))(content.vocab)}`);
      if (content?.grammar != null)
        bits.push(`Grammar: ${(G.fmtPct || (() => "–"))(content.grammar)}`);
      if (content?.topic != null)
        bits.push(`Topic: ${(G.fmtPct || (() => "–"))(content.topic)}`);
      contentSlot.innerHTML = bits.length
        ? `<span>Content: ${bits.join(" | ")}</span>`
        : `<span>Content: –</span>`;
    }
  }
  G.fillProsodyAndContentSlots =
    G.fillProsodyAndContentSlots || fillProsodyAndContentSlots;

  G.initProsodyLegendToggle =
    G.initProsodyLegendToggle ||
    function initProsodyLegendToggle() {
      const toggle = document.getElementById("prosodyLegendToggle");
      const legend = document.getElementById("prosodyLegend");
      if (!toggle || !legend) return;
      toggle.onclick = () => legend.classList.toggle("hidden");
    };

  G.ensureResultsHeader =
    G.ensureResultsHeader ||
    function ensureResultsHeader(data) {
      const $out = document.getElementById("prettyResult");
      if (!$out) return;
      const header = document.getElementById("resultHeader");
      if (!header) {
        $out.insertAdjacentHTML(
          "afterbegin",
          (
            G.renderResultsHeader ||
            function () {
              return "";
            }
          )(data)
        );
      } else {
        header.outerHTML = (
          G.renderResultsHeader ||
          function () {
            return "";
          }
        )(data);
      }
      fillProsodyAndContentSlots(data);
      setTimeout(() => G.animateMetricTips?.(), 0);
      G.initProsodyLegendToggle?.();
    };
})();
