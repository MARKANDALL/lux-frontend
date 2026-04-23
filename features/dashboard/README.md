# features/dashboard

The "My Progress" surface. On `index.html` it mounts as a collapsed drawer that loads on expand; on `progress.html` it renders the full dashboard immediately. Pulls history, computes rollups, and delegates to the progress renderer + AI Coach.

## Key Files

- `index.js` — entrypoint; decides collapsed-vs-full based on page, calls `fetchHistory`, `computeRollups`, and `renderProgressDashboard`, and mounts the always-on AI Coach.
- `ui.js` — DOM shell construction and collapsed/expanded layout primitives.

## Conventions

- `features/dashboard` owns the **mount point** only; the actual charts, rollup UI, and attempt lists live in `features/progress/`.
- The collapsed drawer lazy-loads its contents on expand — don't eagerly render heavy charts at page boot.

## See Also

- [`features/progress/`](../progress/) — rollups, render, attempt-detail
- [`_api/attempts.js`](../../_api/attempts.js) — history fetching
- [`ui/ui-ai-ai-logic.js`](../../ui/ui-ai-ai-logic.js) — `mountAICoachAlwaysOn`
