# features/passages

The passage controller for Practice Skills. Owns passage selection (curated / custom / Harvard), part navigation, the "next part" button, and the summary trigger. Glues `app-core/state` to the practice DOM.

## Key Files

- `index.js` — public surface: `setPassage`, `markPartCompleted`, `wirePassageSelect`, `wireNextBtn`, `updatePartsInfoTip`, `notePracticePassageSelection`. Orchestrates passage state transitions and drives the balloon.
- `dom.js` — pure DOM handles (`#passageSelect`, `#referenceText`, `#suggestedSentence`, `#partProgress`, …) — the single place that knows the practice page's selectors.

## Conventions

- Passage state lives in `app-core/state.js` — `passages/` reads and updates it but does not own it.
- Custom passages cap at `MAX_CUSTOM_PARTS` (15). Do not raise without reconsidering part-navigation UX.
- Balloon updates are centralised here — feature modules call `updateBalloon` via `features/balloon/`, not directly.

## See Also

- [`app-core/state.js`](../../app-core/state.js) — the canonical passage state
- [`features/balloon/`](../balloon/) — the celebration widget driven from here
- [`features/recorder/`](../recorder/) — consumes `markPartCompleted`
