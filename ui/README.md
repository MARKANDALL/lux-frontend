# ui

UI primitives and cross-page visual layers that aren't owned by a single feature. The AI Coach panel, the Save-Progress auth button, the warp-swap page transition, the arrow-trail attention nudge, ripple buttons, and the shared card compositor all live here. Features import from `ui/` — this folder does not import back into features.

## Key Files

- `ui-ai-ai-logic.js` / `ui-ai-ai-dom.js` / `ui-ai-ai-logic/` — The AI Coach drawer. Logic file routes between Quick Mode (paged tips), Deep Mode (chunked reports), and lifecycle/persona/language change. DOM file owns the sidebar + scrollable content shell.
- `auth-dom.js` — "Save Progress" top-right button + magic-link modal; swaps guest UID → authed UID via Supabase and triggers history migration.
- `warp-core.js` / `warp-nav.js` / `warp.css` — Page-transition overlay. `warpSwap(fn)` for same-page swaps, `warpGo(url)` for cross-page navigations (persists a sessionStorage flag so the destination page can warp *in*).
- `lux-warn.js` — Centralized `warnSwallow(tag, err, level)` + DevTools `LuxWarn.get/set` — on/off/important-only. Default: dev=important, prod=off.
- `components/` — Composable card pieces: `score-ring`, `metric-tiles`, `trouble-chips`, composed into `lux-card` (rows, expanded, detail levels).
- `ui-arrow-trail.js` / `ui-arrow-trail-fly.js` — Animated arrow trail that nudges first-time users toward a target element.
- `ui-click-ripple.js` / `ui-ripple-filter.js` — Ripple effect for any element with `[data-lux-ripple]`.

## Conventions

- **`ui/` depends on `core/`, `helpers/`, `app-core/`, `_api/` — but never on `features/`.** If a UI primitive seems to need a feature, the feature should be calling the primitive, not the other way around.
- **Escape HTML before interpolation.** Use `helpers/escape-html.js`.
- **Guard document listeners via `app-core/lux-listeners.js`.** Duplicate auth listeners on hot reload are a classic regression.
- **`warnSwallow` is the canonical swallow-logger.** Avoid bare `catch {}` — use `warnSwallow("<file>", err, "important")` for important swallows.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [app-core/lux-bus.js](../app-core/lux-bus.js) — how UI primitives and features share state
