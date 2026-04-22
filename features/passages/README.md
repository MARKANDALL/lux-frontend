# features/passages

The Practice-page passage controller. Owns the passage-select dropdown, the "Next Part" button, multi-part progress, the balloon inflate/pop hook, and the bridge between `src/data/passages` and `app-core/state.js`.

## Key Files

- `index.js` — `wirePassageSelect`, `wireNextBtn`, `setPassage`, `updatePartsInfoTip`, `markPartCompleted`, `notePracticePassageSelection`. The canonical surface every other feature calls into for passage state.
- `dom.js` — DOM helpers for the passage select element and parts info tip.

## Conventions

- All passage state changes go through `app-core/state.js` setters (`setPassageKey`, `setPartIdx`, `setParts`) so the rest of the app observes them via `luxBus`.
- Balloon updates are driven from `markPartCompleted` via `features/balloon`; passages never touches the balloon DOM directly.
- Custom (free-text) passages and canned passages share the same state slots — check `isCustom()` when you need to branch.

## See Also

- [features/harvard/README.md](../harvard/README.md) — Harvard picker feeds into this controller
- [features/balloon/README.md](../balloon/README.md)
- [app-core/state.js](../../app-core/state.js)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
