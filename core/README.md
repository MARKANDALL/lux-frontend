# core

Shared, pure business logic that multiple features depend on — the things that would break the product if they drifted. Nothing in `core/` touches the DOM, localStorage, or the network; each module is a gateway that exports stable names so feature code can import from one canonical place.

## Key Files

- `scoring/index.js` — The canonical scoring gateway. Defines the Blue/Yellow/Red schema (80/60), the four-tier coaching ladder (`none` 85+ / `polish` 80–84 / `coach` 60–79 / `urgent` <60), CEFR banding (A1–C2), and helpers: `scoreClass`, `coachingLevel`, `coachingPreface`, `cefrBand`, `fmtPct`, `getAzureScores`, `deriveFallbackScores`. **LOCKED** — changing thresholds here ripples through every results/progress/AI-coach surface.
- `prosody/index.js` — Thin barrel that re-exports the modern prosody primitives: `computeTimings`, `median`, `classifyTempo`, `classifyGap`, `renderProsodyRibbon`. Implementations live in `/prosody/` at the repo root; consumers should import from `core/prosody`.

## Conventions

- **Pure only.** No DOM, no storage, no fetch. If a helper needs side effects, it doesn't belong here.
- **Stable exports.** These are protection-ring targets — breaking changes require coordinated migration across consumers.
- **Single source for thresholds.** Don't re-declare 80/60 or CEFR cutoffs anywhere else — import from `core/scoring`.

## See Also

- [tests/scoring.test.js](../tests/scoring.test.js) — protection-ring coverage for the scoring constitution
- [prosody/](../prosody/) — where the prosody implementations actually live
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
