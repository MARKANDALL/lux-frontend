# features/results

The pretty results renderer. Takes raw Azure assessment data, runs it through helpers / row logic, and renders the scoreboard, per-word breakdown, prosody ribbon, and summary shell. Two rendering paths coexist: a legacy path and the modern one (preferred).

## Key Files

- `index.js` — canonical entrypoint: `showPrettyResults`, `showSummary`, `showDetailedAnalysisSingle`; boots phoneme hover once and hydrates phoneme chips.
- `render-modern.js` — thin Phase-E adapter over `render-core.js`.
- `render-core.js` + `render-helpers.js` — the actual renderer: pretty-result core, detailed-analysis core, preparation helpers.
- `rows.js` + `rows-logic.js` — per-word row builders (score chips, phoneme chips, prosody bar).
- `summary.js` + `summary-shell.js` + `summary-feedback.js` — practice-summary overlay.
- `header.js` / `header-modern.js` — result-block headers.
- `syllables/` — syllable-level extensions (alt-meaning, CMU stress).
- `deps.js` — dependency access indirection for testability.

## Conventions

- Use `render-modern.js` for new work; legacy paths remain only for feature parity and are scheduled for removal.
- Do not mutate incoming Azure data — renderer helpers must treat it as read-only.
- Scoring colours come from `core/scoring/index.js` — never hand-code the 80/60 thresholds.
- `index.js.bak` is a deliberate safety copy during ongoing refactor; do not import from it.

## See Also

- [`core/scoring/index.js`](../../core/scoring/index.js) — colour & coaching thresholds
- [`core/prosody/index.js`](../../core/prosody/index.js) — prosody ribbon renderer
- [`features/interactions/`](../interactions/) — phoneme hover + chip behaviour consumed here
