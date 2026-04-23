# tests

Vitest protection-ring tests. These guard the highest-inbound-import modules in the codebase — if one of these files breaks, dozens of callers break with it, so they get dedicated smoke + edge-case coverage.

## Key Files

- `scoring.test.js` — contract tests for `core/scoring/index.js` (24 inbound imports — #1 untested target at the time it was added). Covers `fmtPct`, `scoreClass`, `coachingLevel`, `coachingPreface`, `cefrBand`, `getAzureScores`, `deriveFallbackScores`, and exported constants.
- `attempt-pickers.test.js` — smoke + edge cases for `features/progress/attempt-pickers.js` (13 inbound imports). Asserts all pickers handle null/undefined without throwing.
- `helpers-core.test.js` — tests `helpers/core.js`. Documents the import-time side effect (calls `getUID()` at module eval, safely no-ops in Node).
- `md-to-html.test.js` — stable-subset markdown rendering contract for `helpers/md-to-html.js`.
- `escape-html.test.js` — HTML-escape contract for `helpers/escape-html.js`.
- `phonemes-core.test.js` — `src/data/phonemes/core.js` normalization + IPA → CMU code lookup.

Colocated tests also live next to a few modules (`_api/util.test.js`, `_api/identity.test.js`, `_api/attempts.test.js`, `app-core/lux-bus.test.js`, `app-core/lux-storage.test.js`, `app-core/runtime.test.js`, `features/features/selfpb/attach-learner-blob.test.js`).

## Conventions

- **Protection-ring, not coverage-chasing.** Tests are prioritized by inbound import count — the files with the most callers get tests first.
- **Use Vitest.** Run with `npm test` (or `npx vitest`). No Jest, no Mocha.
- **Safe to import at the module top.** Targeted modules should not perform network/DOM work at eval time. If they do, the test file must document the side effect explicitly (see header of `helpers-core.test.js`).

## See Also

- [vitest.config.js](../vitest.config.js) — runner config
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — the protection-ring testing philosophy
