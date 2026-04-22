# ui

Cross-feature UI primitives: warp transitions between pages, auth DOM (the Save Progress button + magic-link modal), the AI coaching panel, reusable card building blocks, swallowed-warning control, and visual effects (arrow trails, ripple filter, click ripples). Feature-owned UI lives under `features/<name>/`; anything shared by more than one feature lives here.

## Key Files

- `warp-core.js` / `warp-nav.js` / `warp.css` — Warp-overlay page-transition system. `warp-nav.js` intercepts same-origin `<a>` clicks and animates the navigation.
- `auth-dom.js` — Renders the Save Progress auth button + login modal, drives Supabase magic-link sign-in, migrates the guest UID on login, triggers dashboard refresh.
- `ui-ai-ai-logic.js` / `ui-ai-ai-dom.js` / `ui-ai-ai-logic/` — AI coaching panel (Quick/Deep modes, auto-updates, persona handling, attempt-open policy, lifecycle).
- `components/` — Unified card building blocks: `renderScoreRing`, `renderMetricTiles`, `renderTroubleSection` + the composing `lux-card` at Level 0/1/2.
- `lux-warn.js` — Centralized swallowed-error warning control (ON / OFF / IMPORTANT-ONLY), driven by `K_WARN_MODE`.
- `ui-ripple-filter.js`, `ui-click-ripple.js`, `ui-arrow-trail.js` / `ui-arrow-trail-fly.js` — Shared visual effects (SVG displacement ripples, canvas pixel ripples, arrow trails for TTS).

## Conventions

- Imports go downward only: `ui/` depends on `app-core/`, `_api/`, `helpers/`, `core/`. It may be imported from `features/` and `src/`, but does not import from them.
- The "lux-" CSS class prefix is mandatory for any class added by modules here.
- Warp navigation must stay click-interception only; never hijack keyboard navigation or modified clicks.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [features/](../features/) — feature-owned UI lives there, not here
