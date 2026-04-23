# helpers

Small, stable utilities shared across features. Everything here is a pure ES-module function — no framework, no DOM setup, no global side effects beyond what a single helper explicitly advertises (e.g. `body-scroll-lock` touches `document.body.style`). Import from the named module directly, or from the barrel `helpers/index.js`.

## Key Files

- `core.js` — `clamp`, `shuffleInPlace`, `buildYouglishUrl`, `isCorrupt`, `encouragingLine` (wraps `coachingPreface` from `core/scoring`). Also exposes `LUX_USER_ID` pulled from `_api/identity.getUID` at load.
- `escape-html.js` — Single canonical `escapeHtml`. Every other escape implementation was removed; import from here.
- `md-to-html.js` — Escape-first markdown-to-HTML converter. Two presets: `mdToHtmlSection` (inline + lists, preserves `<br>`) and `mdToHtmlFull` (headings + special-emoji H3s + paragraphs).
- `dom.js` — Viewport/scroll helpers: `bringInputToTop`, `bringBoxBottomToViewport`, `initUnderlineObserver`, `showClickHint` (gated by `K_UI_CLICK_HINTS_SEEN`).
- `assess.js` — `speechDetected(res)` heuristic for deciding whether Azure returned usable speech vs. silence.
- `body-scroll-lock.js` — Reference-counted `lockBodyScroll` / `unlockBodyScroll` so nested modals don't release the lock early.
- `index.js` — Barrel export for the most-used helpers.

## Conventions

- **Pure and side-effect-light.** If a helper needs to mount DOM or open a modal, it belongs in a feature, not here.
- **`escapeHtml` before any string interpolation.** `md-to-html.js` escapes first, then transforms.
- **Use `clamp` from `core.js`.** Don't re-implement `Math.max(lo, Math.min(hi, n))` inline.

## See Also

- [tests/escape-html.test.js](../tests/escape-html.test.js), [tests/md-to-html.test.js](../tests/md-to-html.test.js), [tests/helpers-core.test.js](../tests/helpers-core.test.js) — protection-ring coverage
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
