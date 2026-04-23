# features/next-activity

The glue that turns rollups into a concrete "practice this next" suggestion. Picks a focus phoneme from the learner's trouble list, finds the best-matching Harvard list (or non-Harvard passage), stores a plan, and applies it the next time the practice page opens.

## Key Files

- `next-activity.js` — plan persistence: `saveNextActivityPlan` / `consumeNextActivityPlan` (keyed by `K_NEXT_ACTIVITY`).
- `next-practice.js` — the picker: scores phonemes against Harvard lists and passages (lazy-loading passage phoneme meta), then calls `setPassage()` and pre-renders the highlighted practice preview.

## Conventions

- Passage phoneme metadata is lazy-loaded on first use — do not import `passage-phoneme-meta.js` eagerly.
- Plans are one-shot: `consumeNextActivityPlan()` clears the store on read. Read once per practice open.
- Keyed focus phoneme is IPA in; normalise via `getCodesForIPA()` before matching.

## See Also

- [`features/progress/rollups.js`](../progress/rollups.js) — where trouble phonemes come from
- [`features/harvard/`](../harvard/) — Harvard list loader
- [`features/practice-highlight/`](../practice-highlight/) — preview highlighting
