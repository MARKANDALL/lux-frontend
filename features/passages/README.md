# features/passages

Passage selection and passage-state coordination for the Practice Skills page. Owns the passage `<select>`, the custom-text input, the part-progress display, and the "next part" / "show summary" flow.

Thin controller layer over [app-core/state.js](../../app-core/state.js). Also drives the balloon updates.

## Key Files

- `index.js` — `wirePassageSelect`, `wireNextBtn`, `setPassage`, `markPartCompleted`, `updatePartsInfoTip`, `notePracticePassageSelection`. The controller API that other features call.
- `dom.js` — pure DOM accessors (`ui.select`, `ui.input`, `ui.nextBtn`, etc.) — a single place that knows the element IDs.

## Conventions

- Passage state is in [app-core/state.js](../../app-core/state.js) — this module reads/writes through those setters, never through its own globals.
- Custom passages split on punctuation into "parts" (max 15). Curated passages pre-declare their parts.
- DOM access goes through `dom.js`'s `ui.*` getters — if you need a new element, register it there first.
- Calls `updateBalloon` / `popBalloon` from [features/balloon/](../balloon/) — balloon logic is not duplicated here.

## See Also

- [app-core/state.js](../../app-core/state.js) — the passage-state primitives
- [src/data/](../../src/data/) — passage data, Harvard lists, phoneme metadata
- [features/balloon/](../balloon/) — the progress balloon this module drives
