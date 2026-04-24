# ui

Cross-page UI primitives that aren't tied to a single feature: the warp page-transition overlay, the auth (Save Progress) button + magic-link modal, the swallowed-error warning controller, the AI Coach mount, click ripples, and the unified card components.

If a UI piece is used by exactly one feature, it lives in that feature folder; if two or more pages need it, it belongs here.

## Key Files

- `warp-core.js` / `warp-nav.js` — page-transition overlay (`#lux-warp`) plus the same-origin link interceptor that triggers the warp on navigation. Honors `prefers-reduced-motion`.
- `auth-dom.js` — renders the Save Progress button and login modal, runs the Supabase magic-link sign-in flow, swaps guest UID for authed UID, and triggers history migration + dashboard refresh.
- `lux-warn.js` — centralized control for swallowed-error warnings (ON / OFF / IMPORTANT-only). Reads `K_WARN_MODE` from `app-core/lux-storage.js` and exposes `globalThis.warnSwallow` used everywhere catches occur.
- `ui-ai-ai-logic.js` / `ui-ai-ai-dom.js` — Always-On AI Coach drawer mount.
- `ui-ripple-filter.js` / `ui-click-ripple.js` — `[data-lux-ripple]` button ripple effect.
- `ui-arrow-trail.js` / `ui-arrow-trail-fly.js` — animated arrow cues.
- `components/` — unified card system. See below.

## components/

Composable card primitives shared across Practice Skills, Progress, and Convo result surfaces.

- `score-ring.js` — overall score ring (`scoreTier`, `renderScoreRing`).
- `metric-tiles.js` — per-metric tiles (Accuracy, Fluency, Completeness, Pron, Prosody).
- `trouble-chips.js` — trouble-words / trouble-phonemes chip rows + their click wiring.
- `lux-card.js` — composes the above into row / expanded / detail card levels.
- `index.js` — barrel export.

## Conventions

- UI modules return HTML strings or mount themselves into a known DOM id; they don't import from features.
- Color decisions go through `core/scoring/index.js`'s `scoreClass` — never hardcode score thresholds here.
- All HTML interpolation must use `escapeHtml` from [`helpers/escape-html.js`](../helpers/escape-html.js).

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- [`core/scoring/index.js`](../core/scoring/index.js) — the locked scoring schema
