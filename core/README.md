# core

Cross-feature business logic that is neither infrastructure (`app-core/`) nor feature-specific (`features/`). Current occupants: the scoring gateway and the prosody gateway — two modules that many features need to agree on.

## Key Files

- `scoring/index.js` — Canonical scoring gateway. Locked to the Universal Blue/Yellow/Red schema (≥80 good, ≥60 warn, <60 bad), CEFR band helpers, four-tier coaching level (`none` / `polish` / `coach` / `urgent`), and score formatting (`fmtPct`, `scoreClass`, `cefrBand`). 24+ inbound imports across the app.
- `prosody/index.js` — Thin barrel that re-exports from `prosody/` (root): `computeTimings`, `median`, `classifyTempo`, `classifyGap`, `renderProsodyRibbon`. Consumers import from `core/prosody/`; the actual implementation lives in the top-level `prosody/` folder.

## Conventions

- Scoring thresholds are a constitution — do not introduce a second schema. The 80/60 UI tiers and the 85/80/60 coaching tiers are covered in `tests/scoring.test.js`.
- `core/` modules must be side-effect free and safe to import in Node (Vitest). No DOM work on import.
- When adding a new cross-cutting domain (e.g. a future `cefr/` or `phonemes/` gateway), prefer a thin `index.js` that re-exports from a dedicated root-level or feature folder, mirroring how `core/prosody/` delegates to `prosody/`.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — where `core/` sits between `app-core/` and `features/`
- [prosody/](../prosody/) — implementation behind `core/prosody/`
- [tests/scoring.test.js](../tests/scoring.test.js) — protection-ring coverage
