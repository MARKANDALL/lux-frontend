# features/progress

Everything behind the Progress Hub and the practice-page "My Progress" drawer: attempt fetching, schema-tolerant pickers, rollups, the attempt-detail modal, the wordcloud, and dashboard rendering.

## Key Files

- `attempt-pickers.js` — schema-drift-tolerant pickers (`pickTS`, `pickPassageKey`, `pickSessionId`, `pickSummary`, `pickAzure`). 13+ inbound imports; covered by `tests/attempt-pickers.test.js`.
- `rollups.js` + `rollups/` — pure rollup pipeline (totals, trouble sounds/words, trend, session summaries).
- `next-practice-scopes.js` — latest-attempt, current-session, and aggregate scopes used to build next-practice suggestions.
- `render/` — dashboard render path (`dashboard.js`, `mini.js`, `sparkline.js`, `export.js`, `format.js`).
- `attempt-detail/` + `attempt-detail-modal.js` — attempt-detail modal (header, metrics, AI coach section, trouble sections, chip explainers).
- `wordcloud/` — wordcloud page: compute, layout, canvas render, action sheet, URL state.

## Conventions

- Attempt data may arrive in snake_case or camelCase — always read fields through `attempt-pickers.js`, never directly.
- Rollup functions must stay pure and deterministic for the protection-ring tests to remain meaningful.
- The wordcloud is its own page (`src/wordcloud.js`) and has its own URL-state machine under `wordcloud/url-state.js`.

## See Also

- [`features/dashboard/`](../dashboard/) — mount point that renders `progress/render/`
- [`tests/attempt-pickers.test.js`](../../tests/attempt-pickers.test.js)
- [`core/scoring/index.js`](../../core/scoring/index.js) — scoring contract used throughout
