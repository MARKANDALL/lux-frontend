# features/life

Life Journey — a game-like, mission-driven practice surface. Presents the learner with scenario events (job offer, apartment problem, …), each with a goal, word bank, and choice set. Selected missions can be launched into the AI Conversation flow.

## Key Files

- `app.js` — run controller: seeded RNG (Mulberry32), event picker, run lifecycle (load / save / clear via `storage.js`), choice handling.
- `deck.js` — the `LIFE_EVENTS` deck: `{ id, title, blurb, npcRole, setting, goal, wordBank, choices[] }`.
- `storage.js` — `loadLifeRun` / `saveLifeRun` / `clearLifeRun` (persists current run state).
- `mission-bridge.js` — `launchLifeMissionToConvo()` — hands off a mission to `features/convo/` with the right scenario/knobs.
- `life.css` — card deck styling.

## Conventions

- Deterministic RNG: runs are seeded so the same seed reproduces the same deck order — don't replace `mulberry32` with `Math.random` for event picking.
- Events are authored — keep `deck.js` the single source; don't generate events on the fly.
- Mounted from `src/life.js` on `life.html`.

## See Also

- [`src/life.js`](../../src/life.js)
- [`features/convo/`](../convo/) — the handoff target for missions
