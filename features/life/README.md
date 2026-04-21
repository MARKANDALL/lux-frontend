# features/life

Life Journey — a more game-like, mission-driven practice surface. The learner draws from a deck of scenario events (job offer, apartment problem, etc.), makes a choice, then hands off into a targeted Convo session that exercises the mission.

Uses a seeded RNG (Mulberry32) so runs are reproducible when needed and a local deck of events keyed by `id`.

## Key Files

- `app.js` — `mountLifeApp`. The entry. Seeded RNG, deck draw, seen-set, event selection.
- `deck.js` — the mission manifest (`LIFE_EVENTS`): id, title, blurb, NPC role, setting, goal, word bank, choices.
- `storage.js` — `loadLifeRun`, `saveLifeRun`, `clearLifeRun`. Persists run state.
- `mission-bridge.js` — `launchLifeMissionToConvo`. Translates a chosen mission into a Convo scenario + knobs configuration and hands off.
- `life.css` — styles for the Life deck and mission cards.

## Conventions

- Mission data in `deck.js` follows the same "identity and scene function only" rule as Convo scenarios — NPC + setting + goal, no behavioral scripting.
- All randomness runs through the seeded RNG — don't use `Math.random()` for anything that affects draw order.
- The bridge to Convo is one-way — a Life mission opens a Convo session, not the reverse.

## See Also

- [features/convo/](../convo/) — the target of `mission-bridge.js`
- [src/life.js](../../src/life.js) — the page entry that mounts this feature
