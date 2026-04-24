# _parts

Numbered CSS fragments imported by parent stylesheets at the repo root via `@import`. The convention exists so a single feature's CSS can be split into reviewable chunks (UI stage, transitions, panel chrome, hero, deck, …) without forcing readers through one 2,000-line file.

Currently used for the Convo scenario picker:

```css
/* lux-convo.picker.css at the repo root */
@import "./_parts/lux-convo.picker.01-ui-stage.css";
@import "./_parts/lux-convo.picker.02-transitions.css";
@import "./_parts/lux-convo.picker.03-panel-chrome.css";
/* … through 10-deck-states-and-atoms.css */
```

## Naming Convention

`<parent-stylesheet>.<two-digit-order>-<short-slug>.css`

- Two-digit prefix preserves load order in the parent `@import` list and in directory listings.
- Short slug describes what's inside (`ui-stage`, `panel-chrome`, `intro-hero`, `deck-shell`, `deck-media`, `text-scrim`, `picker-thumbs-upgrade`, `base-thumbs-and-nav`, `deck-states-and-atoms`).
- Files are loaded in numeric order, so later parts can override or extend earlier ones.

## Conventions

- Add a new fragment by bumping the next number and adding the matching `@import` line in the parent root-level stylesheet.
- These files are NOT entry points. They have no meaning unless the parent imports them.
- If a fragment is only ever used by one feature module's JS, prefer colocating the CSS in that feature's folder instead of adding to `_parts/`.

## See Also

- [`lux-convo.picker.css`](../lux-convo.picker.css) at the repo root — the parent stylesheet for the current fragments
