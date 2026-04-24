# features/progress

The Progress page (and the embedded "My Progress" drawer on the Practice page). Owns attempt rollups, the dashboard renderer, the attempt-detail modal, the wordcloud surface, the next-practice scope helpers, and schema-tolerant attempt-field pickers.

This is one of the largest folders in the codebase because it spans data shaping (rollups), rendering (dashboard, sparkline, mini), and a separate modal subsystem (attempt-detail).

## Key Files

- `attempt-pickers.js` — `pickTS`, `pickPassageKey`, `pickSessionId`, `pickSummary`, `pickAzure`. Schema-drift-tolerant readers for attempt records (handles `ts`/`created_at`/`createdAt`, `passage_key`/`passageKey`, …). Tested by [`tests/attempt-pickers.test.js`](../../tests/attempt-pickers.test.js).
- `rollups.js` + `rollups/` — pure aggregation: attempts → totals + trouble sounds/words + trend + session summaries.
- `render.js` + `render/` — dashboard renderer (`dashboard/`, `mini.js`, `sparkline.js`, `format.js`, `export.js`). Also wires the My Words gateway button onto the Progress page.
- `attempt-detail-modal.js` + `attempt-detail/` — the session "Attempt Details" micro-report modal (header, trouble sounds/words, attempts list, AI Coach memory, derive helpers).
- `next-practice-scopes.js` — `pickLatestAttempt`, `pickAttemptsForLatestSession`, `computeImmediateScopeRollups` for the Next Practice planner.
- `progress-utils.js` — color-config helper that mirrors the locked Blue/Yellow/Red scoring.
- `wordcloud/` — the standalone wordcloud surface (its own `index.js`, render pipeline, state store, dom layer, dock CSS).

## Conventions

- All score colors flow from `core/scoring/index.js`'s `scoreClass` — never hardcode the 80/60 thresholds here.
- Read attempt fields via the pickers in `attempt-pickers.js`; any new field shape must extend a picker rather than read raw keys at call sites.
- Rollup helpers are pure; keep DOM out of them so they stay easy to test.

## See Also

- [`features/dashboard/`](../dashboard/) — the bootstrap layer that calls into here
- [`features/next-activity/`](../next-activity/) — consumes the rollups
- [`tests/attempt-pickers.test.js`](../../tests/attempt-pickers.test.js)
