# tests

The Vitest "protection ring" — a contract suite covering the shared primitives the rest of Lux depends on. These are not integration tests; they are fast, deterministic unit tests pinned to the most-inbound-imported modules, so regressions in foundational code fail here before they reach a feature.

## Key Files

- `scoring.test.js` — `core/scoring/index.js` (24 inbound imports — #1 untested target when the ring was built). Covers Blue/Yellow/Red thresholds, four-tier coaching ladder, CEFR bands, Azure score extraction, fallback derivation.
- `escape-html.test.js` — `helpers/escape-html.js` (17 inbound imports). XSS-boundary guarantees for the five HTML-sensitive characters.
- `md-to-html.test.js` — `helpers/md-to-html.js`. Both presets (`mdToHtmlSection`, `mdToHtmlFull`) and the base options object.
- `helpers-core.test.js` — `helpers/core.js` (12 inbound imports). `clamp`, `shuffleInPlace`, `buildYouglishUrl`, `isCorrupt`, `encouragingLine`.
- `phonemes-core.test.js` — `src/data/phonemes/core.js` (13 inbound imports). `norm`, `getCodesForIPA`, `normalizePhoneSequence`.
- `attempt-pickers.test.js` — `features/progress/attempt-pickers.js` (13 inbound imports). `pickTS`, `pickPassageKey`, `pickSessionId`, `pickSummary`, `pickAzure`.

Additional protection-ring tests live next to their modules (e.g. `_api/identity.test.js`, `_api/util.test.js`, `_api/attempts.test.js`, `app-core/lux-bus.test.js`, `app-core/lux-storage.test.js`, `app-core/runtime.test.js`). The suite totals ~59 tests at this layer.

## Conventions

- **Pure unit tests only.** No network, no browser-only APIs. Modules that touch `window` are guarded so imports are safe under Node.
- **Pinned by inbound-import count.** When adding a test, prioritize the un-tested module with the most `import` sites; that's the next-biggest regression risk.
- **Smoke + edge cases.** Each file starts with a smoke test that asserts the expected named exports, then walks through edge cases.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — "Protection-ring testing"
- [vitest](https://vitest.dev/) — the runner (configured in `package.json` / `vite.config.js`)
