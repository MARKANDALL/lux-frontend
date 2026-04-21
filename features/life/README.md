# features/life

Life Journey — a mission-driven, game-like practice surface. Learners draw from a deck of realistic life events ("a job offer arrives", "apartment problem"), pick a response style, and get handed off into an AI conversation seeded by that mission.

## Key Files

- `app.js` — mounts the Life app into `#lux-life-root`. Uses a Mulberry32 deterministic RNG seeded from `crypto.getRandomValues` so a saved run is replayable.
- `deck.js` — the `LIFE_EVENTS` catalog: each entry has an `id`, `title`, `blurb`, `npcRole`, `setting`, `goal`, `wordBank`, and a small set of response `choices`.
- `mission-bridge.js` — hands off a selected mission + choice into the AI Conversation flow (`launchLifeMissionToConvo`).
- `storage.js` — `loadLifeRun` / `saveLifeRun` / `clearLifeRun` — persists the current run across reloads.
- `life.css` — styles for the deck and mission card.

## Conventions

- **Deterministic RNG.** Life uses seeded Mulberry32, not `Math.random()`, so a run is reproducible from its seed.
- **Missions hand off, not execute.** Life doesn't run the dialog itself — it seeds a payload and jumps to the Convo feature via `mission-bridge.js`.
- **Pure data in `deck.js`.** No logic or references to DOM; the deck is a serializable catalog.

## See Also

- [features/convo/](../convo) — the conversation engine the missions launch into
- [src/life.js](../../src/life.js) — page entry that mounts this feature
