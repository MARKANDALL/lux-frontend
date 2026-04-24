# tests

Vitest **protection-ring** suite. These tests cover the shared primitives that everything else in the app depends on: scoring, escape-html, helpers/core, the convo renderer, attempt pickers, phoneme normalization, and markdown rendering. The goal is to catch silent contract breaks in the modules with the highest fan-in.

The contract suite as a whole is described in the root README as "59-test Vitest contract suite." Adjacent tests for individual primitives also live colocated under `_api/`, `app-core/`, and `features/features/selfpb/`.

## Key Files

- `scoring.test.js` — locks the Blue/Yellow/Red 80/60 scoring schema and the four-tier coaching ladder (highest-priority untested target was `core/scoring/index.js`, with 24 inbound imports).
- `escape-html.test.js` — XSS-prevention contract for `helpers/escape-html.js`.
- `helpers-core.test.js` — `LUX_USER_ID`, `buildYouglishUrl`, `isCorrupt`, `encouragingLine`, `clamp`, `shuffleInPlace`.
- `convo-core.test.js` — convo renderer behavior, scenario-bus events, knobs, `practiceMeta` helpers (mocks `_api/convo.js`).
- `attempt-pickers.test.js` — schema-drift-tolerant pickers in `features/progress/attempt-pickers.js`.
- `phonemes-core.test.js`, `md-to-html.test.js` — additional protection-ring coverage.

## Conventions

- New tests follow the existing pattern: `describe()` per module, smoke + edge cases, no new test frameworks or fixture systems.
- A test file lives either here (for cross-cutting modules) or beside its source (for `_api/`, `app-core/`, `features/features/selfpb/`).
- Tests must run headlessly — anything touching `window` or `document` should be guarded so Node-only execution is safe.
- Run with `npm test` (or `npm run test:watch`).

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — protection-ring testing rationale
- [docs/system-health-bill-of-rights.frontend.md](../docs/system-health-bill-of-rights.frontend.md)
