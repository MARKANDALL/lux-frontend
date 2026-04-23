# ui

Cross-feature UI primitives: the top-right auth button, the swallowed-error warning controller, the warp-transition overlay used between pages, the AI Coach mount logic, reusable card components, and small interaction polish (ripple, arrow trail). Anything rendered by more than one feature lives here.

## Key Files

- `auth-dom.js` — renders the fixed "Save Progress / Login" button, handles the magic-link modal, swaps guest → authed UID on sign-in, and triggers history migration + dashboard refresh.
- `lux-warn.js` — centralized swallowed-error warning control (ON / OFF / IMPORTANT-only). Attaches `globalThis.warnSwallow` used throughout the codebase; mode is persisted via `K_WARN_MODE`.
- `warp-core.js` + `warp-nav.js` — the warp overlay (`#lux-warp`) used for the cross-page slide transition. `warp-nav.js` intercepts same-origin link clicks and plays the out→in animation.
- `ui-ai-ai-logic.js` / `ui-ai-ai-logic/` — AI Coach mount/prompt logic (always-on panel + on-demand prompt), plus language-change reactions.
- `components/` — reusable card building blocks (`score-ring`, `metric-tiles`, `trouble-chips`, `lux-card`). Used by dashboard, results, and progress rendering.
- `ui-ripple-filter.js`, `ui-click-ripple.js` — buttons marked `[data-lux-ripple]` get a ripple; `bootRippleButtons()` is called from each page entry.
- `ui-arrow-trail.js` + `ui-arrow-trail.css` — decorative arrow-trail effect for the hero.
- `warp.css` — styles for the warp overlay used by `warp-core`.

## Conventions

- **Prefixed DOM ids/classes.** Everything injected into the page uses `lux-` prefixes (`#lux-auth-btn`, `#lux-warp`, `.lux-cbadge`). Do not stray from the prefix.
- **Idempotent mounts.** `renderAuthButton()`, `ensureWarpOverlay()`, etc. guard against double-inject (`if (document.getElementById(...)) return;`). Follow the pattern.
- **`globalThis.warnSwallow`.** Catch blocks across the codebase call `warnSwallow(filePath, err, "important")`; keep calls consistent with the three-arg shape.

## See Also

- [components/](./components) — reusable score/metric/trouble card pieces
- [app-core/lux-storage.js](../app-core/lux-storage.js) — `K_WARN_MODE`, `K_UI_WARP_NEXT`, and other UI keys used here
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — UI layering rules
