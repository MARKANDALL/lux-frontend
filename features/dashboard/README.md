# features/dashboard

The "My Progress" dashboard. Renders differently depending on the page: on `index.html` it appears as a collapsed drawer that expands on demand; on `progress.html` it renders the full dashboard immediately. Pulls attempt history via `_api`, runs rollups, and delegates rendering to `features/progress/render/`.

## Key Files

- `index.js` — public `initDashboard()` entry. Decides drawer-vs-full-page mode, fetches history, computes rollups, and renders. Also mounts the always-on AI Coach.
- `ui.js` — dashboard-specific DOM helpers (drawer toggle, actions area, expand/collapse animation).

## Conventions

- **Mode is page-driven.** Presence of `#dashboard-root` and the page URL decide the rendering mode; no config flag is needed.
- **Reads rollups, doesn't compute them.** All rollup math lives in `features/progress/rollups/`; this folder is a view layer.

## See Also

- [features/progress/](../progress) — rollup computation and the render layer this feature calls into
- [_api/attempts.js](../../_api/attempts.js) — `fetchHistory` backs the dashboard
