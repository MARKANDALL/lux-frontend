# core

Shared business logic that multiple features depend on. Two domains live here: **scoring** (CEFR bands, coaching tiers, colour thresholds) and **prosody** (timing, tempo, gap classification). Anything reused across `features/` and that encodes a product rule — not a UI choice — belongs here.

## Key Files

- `scoring/index.js` — the **Scoring Constitution**. Defines the locked 80/60 Blue/Yellow/Red schema, the four coaching tiers (`none` / `polish` / `coach` / `urgent`), CEFR bands, `fmtPct`, `scoreClass`, and Azure score extraction. 24+ inbound imports; any change here moves UI everywhere.
- `prosody/index.js` — thin barrel re-exporting the modern prosody pipeline from the top-level `prosody/` folder (`computeTimings`, `classifyTempo`, `classifyGap`, `renderProsodyRibbon`). Consumers should import from here, not from `prosody/` directly.

## Conventions

- Treat `scoring/index.js` as **locked** — the 80/60 thresholds are a product contract, not a tuning knob. New coaching logic should be additive.
- `core/` must not import from `features/`. If a helper starts needing feature state, it doesn't belong here.
- Scoring is covered by `tests/scoring.test.js` — it is the #1 highest-fanout file in the repo, so tests stay green before any refactor.

## See Also

- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — scoring and prosody sections
- [`prosody/`](../prosody/) — the prosody implementation re-exported from `core/prosody`
- [`tests/scoring.test.js`](../tests/scoring.test.js) — the scoring protection-ring
