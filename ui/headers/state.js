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
   LEGACY DUPLICATE — DO NOT USE FOR NEW CODE
   ---------------------------------------------------------------------------
   This file contains OLD scoring helpers (fmtPct, getAzureScores,
   deriveFallbackScores, scoreClass) that have moved to:

     core/scoring/index.js   ✅ canonical ES-module gateway

   The live results path does NOT import this file.
   Keep only for reference until Phase 3 cleanup moves it to /legacy.
============================================================================ */
// ui/headers/state.js — data helpers + header HTML builder (no DOM writes)
(function () {
  const G = window;

  const fmtPct =
    G.fmtPct ||
    ((v) => {
      if (v == null || !Number.isFinite(+v)) return "–";
      const n = +v;
      return Number.isInteger(n) ? `${n}%` : `${n.toFixed(1)}%`;
    });

  const scoreClass =
    G.scoreClass ||
    ((s) =>
      s == null
        ? ""
        : s >= 85
        ? "score-good"
        : s >= 70
        ? "score-warn"
        : "score-bad");

  const getAzureScores =
    G.getAzureScores ||
    function (data) {
      const nbest = data?.NBest?.[0] || {};
      const pa =
        nbest?.PronunciationAssessment || data?.PronunciationAssessment || {};
      const ca = nbest?.ContentAssessment || data?.ContentAssessment || {};
      const num = (v) => (Number.isFinite(+v) ? +v : null);
      return {
        accuracy: num(nbest?.AccuracyScore ?? pa?.AccuracyScore),
        fluency: num(nbest?.FluencyScore ?? pa?.FluencyScore),
        completeness: num(nbest?.CompletenessScore ?? pa?.CompletenessScore),
        overall: num(
          nbest?.PronScore ?? pa?.PronunciationScore ?? pa?.PronScore
        ),
        prosody: num(
          nbest?.ProsodyScore ??
            pa?.ProsodyScore ??
            data?.ProsodyScore ??
            data?.PronunciationAssessment?.ProsodyScore
        ),
        content: {
          vocab: num(ca?.vocabularyScore ?? ca?.VocabularyScore),
          grammar: num(ca?.grammarScore ?? ca?.GrammarScore),
          topic: num(ca?.topicScore ?? ca?.TopicScore),
        },
        nbest,
      };
    };

  function deriveFallbackScores(data) {
    const nbest = data?.NBest?.[0] || {};
    const words = nbest?.Words || [];
    const toNum = (x) => (Number.isFinite(+x) ? +x : null);
    const avg = (arr) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const accs = words
      .map((w) => toNum(w?.AccuracyScore))
      .filter(Number.isFinite);
    const accAvg = avg(accs);
    const okCount = words.filter(
      (w) => !w?.ErrorType || w.ErrorType === "None"
    ).length;
    const completenessFallback = words.length
      ? Math.round((okCount / words.length) * 100)
      : null;
    const pa =
      nbest.PronunciationAssessment || data?.PronunciationAssessment || {};
    const overallFallback =
      toNum(nbest?.PronScore ?? pa?.PronunciationScore ?? pa?.PronScore) ??
      (accAvg != null ? Math.round(accAvg) : null);
    const rate = (
      G.getSpeakingRate ||
      function () {
        return { label: "" };
      }
    )(data);
    const fluFallback = rate.label ? (rate.label === "ok" ? 85 : 70) : null;
    return {
      accuracy: accAvg != null ? Math.round(accAvg) : null,
      completeness: completenessFallback,
      overall: overallFallback,
      fluency: fluFallback,
      rate,
    };
  }

  function renderResultsHeader(data) {
    const { nbest, accuracy, fluency, completeness, overall } =
      getAzureScores(data);
    const fb = deriveFallbackScores(data);
    const exp = {
      Accuracy: "How close your pronunciation is to a native speaker.",
      Fluency: "How smooth and natural your speech was.",
      Completeness: "Did you say all the words in the reference?",
      Pronunciation: "Overall pronunciation quality.",
      Phoneme: "The smallest possible sound in a language.",
      Prosody: "Stress, intonation, rhythm & speaking rate.",
    };
    const scores = [
      ["Accuracy", accuracy ?? fb.accuracy],
      ["Fluency", fluency ?? fb.fluency],
      ["Completeness", completeness ?? fb.completeness],
      ["Pronunciation", overall ?? fb.overall],
    ];

    return /* html */ `
    <div id="resultHeader">
      <div><b>Your Results:</b><br>
        <span>
          <span id="prosodyScoreSlot"></span> |
          <span id="contentScoreSlot"></span> |
          ${scores
            .map(
              ([k, v]) => `
              <span class="${scoreClass(v)}">
                ${k}
                <span class="tooltip result-tip tip-${k}">(?) 
                  <span class="tooltiptext">${exp[k] || ""}</span>
                </span>
                : ${fmtPct(v)}
              </span>`
            )
            .join(" | ")}
        </span>
      </div>
  
      <div style="margin:13px 0 0 0;">
        <b>What you said:</b>
        "${data?.DisplayText || nbest?.Display || "(No speech detected)"}"
      </div>
  
      <div class="results-flex">
        <div id="prosodyLegend" class="prosody-legend prosody-legend--side hidden" role="note" aria-live="polite">
          <div class="legend-row">
            <div class="sample">
              <div class="prosody-ribbon">
                <span class="pr-seg pr-gap ok" style="width:12px"></span>
                <span class="pr-seg pr-tempo ok" style="width:28px"></span>
              </div>
              <span class="label">Normal pause & tempo</span>
            </div>
            <div class="sample">
              <div class="prosody-ribbon">
                <span class="pr-seg pr-gap missing" style="width:20px"></span>
                <span class="pr-seg pr-tempo ok" style="width:28px"></span>
              </div>
              <span class="label">Phrase break (medium pause)</span>
            </div>
            <div class="sample">
              <div class="prosody-ribbon">
                <span class="pr-seg pr-gap unexpected" style="width:30px"></span>
                <span class="pr-seg pr-tempo ok" style="width:28px"></span>
              </div>
              <span class="label">Long / unexpected pause</span>
            </div>
            <div class="sample">
              <div class="prosody-ribbon">
                <span class="pr-seg pr-gap ok" style="width:12px"></span>
                <span class="pr-seg pr-tempo fast" style="width:16px"></span>
              </div>
              <span class="label">Fast word</span>
            </div>
            <div class="sample">
              <div class="prosody-ribbon">
                <span class="pr-seg pr-gap ok" style="width:12px"></span>
                <span class="pr-seg pr-tempo slow" style="width:42px"></span>
              </div>
              <span class="label">Slow word</span>
            </div>
          </div>
          <div class="note">
            Left mini segment = <b>pause before the word</b>. Right bar = <b>word length</b> (tempo).
            <i>Color</i> = status, <i>width</i> = how big the effect is.
          </div>
        </div>
  
        <table class="score-table collapsed-score collapsed-error">
          <thead>
            <tr>
              <th id="wordHeader">
                <span class="word-chip clickable">Word</span>
                <span class="audio-hint" aria-hidden="true">🔊</span>
                <span id="prosodyLegendToggle" class="tooltip result-tip tip-ProsodyBars" style="margin-left:8px;">
                  (?) <span class="tooltiptext">
                    These bars show <b>pause</b> (left) and <b>word length</b> (right). Click to show a quick legend.
                  </span>
                </span>
              </th>
              <th id="scoreHeader" class="toggle-col">Score ▸</th>
              <th id="errorHeader" class="toggle-col">Error ▸</th>
              <th id="phonemeHeader" style="min-width:150px;">
                <span class="word-chip phoneme-chip clickable" id="phonemeTitle">
                  Phoneme
                  <span id="phonemeAudioBtn" class="audio-hint audio-hint--phoneme" title="Toggle Phoneme video sound">🔊</span>
                </span>
                <span class="tooltip result-tip tip-Phonemes"> (? )
                  <span class="tooltiptext">The smallest possible sound in a language.</span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody id="resultBody"></tbody>
        </table>
      </div>
    </div>`;
  }

  // expose
  G.fmtPct = G.fmtPct || fmtPct;
  G.scoreClass = G.scoreClass || scoreClass;
  G.getAzureScores = G.getAzureScores || getAzureScores;
  G.deriveFallbackScores = G.deriveFallbackScores || deriveFallbackScores;
  G.renderResultsHeader = G.renderResultsHeader || renderResultsHeader;
})();
