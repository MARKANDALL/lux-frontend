# helpers

Small, widely-shared utilities that don't belong to any single feature. Think: HTML escaping, markdown-to-HTML, DOM scroll helpers, the Azure "did speech happen?" heuristic, shared string/URL helpers. If a utility is used from three or more features, it moves here.

## Key Files

- `index.js` — barrel re-export of the most-used helpers (`LUX_USER_ID`, `mdToHtml`, `escapeHtml`, `speechDetected`, `bringInputToTop`, `clamp`, …).
- `core.js` — user identity surface (`LUX_USER_ID` from `_api/identity.js`), `encouragingLine()` driven by canonical `coachingPreface`, `buildYouglishUrl`, `isCorrupt`, `clamp`, `shuffleInPlace`.
- `escape-html.js` — the canonical `escapeHtml`. Every file that escapes HTML imports from here.
- `md-to-html.js` — stable markdown subset (lists, optional headings, "special H3" emoji headings) used by the AI Coach output.
- `assess.js` — `speechDetected(res)` heuristic that decides whether Azure's response actually contains usable speech.
- `dom.js` — `bringInputToTop`, `bringBoxBottomToViewport`, underline observer, click-hint UI behavior.

## Conventions

- **No feature imports.** `helpers/` must not import from `features/`. It may import from `_api/`, `app-core/`, or `core/`.
- **One `escapeHtml`.** Never inline your own escape function; always import from `helpers/escape-html.js`.
- Tests live in the top-level `tests/` folder (`helpers-core.test.js`, `escape-html.test.js`, `md-to-html.test.js`).

## See Also

- [tests/](../tests) — Vitest coverage for the helpers
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — layering rules that keep helpers leaf-only
