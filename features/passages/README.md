# features/passages

Passage selection and part navigation on the Practice Skills page. Owns the dropdown wiring, the parts progress UI, the "Next Part" / "Show Summary" buttons, the custom-text mode, and the in-input tooltips that explain curated vs custom.

This module is the controller; the actual passage data lives in [`src/data/`](../../src/data/) and the curated/Harvard list contents come from `passages.js` and `harvard.js`.

## Key Files

- `index.js` — `wirePassageSelect`, `wireNextBtn`, `setPassage`, `markPartCompleted`, `updatePartsInfoTip`. Holds the controller logic that mediates between `app-core/state.js` and the DOM.
- `dom.js` — pure DOM accessors and mutators (`#passageSelect`, `#referenceText`, `#partProgress`, `#nextPartBtn`, `#showSummaryBtn`, `#partsInfoTip`, …). All DOM access for this surface goes through here.

## Conventions

- All passage / part state lives in [`app-core/state.js`](../../app-core/state.js); this module reads it via setters/getters and never owns local state.
- DOM ids are read in `dom.js`'s `ui` getter object — search there before adding new selectors.
- Balloon updates go through [`features/balloon/`](../balloon/), not direct DOM.

## See Also

- [`src/data/passages.js`](../../src/data/passages.js), [`src/data/harvard.js`](../../src/data/harvard.js) for content
- [`features/harvard/`](../harvard/) for the Harvard picker which delegates here
- [`features/balloon/`](../balloon/) for the parts-completed UI
