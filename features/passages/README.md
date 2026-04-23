# features/passages

The passage picker and multi-part navigation controller that sits above the Practice Skills record button. Owns the passage `<select>`, the reference-text textarea, the parts progress/next-part UI, the custom-text mode, and the hand-off into the balloon progress visual.

## Key Files

- `index.js` — Controller. `wirePassageSelect`, `wireNextBtn`, `setPassage`, `markPartCompleted`, `updatePartsInfoTip`, `resetHasRecorded`. Reads + mutates the canonical `app-core/state.js` fields (`currentPassageKey`, `currentParts`, `currentPartIdx`, `isCustom`). Drives the balloon via `updateBalloon` / `popBalloon`.
- `dom.js` — Pure DOM manipulation. `ui` object of lazy `querySelector` getters for every passage-UI element (`#passageSelect`, `#referenceText`, `#partProgress`, `#suggestedSentence`, `#showSummaryBtn`, `#partsInfoTip`, …), plus read/write helpers.

## Conventions

- **State lives in `app-core/state.js`, not here.** This feature is the UI controller; the mutables are shared so `features/recorder/` can read them without importing us.
- **Two modes: curated + custom.** `setCustom(true)` switches to a 15-part free-form custom text; curated uses the canonical passages from `src/data/`.
- **Balloon is a display detail.** Only `features/passages/index.js` calls `updateBalloon` / `popBalloon` — don't spread that dependency.

## See Also

- [features/balloon/](../balloon/)
- [app-core/state.js](../../app-core/state.js)
- [src/data/](../../src/data/) — passage definitions
