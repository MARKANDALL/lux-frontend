# features/progress

Attempt rollups and the progress UI. Takes raw attempt objects from `_api/attempts.js` and turns them into: totals, trouble sounds, trouble words, trend, session summaries, sparklines, wordcloud data, and the per-attempt detail modal. All attempt math lives here — dashboard and wordcloud pages both read from this folder.

## Key Files

- `attempt-pickers.js` — schema-drift-tolerant field pickers (`pickTS`, `pickPassageKey`, `pickSessionId`, `pickSummary`, `pickAzure`). 13 inbound imports — the single source of truth for "which field on an attempt holds the timestamp?"
- `rollups.js` — public barrel for rollup computation. Delegates to `rollups/rollupsAccumulate.js`, `rollupsSnapshots.js`, `rollupsPostProcess.js`, `rollupsMetrics.js`, `rollupsUtils.js`.
- `next-practice-scopes.js` — `pickLatestAttempt`, `pickAttemptsForLatestSession`, `computeImmediateScopeRollups` for the "what should I practice next?" flow.
- `render.js` + `render/` — the dashboard/progress render layer (`index`, `format`, `header`, `metrics`, `chips`, `trouble-sections`, `attempts-section`, `ai-coach-section`, `modal-shell`, `derive`).
- `attempt-detail-modal.js` + `attempt-detail/` — the expanded single-attempt modal.
- `wordcloud/` — the wordcloud page's data loader, canvas renderer, side drawers, state store, URL state, and event handlers.
- `progress-utils.js` — shared small helpers.

## Conventions

- **Go through the pickers.** Attempt schema drifts (snake_case vs camelCase, `passage_key` vs `passageKey`). Never read raw attempt fields — always call a `pick*()`.
- **Rollups are pure.** Files under `rollups/` take attempts in and return rollup objects out; no DOM, no network.
- **Tested.** `attempt-pickers.js` has dedicated coverage at `tests/attempt-pickers.test.js`. Breaking its shape breaks 13 call sites.

## See Also

- [features/dashboard/](../dashboard) — primary consumer of the render layer
- [src/wordcloud.js](../../src/wordcloud.js) — page entry for the wordcloud view
- [tests/attempt-pickers.test.js](../../tests/attempt-pickers.test.js)
