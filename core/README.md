# core

Shared business logic that more than one feature depends on. `core/` modules are pure (no DOM) and lock down the canonical scoring and prosody contracts the rest of the app reads against.

The **scoring constitution** lives here: Blue ≥ 80, Yellow ≥ 60, Red < 60, with a four-tier coaching ladder (`none` ≥ 85, `polish` 80–84, `coach` 60–79, `urgent` < 60). Every score chip, ring, and color decision in the UI ultimately flows from `core/scoring/index.js`.

## Key Subfolders

- `scoring/` — `index.js` exports `fmtPct`, `scoreClass`, `coachingLevel`, `coachingPreface`, `cefrBand`, `cefrClass`, `getAzureScores`, `deriveFallbackScores`, and the `COACHING_*_THRESHOLD` constants. Imported by 24+ files; locked schema.
- `prosody/` — `index.js` is a thin gateway re-exporting `computeTimings`, `median`, `classifyTempo`, `classifyGap`, and `renderProsodyRibbon` from the implementation modules in `prosody/` at the repo root.

## Conventions

- No DOM, no fetch, no localStorage — these modules must be safe to import from Node (Vitest runs them headlessly).
- The scoring schema is intentionally locked. Changes must update `tests/scoring.test.js` and the matching documentation in `docs/ARCHITECTURE.md`.

## See Also

- [`tests/scoring.test.js`](../tests/scoring.test.js) — protection-ring tests for the scoring contract
- [`prosody/`](../prosody/) — the implementation modules that `core/prosody` re-exports
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
