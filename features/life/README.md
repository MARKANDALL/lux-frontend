# features/life

The Life Journey surface: a more game-like, mission-driven practice mode where learners progress through a deck of life events. Each mission can hand off to the AI Conversation feature with a pre-selected scenario. Mounted from `src/life.js` into `#lux-life-root`.

## Key Files

- `app.js` — `mountLifeApp({ rootId })` — composes the deck, wires storage, and runs the seeded Mulberry32 RNG that keeps a run's event order stable across reloads.
- `deck.js` — `LIFE_EVENTS`: the ordered/weighted pool of life-event cards.
- `storage.js` — `loadLifeRun`, `saveLifeRun`, `clearLifeRun` — run-state persistence in localStorage.
- `mission-bridge.js` — `launchLifeMissionToConvo(...)` — hands a selected life mission off to `features/convo` with the right scenario + knobs.
- `life.css` — Surface-specific styling.

## Conventions

- Deterministic RNG: the run seed is generated once and persisted so reloading does not reshuffle the deck.
- Life does not own its own assessment pipeline — practice still happens via recorder/convo; this feature is an orchestrator of which scenario/passage to show next.

## See Also

- [features/convo/README.md](../convo/README.md) — target of mission hand-off
- [src/life.js](../../src/life.js) — entry point
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
