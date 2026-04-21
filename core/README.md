# core

Shared business logic that isn't feature-specific and isn't app-plumbing. Two domains live here: **scoring** (score-to-tier, CEFR mapping, Azure score extraction) and **prosody** (aggregated gateway over the modernized timing/tempo modules in [prosody/](../prosody/)).

If more than one feature imports a pure function that encodes product rules — phoneme normalization excepted — it probably belongs here.

## Key Files

- `scoring/index.js` — Canonical scoring gateway. `scoreClass` (80/60 Blue/Yellow/Red), `coachingLevel`/`coachingPreface` (four-tier coaching), `cefrBand`/`cefrClass` (C2…A1), `getAzureScores`, `deriveFallbackScores`. Locked to the Universal Blue/Yellow/Red schema.
- `prosody/index.js` — Thin barrel re-exporting `computeTimings`, `median`, `classifyTempo`, `classifyGap`, `renderProsodyRibbon` from [prosody/](../prosody/). Consumers import from here.

## Conventions

- **Scoring is locked.** The 80/60 cutoffs and the four coaching tiers (`none` 85+, `polish` 80–84, `coach` 60–79, `urgent` <60) are product commitments. Don't adjust them without updating the protection-ring test in [tests/scoring.test.js](../tests/scoring.test.js).
- Pure functions only — no DOM, no I/O, no feature imports.
- Features import `scoreClass`/`cefrBand` from `core/scoring/index.js`, never re-implement them.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — scoring constitution section
- [prosody/](../prosody/) — the actual timing math that `core/prosody/` surfaces
- [tests/scoring.test.js](../tests/scoring.test.js) — protection-ring tests
