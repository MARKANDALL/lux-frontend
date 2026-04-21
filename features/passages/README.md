# features/passages

Passage controller — owns the current-passage state machine that sits between the picker UI and the recorder. Handles curated vs custom passages, multi-part navigation, tips, and the `showSummaryBtn` reveal logic.

## Key Files

- `index.js` — controller. `wirePassageSelect`, `wireNextBtn`, `setPassage`, `setCustom`, `markPartCompleted`, `updatePartsInfoTip`, and friends. Integrates with `app-core/state.js` as the single source of passage state.
- `dom.js` — thin DOM layer reading/writing the page's passage-related elements (`#passageSelect`, `#referenceText`, `#suggestedSentence`, `#partProgress`, `#nextPartBtn`, `#showSummaryBtn`, `#partsInfoTip`, …).

## Conventions

- **Separation of concerns.** `index.js` contains all logic and state mutations; `dom.js` is a pure DOM accessor. Don't mix the two.
- **Custom mode has a part cap.** `MAX_CUSTOM_PARTS = 15`. Don't raise this without checking the recorder UX implications.
- **Balloon is wired here.** `updateBalloon` / `popBalloon` from `features/balloon/` are called from this controller as parts advance.

## See Also

- [features/balloon/](../balloon) — the UI animation this controller drives
- [features/harvard/](../harvard) — plugs its own picker into the same selector
- [app-core/state.js](../../app-core/state.js) — the shared state this controller mutates
