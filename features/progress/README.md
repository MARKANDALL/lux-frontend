# features/progress

Progress-side logic: attempt rollups, dashboard render, wordcloud visualization, attempt-detail modal, and the next-practice scope helpers. This is one of the largest feature folders — most subsystems have their own sub-folder.

## Key Files / Subfolders

- `rollups.js` + `rollups/` — Pure, side-effect-free rollups that turn a list of attempts into totals, trouble sounds, trouble words, trend, and session summaries. Consumed by the dashboard and Next Practice.
- `render.js` + `render/` — The Progress Hub dashboard renderer (`renderProgressDashboard`), plus export, mini-sparkline, and format helpers.
- `attempt-pickers.js` — `pickTS`, `pickPassageKey`, `pickSessionId`, `pickSummary`, `pickAzure` — shape-tolerant readers that normalize attempt records from multiple historical layouts.
- `next-practice-scopes.js` — `pickLatestAttempt`, `pickAttemptsForLatestSession`, `computeImmediateScopeRollups` — narrow-scope rollups used by the always-on AI coach and Next Practice targeting.
- `attempt-detail/` + `attempt-detail-modal.js` — The per-attempt detail modal (metrics, chips, AI coach section, trouble sections).
- `wordcloud/` — Canvas-based wordcloud view with its own D3-layout wiring, drawers, strips, and URL-driven state.
- `progress-utils.js` — Shared helpers used across the subfolders.

## Conventions

- Rollup modules are pure and fully unit-tested (see `tests/attempt-pickers.test.js`). Never introduce DOM or network calls there.
- Attempt pickers must stay shape-tolerant — old attempts with legacy field names still appear in production history.
- Wordcloud vendor libs (`d3`, `d3.layout.cloud`) load from `public/vendor/` at runtime, not through the bundler.

## See Also

- [features/dashboard/README.md](../dashboard/README.md) — uses this feature's rollups + render
- [features/my-words/README.md](../my-words/README.md) — cross-links from trouble-word sections
- [tests/attempt-pickers.test.js](../../tests/attempt-pickers.test.js)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
