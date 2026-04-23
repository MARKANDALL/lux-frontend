# ui

Shared UI primitives that do not belong to any single feature: the auth button/modal, the AI feedback coach logic, the page-transition "warp" overlay, reusable card components, and global visual effects (ripple, arrow trail).

## Key Files

- `ui-ai-ai-logic.js` / `ui-ai-ai-dom.js` / `ui-ai-ai-logic/` — the AI Coach drawer: Quick-mode / Deep-mode attempt policy, lifecycle, loading/error states, Markdown rendering.
- `auth-dom.js` — top-right "Save Progress" button + magic-link login modal; owns UID swap and history migration on sign-in.
- `warp-core.js` / `warp-nav.js` / `warp.css` — page-transition overlay; `warpSwap()` is called by flows that re-mount large DOM regions.
- `components/` — unified card compositor: `score-ring`, `metric-tiles`, `trouble-chips`, composed into `lux-card.js` (Level 0/1/2).
- `lux-warn.js` — centralised swallowed-error warning control (`warnSwallow()` dispatch target). Imported first in most page entrypoints.
- `ui-click-ripple.js` / `ui-ripple-filter.js` / `ui-arrow-trail.js` — visual polish (button ripple, onboarding arrow trail).

## Conventions

- DOM is created imperatively — no React, no templates. Use `escapeHtml` from `helpers/` when interpolating.
- `ui-warn` should be imported before anything that might call `warnSwallow` so the global is bound.
- `components/` is the canonical place for reusable card fragments; do not add new card shapes inside individual features.

## See Also

- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — UI layer
- [`features/interactions/`](../features/interactions/) — page-level interaction wiring that depends on these primitives
- [`helpers/dom.js`](../helpers/dom.js) — shared DOM helpers
