# features/dashboard

Two dashboards, one module:
1. The collapsed "My Progress" drawer on the Practice page (`/index.html`) — loads on expand.
2. The full Progress Hub on `/progress.html` — renders immediately.

Pulls attempt history from [_api/](../../_api/), runs it through [features/progress/rollups.js](../progress/rollups.js), and hands the result to [features/progress/render.js](../progress/render.js).

## Key Files

- `index.js` — `initDashboard`. Detects which page it's on, mounts the drawer or full dashboard, wires the AI Coach always-on surface.
- `ui.js` — DOM rendering for the dashboard shell and drawer chrome.

## Conventions

- On Practice: dashboard loads lazily when the user expands the drawer — initial-paint budget matters.
- On Progress Hub: full render on first call — this is the page's primary content.
- Rollups math lives in [features/progress/rollups.js](../progress/rollups.js), not here. This module is the composition layer.
- Uses `luxBus` to stay in sync with recorder/results — new attempts trigger a refresh.

## See Also

- [features/progress/](../progress/) — rollups + render + next-practice computation
- [src/progress.js](../../src/progress.js) — the Progress Hub entry point
