# features/progress

Everything behind the Progress surface and the per-attempt detail modal: pure rollup computation over attempt history, the render layer for the dashboard, the attempt-detail modal, the Next-Practice scope helpers, and the Wordcloud visualization.

## Key Files & Subfolders

- `rollups.js` + `rollups/` — Pure attempts → rollups pipeline. `computeRollups(attempts, opts)` returns totals, trouble phonemes/words (ranked), trend, and per-session summaries. Split into `rollupsUtils`, `rollupsAccumulate`, `rollupsMetrics`, `rollupsSnapshots`, `rollupsPostProcess`.
- `attempt-pickers.js` — The five canonical pickers for an attempt record: `pickTS`, `pickPassageKey`, `pickSessionId`, `pickSummary`, `pickAzure`. Every consumer should route through these — attempt records come from multiple API versions.
- `render.js` + `render/` — Dashboard renderer. `render/dashboard.js`, `render/mini.js`, `render/format.js`, `render/sparkline.js`, `render/export.js`. `render.js` is a barrel plus `wireMyWordsLibraryGateway`.
- `attempt-detail-modal.js` + `attempt-detail/` — Per-attempt expanded modal. Sub-modules: `header`, `chips`, `chip-explainers`, `metrics`, `trouble-sections`, `attempts-section`, `ai-coach-section`, `derive`, `format`, `modal-shell`.
- `next-practice-scopes.js` — `pickLatestAttempt`, `pickAttemptsForLatestSession`, `computeImmediateScopeRollups` — used by the dashboard to build "based on your current session" vs "based on your latest line" Next-Practice blocks.
- `wordcloud/` — The `wordcloud.html` surface: data loader, compute, rendering via `d3.layout.cloud` (vendored), dock, filters, timeline, drawers.
- `progress-utils.js` — `getColorConfig(s)` (blue/yellow/red hex tokens) and `mean(nums)`. Plus `esc = escapeHtml`.

## Conventions

- **Pure rollups.** `rollups.js` never touches DOM or storage. Feed it attempts in; get totals out.
- **Attempts have multiple shapes.** Always read through `attempt-pickers.js` — never `attempt.ts` / `attempt.passageKey` directly.
- **Wordcloud uses vendored d3.** See `public/vendor/d3.v7.min.js` and `d3.layout.cloud.js`.

## See Also

- [features/dashboard/](../dashboard/) — the primary consumer
- [tests/attempt-pickers.test.js](../../tests/attempt-pickers.test.js)
- [ui/components/lux-card.js](../../ui/components/lux-card.js) — card compositor used in render
