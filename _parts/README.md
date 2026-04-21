# _parts

Numbered CSS fragments for the AI Conversations scenario-picker UI. One logical stylesheet split across ordered files so each concern stays under 200 lines and the cascade stays explicit.

These files are stitched together via `@import` (or equivalent concatenation) into the final picker stylesheet — the numeric prefix locks load order.

## Contents

- `01-ui-stage.css` — root `.lux-ui` stage, mode routing for intro/picker/chat/progress.
- `02-transitions.css` — cross-mode transitions and fade states.
- `03-panel-chrome.css` — panel borders, shadows, corners.
- `04-intro-hero.css` — intro screen hero layout.
- `05-deck-shell.css` — scenario deck container.
- `06-deck-media.css` — deck background video/image.
- `07-deck-text-scrim.css` — text-over-media scrim gradients.
- `08-picker-thumbs-upgrade.css` — thumbnail strip sizing and hover.
- `09-base-thumbs-and-nav.css` — baseline thumb styles + deck nav arrows.
- `10-deck-states-and-atoms.css` — state modifiers and atomic utilities.

## Conventions

- Numeric prefix = cascade order. If you add a new fragment, give it a number that reflects when it should load.
- Keep each file tightly scoped to one concern — the whole point of the split is that a reader can pick up any file cold.
- `lux-` class prefix everywhere, matching the rest of the codebase.
- Folder is prefixed `_` so it sorts to the top next to [_api/](../_api/).

## See Also

- [features/convo/](../features/convo/) — the picker UI these styles support
- Top-level `lux-convo.picker.css` — the entry that pulls these fragments in
