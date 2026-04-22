# features/next-activity

"Next Practice" targeting. Reads the learner's current trouble-sounds rollup, picks a focus phoneme, selects the best matching Harvard list or non-Harvard passage, and persists a plan that the Practice page applies on the next load. Also builds the Conversation target overlay used by `features/convo`.

## Key Files

- `next-practice.js` — `maybeApplyStoredNextPracticePlan()` + plan builder: lazy-loads passage phoneme meta, finds a candidate via `getCodesForIPA`, saves a plan under `K_NEXT_PRACTICE_PLAN`, and renders a practice preview.
- `next-activity.js` — Glue helpers: `saveNextActivityPlan`, `consumeNextActivityPlan`, and the conversation target-overlay builder (`buildConvoTargetOverlay`). Plans are stored under `K_NEXT_ACTIVITY`.

## Conventions

- Passage phoneme metadata is always reached through `ensurePassagePhonemeMeta()` so it stays off the first-paint path.
- Plans are one-shot: `consumeNextActivityPlan()` reads-then-removes the stored plan. Never leave a plan in storage after it has been applied.
- No DOM ownership here — this feature only decides *what* to practice; `features/passages` and `features/harvard` own *how* to show it.

## See Also

- [features/harvard/README.md](../harvard/README.md), [features/passages/README.md](../passages/README.md)
- [features/practice-highlight/README.md](../practice-highlight/README.md) — renders the resulting preview
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
