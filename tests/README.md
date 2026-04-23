# tests

Vitest protection-ring suite. These cover the shared primitives and pure logic that the rest of the app depends on; feature-level tests are colocated next to their source (e.g. `app-core/lux-bus.test.js`, `_api/attempts.test.js`).

## Key Files

- `scoring.test.js` — the **#1 highest-fanout target**: `core/scoring/index.js` has 24+ inbound imports, and this file pins the 80/60 Blue/Yellow/Red contract, coaching tiers, CEFR bands, and Azure score extraction.
- `phonemes-core.test.js` — `src/data/phonemes/core.js`: `norm`, `getCodesForIPA`, `normalizePhoneSequence` (13 inbound imports).
- `attempt-pickers.test.js` — `features/progress/attempt-pickers.js` schema-drift pickers.
- `helpers-core.test.js`, `md-to-html.test.js`, `escape-html.test.js` — the shared helper layer.

## Conventions

- Vitest only, no Jest. Run with `npm test` (single pass) or `npm run test:watch`.
- Tests live next to their source when they cover a single module (colocated `*.test.js`); cross-cutting tests live here.
- The protection ring is additive — if you refactor a file with inbound-import count ≥ 10, add tests before touching it.

## See Also

- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — protection-ring testing section
- [`core/scoring/index.js`](../core/scoring/index.js) — the locked scoring contract this suite protects
