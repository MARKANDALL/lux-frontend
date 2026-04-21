# features/next-activity

Builds the "Next Practice Plan" — given a learner's current rollups (trouble phonemes and trouble words), picks a focus phoneme and selects the best-matching Harvard list or non-Harvard passage. Persists the plan so the Practice page can apply it on the next visit.

Two flavors: `next-practice` (passage-driven, full practice run) and `next-activity` (lighter glue around rollups for coaching surfaces).

## Key Files

- `next-practice.js` — `maybeApplyStoredNextPracticePlan`, `buildNextPracticePlan`. Picks a focus phoneme, lazy-loads passage phoneme metadata, scores Harvard + non-Harvard candidates, applies the winning passage to practice state.
- `next-activity.js` — `saveNextActivityPlan`, `consumeNextActivityPlan`. Tiny persistence layer on top of `K_NEXT_ACTIVITY`.

## Conventions

- Passage phoneme metadata is heavy — always resolve through `ensurePassagePhonemeMeta()`, never by static import.
- A plan is consumed-on-read: `consumeNextActivityPlan` removes the key after returning the value so stale plans don't persist.
- Harvard gets preference when the focus phoneme has coverage — the phonetic balance matters pedagogically.

## See Also

- [features/harvard/](../harvard/) — provides `loadHarvardList`
- [features/progress/rollups.js](../progress/rollups.js) — the rollups that seed plan selection
- [features/practice-highlight/](../practice-highlight/) — renders the picked passage with trouble-word/phoneme highlighting
