# features/next-activity

"What should I practice next?" Two related plan-stores that bridge sessions:

- **Next Activity** — opaque plan handed from one feature to another (Life Journey → Convo, Convo report → Practice, …). Just a stash + consume API.
- **Next Practice** — the *recommendation* engine. Picks a focus phoneme from the user's rollups, finds the best Harvard list (or non-Harvard passage) that exercises that phoneme, and stores a plan that the practice page applies on load.

## Key Files

- `next-activity.js` — `saveNextActivityPlan` / `consumeNextActivityPlan` via `K_NEXT_ACTIVITY` from `app-core/lux-storage`. Includes `buildConvoTargetOverlay` for the convo handoff UI.
- `next-practice.js` — builds and applies a Next Practice Plan. Uses `getCodesForIPA` from `src/data/phonemes/core.js`, lazy-loads `src/data/passage-phoneme-meta.js`, and calls into [`features/passages/`](../passages/) and [`features/harvard/`](../harvard/) to apply the chosen passage.

## Conventions

- Plans are JSON blobs persisted under named `K_NEXT_*` keys — never write raw `localStorage`.
- Passage phoneme metadata is large; load via `ensurePassagePhonemeMeta()` only inside the next-practice planner.
- Consuming a plan is destructive (`consume*` removes it) — pages must call once per load.

## See Also

- [`features/progress/rollups.js`](../progress/rollups.js) — produces the trouble-phoneme rankings used here
- [`features/practice-highlight/`](../practice-highlight/) — renders the plan preview with highlighted target phonemes
- [`features/life/mission-bridge.js`](../life/mission-bridge.js) — writes a plan that `convo.html` consumes
