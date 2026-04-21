# helpers

Small, stateless utility functions used across the app. The rule of thumb: if a function is stateless, has no feature-specific knowledge, and three or more places want it, it goes here.

Do not put business logic (scoring, prosody, CEFR) here — that belongs in [core/](../core/). Do not put DOM-producing feature logic here — that belongs in the feature itself.

## Key Files

- `index.js` — public barrel. Re-exports the curated surface (`LUX_USER_ID`, `buildYouglishUrl`, `encouragingLine`, `clamp`, `mdToHtml`, viewport helpers, etc.).
- `core.js` — identity-bridged helpers: `LUX_USER_ID` (reads from `_api/identity`), `buildYouglishUrl`, `isCorrupt`, `encouragingLine` (uses `coachingPreface` from `core/scoring`), `clamp`, `shuffleInPlace`.
- `escape-html.js` — the single canonical `escapeHtml`. Every feature imports from here.
- `md-to-html.js` — safe markdown→HTML for AI feedback surfaces (escapes first, then applies a small stable subset).
- `dom.js` — viewport helpers: `bringInputToTop`, `bringBoxBottomToViewport`, underline observer, click hints.
- `assess.js` — `speechDetected` heuristic shared between recorder and results.

## Conventions

- Pure functions — no side effects at import time, no feature state.
- `escape-html.js` is the single source for HTML escaping. Do not re-implement it anywhere else.
- The barrel (`index.js`) is intentionally curated. Features can import deep paths when they need something specific (e.g. `helpers/md-to-html.js`), but most callers should pull from `helpers/index.js`.

## See Also

- [core/](../core/) — business logic (scoring, prosody)
- [app-core/](../app-core/) — cross-cutting state and events
