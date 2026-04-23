# features/dashboard

The "My Progress" surface. On `index.html` it renders a collapsed drawer that lazy-expands; on `progress.html` it renders the full dashboard immediately. Composes primitives from `features/progress/` — rollups, render, next-practice scopes — and wires the AI Coach always-on shell and the "jump back to practice" handoffs.

## Key Files

- `index.js` — `initDashboard()` — fetches history via `_api/fetchHistory`, computes rollups (`features/progress/rollups`), and dispatches to `renderHistoryRows` or the Practice-side drawer. Also builds the Next-Practice block from the latest session or the latest single attempt.
- `ui.js` — `renderDashboard(targetId)` (loading state), `renderHistoryRows(attempts)` (full progress dashboard), `renderError(msg)`.

## Conventions

- **Two render modes.** On the Practice page the dashboard is a collapsed drawer; on the Progress page it renders inline. Both paths share the same `computeRollups` + `renderProgressDashboard` pipeline.
- **Classifies attempts by `passageKey`.** Anything starting with `convo:` is counted as an AI Conversation attempt rather than a Practice Skills attempt.
- **Lazy AI Coach mount.** `mountAICoachAlwaysOn` is invoked after the dashboard DOM exists so the drawer can attach to its anchor.

## See Also

- [features/progress/](../progress/) — rollups, render, attempt-pickers, next-practice
- [ui/ui-ai-ai-logic.js](../../ui/ui-ai-ai-logic.js) — AI Coach entry
