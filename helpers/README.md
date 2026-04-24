# helpers

Small, dependency-light utilities that don't belong to any one feature: HTML escaping, markdown rendering, scroll/viewport positioning, encouraging-line generation, body-scroll locking, and the speech-detected heuristic.

If a helper grows logic specific to one feature, it should move into that feature's folder. If two features start needing the same helper, it belongs here.

## Key Files

- `escape-html.js` — single canonical `escapeHtml`. All XSS-prone string interpolation in the app imports from here.
- `md-to-html.js` — small, stable markdown subset (escapes first, then applies tags). Used for AI coaching output.
- `core.js` — `LUX_USER_ID`, `buildYouglishUrl`, `isCorrupt`, `encouragingLine`, `clamp`, `shuffleInPlace`.
- `dom.js` — viewport scrolling helpers (`bringInputToTop`, `bringBoxBottomToViewport`), underline observer, click-hint UI.
- `assess.js` — `speechDetected` heuristic for deciding whether Azure returned usable speech.
- `body-scroll-lock.js` — reference-counted `lockBodyScroll` / `unlockBodyScroll` so multiple modals stack cleanly.
- `index.js` — barrel export of the most-used helpers.

## Conventions

- Helpers are pure where possible. If they touch DOM or storage, the dependency goes through `app-core/lux-storage.js`, never raw `localStorage`.
- Any new HTML-escaping path must reuse `escape-html.js` — do not write a second escaper.
- Tests live in [`tests/escape-html.test.js`](../tests/escape-html.test.js), [`tests/md-to-html.test.js`](../tests/md-to-html.test.js), [`tests/helpers-core.test.js`](../tests/helpers-core.test.js).

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
