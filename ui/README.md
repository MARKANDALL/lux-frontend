# ui

Shared UI pieces that aren't owned by a single feature: the warp-transition overlay, the auth button/modal, shared card components, arrow-trail visuals, ripple effects, and the AI Coach logic/DOM pair.

Feature-specific UI lives inside the feature folder. Anything here is reused by two or more pages or two or more features.

## Key Files

- `warp-core.js` / `warp-nav.js` / `warp.css` — the "warp" page-transition overlay and navigation wrapper. Pages that cross-link (Practice ↔ Convo ↔ Progress) swap through this.
- `auth-dom.js` — renders the Save Progress button and login modal, handles Supabase magic-link sign-in, migrates guest UID → authed UID, triggers dashboard refresh.
- `lux-warn.js` — centralized swallowed-error warning control (`ON` / `OFF` / `IMPORTANT-ONLY`). Exposes `globalThis.warnSwallow` used by every `try/catch` in the app.
- `ui-ai-ai-logic.js` / `ui-ai-ai-dom.js` — the AI Coach surface. `-logic` owns the Quick/Deep mode state machine; `-dom` owns rendering. Used by both the Practice results and the Convo coach drawer.
- `components/` — shared card UI. `score-ring.js`, `metric-tiles.js`, `trouble-chips.js`, and the `lux-card.js` composition. Barrel at `components/index.js`.
- `ui-arrow-trail.js` / `.css` / `ui-arrow-trail-fly.js` — animated arrow-trail visual used on the practice onboarding.
- `ui-click-ripple.js` / `ui-ripple-filter.js` — shared ripple-on-click effect for buttons.

## Conventions

- Nothing in `ui/` should import from a specific `features/*` folder. If it does, it belongs inside that feature.
- AI Coach is split into `-logic` and `-dom` for a reason — keep business decisions in the logic module and DOM mutation in the dom module. Don't collapse them.
- `lux-warn.js` installs `globalThis.warnSwallow` at import time. Every page entry in [src/](../src/) imports it first.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — cross-cutting UI concerns
- [app-core/lux-storage.js](../app-core/lux-storage.js) — the warn-mode key (`K_WARN_MODE`) lives here
- [features/](../features/) — feature-specific UI
