# features/next-activity

Connects the practice loop to "what should I do next?" Picks a focus phoneme from the rollups, matches it to the best Harvard list or curated passage, and writes a plan into storage that the next page reads on boot. Also owns the Convo target overlay that jumps a learner into a conversation seeded for their trouble sounds.

## Key Files

- `next-activity.js` — `saveNextActivityPlan` / `consumeNextActivityPlan` against `K_NEXT_ACTIVITY`. Plus `buildConvoTargetOverlay` used by `features/convo/` to pre-target a scenario toward a learner's weak phonemes.
- `next-practice.js` — builds a Next Practice Plan: picks a focus phoneme from rollups, looks up matching Harvard lists via `features/harvard/`, falls back to non-Harvard passages via lazy-loaded `ensurePassagePhonemeMeta()`, and renders a preview via `features/practice-highlight/`.

## Conventions

- **Plans are consumed once.** `consumeNextActivityPlan()` reads and then immediately `remove()`s the stored plan — treat it as a one-shot handoff, not durable state.
- **Lazy meta.** Passage phoneme meta is a heavy JSON file; this feature lazy-loads it on first use and caches the result.
- **`K_*` keys only.** Storage keys (`K_NEXT_ACTIVITY`, `K_NEXT_PRACTICE_PLAN`) come from `app-core/lux-storage.js`.

## See Also

- [features/progress/rollups.js](../progress/rollups.js) — rollups this feature reads
- [features/harvard/](../harvard) — candidate lists for the plan
- [features/practice-highlight/](../practice-highlight) — renders the preview card
