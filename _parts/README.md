# _parts

Numbered CSS fragments composed into the larger `lux-convo.picker.css` bundle at the repo root. The `NN-name.css` prefix is **ordering**, not dependency — files are concatenated / imported in numeric order so later selectors can layer on earlier base rules.

## Pattern

- `01-ui-stage.css` — base stage layer
- `02-transitions.css` — transition primitives
- `03-panel-chrome.css` — panel shell
- `04-intro-hero.css` — intro hero
- `05-deck-shell.css` — deck container
- `06-deck-media.css` → `10-deck-states-and-atoms.css` — progressive layers for deck media, text scrim, thumbs upgrade, base thumbs/nav, and terminal state/atom rules.

## Conventions

- Keep the numeric prefix contiguous when adding a new fragment — do not leave gaps that imply deleted slices.
- A fragment should own one layer of visual concern; do not repeat selectors across files.
- `_parts/` ships CSS only — no JS, no templates.
- Folder name starts with `_` for sort order; it is not a private marker.

## See Also

- [`lux-convo.picker.css`](../lux-convo.picker.css) — the composed entry this folder feeds
- [`features/convo/picker-deck/`](../features/convo/picker-deck/) — JS consumer of the composed picker styles
