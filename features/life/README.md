# features/life

The Life Journey surface (the `life.html` page). A more game-like, mission-driven practice mode: a deterministic deck of life events (job offer, apartment problem, …), each with a setting, NPC role, goal, and choices. The chosen choice + event gets handed off to the AI Conversations engine as a custom scene.

## Key Files

- `app.js` — `mountLifeApp({ rootId })`. Owns run lifecycle: seeded RNG (Mulberry32), event selection, choice presentation, persistence handoff.
- `deck.js` — `LIFE_EVENTS` array. Each event: `id`, `title`, `blurb`, `npcRole`, `setting`, `goal`, `wordBank`, `choices`.
- `storage.js` — `loadLifeRun` / `saveLifeRun` / `clearLifeRun` via `K_LIFE_RUN` from `app-core/lux-storage`.
- `mission-bridge.js` — `launchLifeMissionToConvo({ run, event, choice })`. Builds the scene description for the convo turn and saves it as a Next Activity plan that `convo.html` consumes on load.
- `life.css` — page-scoped styling.

## Conventions

- Run state is persisted through `app-core/lux-storage` under `K_LIFE_RUN`; never write raw `localStorage` here.
- The handoff to convo goes through `features/next-activity/saveNextActivityPlan` — do not bypass it.
- Seeded RNG (`mulberry32` + `randSeed32`) keeps a single run reproducible after reload.

## See Also

- [`features/convo/`](../convo/) — the AI-conversation engine the mission bridge hands off to
- [`features/next-activity/`](../next-activity/) — the plan-store the bridge writes to
