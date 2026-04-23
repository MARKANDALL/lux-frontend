# features/next-activity

The bridge between "this session ended" and "here's what to practice next." Consumes rollups (ranked trouble phonemes + trouble words), picks a focus phoneme, picks the best matching Harvard list or passage, and stores a Next-Practice plan that the next page load consumes automatically.

## Key Files

- `next-activity.js` — Generic plan store. `saveNextActivityPlan(plan)` / `consumeNextActivityPlan()` (one-shot — consuming deletes the plan). `getPlanTargetWords(plan)`, `uniq` helpers. Keyed by `K_NEXT_ACTIVITY`. Used by Life Journey, AI Coach handoffs, and convo post-report.
- `next-practice.js` — The Practice-Skills-specific planner. Lazy-loads passage phoneme meta (`ensurePassagePhonemeMeta`), picks a focus phoneme from `rollups.trouble.phonemesAll[0]`, scores each Harvard list and non-Harvard passage for how many target phonemes it contains, and applies the winner via `setPassage` + `updatePartsInfoTip` + `renderPracticePreview`. Key: `K_NEXT_PRACTICE_PLAN`.

## Conventions

- **Plans are single-shot.** `consume*` deletes after read — don't add a "peek" path that skips the delete, you'll get stale recommendations.
- **Two plan namespaces.** `K_NEXT_ACTIVITY` is for cross-surface plans (Life → Convo, AI Coach → Convo). `K_NEXT_PRACTICE_PLAN` is specifically for the Practice Skills passage-picker auto-apply. They do not cross over.
- **Lazy meta load.** Passage phoneme meta is `await ensurePassagePhonemeMeta()` — never import it eagerly. The cache is module-local inside `next-practice.js`.

## See Also

- [features/progress/rollups.js](../progress/rollups.js) — the source of trouble phonemes/words
- [features/life/mission-bridge.js](../life/mission-bridge.js) — a consumer of `saveNextActivityPlan`
- [scripts/build-passage-phonemes.mjs](../../scripts/build-passage-phonemes.mjs)
