# core

Shared business-logic gateways — the parts of Lux that define *what a score means* and *what prosody means*. Two locked domains live here: `scoring/` (the canonical Blue/Yellow/Red/CEFR schema) and `prosody/` (timing and tempo classification, re-exported from the top-level `prosody/` renderer). Features consume these gateways; they don't re-implement scoring math.

## Key Files

- `scoring/index.js` — **LOCKED** to the Universal Blue/Yellow/Red Schema (80/60). Exports `fmtPct`, `scoreClass`, `coachingLevel`, `coachingPreface`, `cefrBand`, `cefrClass`, `getAzureScores`, `deriveFallbackScores`, and the `COACHING_POLISH_THRESHOLD` (85) used for "green but polish" coaching.
- `prosody/index.js` — thin barrel that re-exports prosody calculators and the ribbon renderer from the top-level `prosody/` folder so feature code has one import point.

## Conventions

- **Do not fork scoring thresholds.** The 80/60 UI cutoffs and the 85 coaching-polish cutoff are product decisions, not local preferences. Change them here or not at all.
- **Core is pure.** No DOM, no network, no storage. Functions here take numbers / objects and return numbers / strings / classnames.
- Covered by `tests/scoring.test.js` and `tests/phonemes-core.test.js` — update tests when public signatures change.

## See Also

- [prosody/](../prosody) — the actual prosody renderer that `core/prosody/index.js` re-exports
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — the scoring constitution and CEFR mapping
- [tests/scoring.test.js](../tests/scoring.test.js) — contract tests for the scoring gateway
