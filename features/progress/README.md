# features/progress

Everything the Progress Hub renders: rollups math, attempt pickers, attempt detail modal, wordcloud, trend sparkline, session grouping, and next-practice scope computation.

The largest feature module after `convo/`. Pure functions live here too — `rollups.js` and `attempt-pickers.js` are imported from 13+ places and are covered by protection-ring tests.

## Key Files

- `rollups.js` — `computeRollups(attempts) → { totals, troubleSounds, troubleWords, trend, sessions }`. Pure. The foundation of every dashboard surface.
- `attempt-pickers.js` — `pickTS`, `pickPassageKey`, `pickSessionId`, `pickSummary`, `pickAzure`. Defensive shape-pickers for attempt records. Protection-ring tested.
- `render.js` / `render/` — dashboard rendering. `wireMyWordsLibraryGateway` ensures the My Words library button exists on the Progress Hub.
- `attempt-detail.js` / `attempt-detail/` — per-attempt detail modal (AI Coach, trouble sections, chip explainers, metrics).
- `rollups/` — split implementation of rollups: `rollupsAccumulate`, `rollupsMetrics`, `rollupsSnapshots`, `rollupsPostProcess`, `rollupsUtils`.
- `wordcloud/` — the entire Wordcloud page logic (compute, render-canvas, events, state-store, side drawers).
- `next-practice-scopes.js` — picks the "latest attempt" and "latest session" scopes for next-practice computation.
- `progress-utils.js` — tiny shared helpers (color config, `esc`, `mean`).

## Conventions

- `rollups.js` is pure. No DOM, no fetch. If you need side effects, they belong in `render.js` or the caller.
- Attempt records come from multiple backend shapes over time — always go through `attempt-pickers.js` rather than reading fields directly.
- The rollups split lives in `rollups/` — don't fold it back into one file. The split is what makes this reviewable.
- Wordcloud is self-contained inside `wordcloud/` — it has its own state store, its own DOM, its own events, and its own CSS.

## See Also

- [features/dashboard/](../dashboard/) — the caller that composes rollups + render
- [features/next-activity/](../next-activity/) — consumes `next-practice-scopes` output
- [tests/attempt-pickers.test.js](../../tests/attempt-pickers.test.js) — protection-ring tests
