# tests

Vitest protection-ring tests. These lock down the contracts of the shared primitives the rest of the app depends on: bus, storage, identity, runtime, scoring, attempt pickers, and the small helpers most-imported across the codebase.

The goal is not coverage for its own sake — it is to catch behavior drift in the modules that, if broken, take the whole app down.

## Key Files

- `scoring.test.js` — smoke + edge cases for `core/scoring/index.js` (CEFR bands, coaching tiers, Azure score extraction, fallback scoring).
- `attempt-pickers.test.js` — locks the shape of `features/progress/attempt-pickers.js` (13 inbound imports).
- `phonemes-core.test.js` — normalization + phoneme sequence helpers from `src/data/phonemes/core.js`.
- `helpers-core.test.js` — `helpers/core.js` surface (`clamp`, `isCorrupt`, `encouragingLine`, etc.).
- `md-to-html.test.js` / `escape-html.test.js` — the two tiny helpers that every feature uses for safe rendering.

Sibling `*.test.js` files also live next to their modules in [`_api/`](../_api/) and [`app-core/`](../app-core/) (e.g. `lux-bus.test.js`, `identity.test.js`). Those are part of the same protection ring — they just sit next to the code they cover.

## Conventions

- Vitest, ES modules, no JSDOM unless the file under test needs it.
- Tests cover public exports only — internal implementation changes should not break tests.
- A module with 10+ inbound imports without a test is a protection-ring gap. Prioritize those first.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — protection-ring section
- `package.json` — `npm test`, `npm run test:watch`
