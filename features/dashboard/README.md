# features/dashboard

Bootstraps the progress dashboard on two surfaces: a collapsed "My Progress" drawer on `index.html` (lazy-loads on expand) and the full dashboard immediately on `progress.html`. This module is the glue layer — the actual rendering lives in [`features/progress/render/`](../progress/render/).

## Key Files

- `index.js` — `initDashboard` entry. Fetches history, computes rollups + immediate-scope rollups (latest attempt / latest session / 30-day window), picks the latest attempt, renders the dashboard, and mounts the Always-On AI Coach.
- `ui.js` — small DOM shims: `renderDashboard` (loading state), `renderHistoryRows`, `renderError`.

## Conventions

- This module reads attempts via `_api/index.js` `fetchHistory` — never directly via `fetch`.
- Composes (does not own) rollups, render, and next-practice-scope logic from [`features/progress/`](../progress/).
- `dashboard-root` is the canonical container id.

## See Also

- [`features/progress/`](../progress/) for rollups, renderers, and attempt pickers
- [`features/next-activity/`](../next-activity/) for the "what to practice next" suggestions surfaced here
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
