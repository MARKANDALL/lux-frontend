# helpers

Small, stateless utilities shared by multiple features. Nothing here should own state, render a feature, or reach into `features/`. If a helper starts to accumulate behaviour, it probably belongs in `core/` or a feature folder instead.

## Key Files

- `index.js` — barrel re-exporting the stable helper surface.
- `core.js` — user identity (`LUX_USER_ID`), `buildYouglishUrl`, `isCorrupt`, `encouragingLine` (delegates to `coachingPreface`), `clamp`, `shuffleInPlace`.
- `dom.js` — viewport/scroll helpers (`bringInputToTop`, `bringBoxBottomToViewport`), underline observer, click-hint UI.
- `md-to-html.js` — small, safe markdown subset renderer used by AI feedback panels.
- `escape-html.js` — single canonical HTML escaper used across the UI.
- `assess.js` — `speechDetected()` heuristic for deciding when Azure returned usable audio.
- `body-scroll-lock.js` — shared body-scroll lock for modals/overlays.

## Conventions

- Helpers must be pure / stateless where possible. Avoid adding singletons here.
- Always use `escapeHtml` from `escape-html.js` when building HTML strings — do not hand-roll escaping.
- New helpers should be added to `index.js` so consumers have one import point.
- Covered by `tests/helpers-core.test.js`, `tests/md-to-html.test.js`, `tests/escape-html.test.js`.

## See Also

- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md)
- [`app-core/lux-storage.js`](../app-core/lux-storage.js) — storage helpers (do not duplicate here)
- [`core/scoring/index.js`](../core/scoring/index.js) — coaching-preface source that `encouragingLine` defers to
