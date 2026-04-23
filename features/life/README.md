# features/life

Life Journey — the `life.html` surface. A more game-like, mission-driven practice mode for learners who prefer structured progression over free practice. A run is a deterministic sequence of events (Mulberry32 RNG from a seed); each event hands off to Convo as a custom scene via the Next-Activity bridge.

## Key Files

- `app.js` — `mountLifeApp({ rootId })`. Main controller: setup view, run view, event drawing (seeded RNG + `seen` set so events don't repeat inside a run), choice selection, progress update, run completion.
- `deck.js` — `LIFE_EVENTS` — the deck of scenario cards (id, title, setting, NPC role, blurb, goal, choices, word bank).
- `storage.js` — `loadLifeRun` / `saveLifeRun` / `clearLifeRun` via `K_LIFE_RUN` on `app-core/lux-storage.js`.
- `mission-bridge.js` — `launchLifeMissionToConvo({ run, event, choice })`. Builds a v1 plan with a custom scene (`life:<runId>:<turn>:<eventId>`) and word-bank targets, saves it via `saveNextActivityPlan`, then navigates to `./convo.html#chat`.
- `life.css` — Run shell, event card, choice buttons, progress bar.

## Conventions

- **Deterministic RNG.** `mulberry32(seed)` makes a run reproducible. The seed is generated once (`crypto.getRandomValues`) and persisted with the run.
- **Events bridge to Convo, not to Practice Skills.** Life Journey reuses the Convo pipeline for the actual speaking turn — only the scene metadata is custom.
- **One active run.** `K_LIFE_RUN` holds a single run object; `clearLifeRun` discards it when the user restarts.

## See Also

- [features/convo/](../convo/) — where a mission actually runs
- [features/next-activity/next-activity.js](../next-activity/next-activity.js) — the plan-bridge contract
