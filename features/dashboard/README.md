# features/dashboard

The "My Progress" dashboard bootstrap. On the Practice page it appears as a collapsed drawer that lazy-loads on expand; on the Progress Hub page it renders the full dashboard immediately. Pulls attempts via `_api/fetchHistory`, rolls them up with `features/progress/rollups`, and renders via `features/progress/render`.

## Key Files

- `index.js` — `initDashboard()` — detects whether we are on Practice or Progress Hub and mounts the appropriate shell. Also mounts the always-on AI coach for session-scoped rollups.
- `ui.js` — Thin DOM shell (container + loading state) prior to render takeover.

## Conventions

- Dashboard does not own rollup logic — that is `features/progress/rollups`. This folder only orchestrates fetch + render + drawer lifecycle.
- Drawer expansion uses `bringBoxBottomToViewport` from `helpers/dom.js` so it does not scroll-jump.

## See Also

- [features/progress/README.md](../progress/README.md) — rollups, render, wordcloud, attempt detail
- [src/progress.js](../../src/progress.js) — Progress Hub entry point
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
