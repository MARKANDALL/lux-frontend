# features/results

The post-recording results view. Renders the score header (overall + per-metric tiles), the words/phonemes table with prosody ribbons, and the summary panel with detailed feedback, syllable stress, and the Voice Mirror button. Locked to the universal Blue/Yellow/Red 80/60 schema.

## Key Files

- `index.js` — public entry: `showPrettyResults`, `showDetailedAnalysisSingle`, `showSummaryWithTracking`. Boots phoneme hover once.
- `render-modern.js` — thin adapter calling `render-core.js` (kept for behavior parity with the legacy renderer).
- `render-core.js` — the actual `renderPrettyResultsCore` / `renderDetailedAnalysisCore` implementation.
- `render-helpers.js` — `preparePrettyOut`, `preparePrettyOutSingle` (output element prep + early-return guards).
- `header.js` / `header-modern.js` — score header shell + post-DOM wiring (Youglish hover, phoneme hover, phoneme audio, score-error collapse, metric tips, prosody legend, prosody tooltips, metric-score modal).
- `rows.js` / `rows-logic.js` — words + phonemes table. "Dumb" chips with `data-ipa` attributes; tooltips and videos are produced by [`features/interactions/`](../interactions/).
- `summary.js` / `summary-shell.js` / `summary-feedback.js` — summary panel with detailed phoneme feedback and Voice Mirror mount.
- `syllables.js` / `syllables/` — syllable stress rendering using CMU stress digits to pick the primary-stress syllable (with heuristic fallback while the dictionary loads).
- `deps.js` — local dependency aggregator (re-exports `renderProsodyRibbon`).

## Conventions

- Score color decisions go through `core/scoring/index.js` — never hardcode the 80/60 thresholds.
- Rows are layout-only: no internal tooltip/video DOM (that came out for the "white space" bug). Rich behavior is wired post-render by `interactions/`.
- All HTML interpolation must use `escapeHtml`.
- `index.js.bak` is a safety copy — do not import from it.

## See Also

- [`features/interactions/`](../interactions/) — hover/audio/modal behaviors layered on top of these rows
- [`prosody/`](../../prosody/) and [`core/prosody/`](../../core/prosody/) — prosody ribbon renderer
- [`core/scoring/index.js`](../../core/scoring/index.js) — locked scoring schema
