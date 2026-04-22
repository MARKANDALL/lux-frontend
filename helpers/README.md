# helpers

Small, widely-reused utilities that don't warrant their own folder: HTML escaping, markdown-to-HTML rendering, DOM/scroll helpers, speech-detection heuristics, and general primitives (clamp, shuffle, etc.). Anything here should be pure or nearly pure — no feature-specific logic.

## Key Files

- `index.js` — Barrel re-export: `LUX_USER_ID`, `buildYouglishUrl`, `isCorrupt`, `encouragingLine`, `clamp`, `shuffleInPlace`, `mdToHtml`, `speechDetected`, and the DOM/scroll helpers.
- `core.js` — Identity + friendly-feedback helpers: `LUX_USER_ID` (from `_api/identity`), `buildYouglishUrl`, `encouragingLine`, `clamp`, `shuffleInPlace`.
- `escape-html.js` — The one canonical `escapeHtml`. Everywhere else imports from here.
- `md-to-html.js` — Tiny, stable markdown subset used by AI coaching output. Escapes first, then applies formatting.
- `dom.js` — Viewport positioning helpers (`bringInputToTop`, `bringBoxBottomToViewport`), underline observer, click-hint behavior.
- `assess.js` — `speechDetected(res)` heuristic for deciding whether Azure returned usable speech.
- `body-scroll-lock.js` — Lock/unlock body scroll for modal overlays.

## Conventions

- `escapeHtml` has exactly one home (`helpers/escape-html.js`); never re-implement it elsewhere.
- Helpers must work when `window` is undefined (Node/Vitest). `core.js` guards with `typeof window !== "undefined"`.
- Keep functions small and pure. If a helper starts needing storage or bus access, it probably belongs in `app-core/`.

## See Also

- [tests/helpers-core.test.js](../tests/helpers-core.test.js), [tests/escape-html.test.js](../tests/escape-html.test.js), [tests/md-to-html.test.js](../tests/md-to-html.test.js) — protection-ring tests
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
