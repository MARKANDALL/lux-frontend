# _parts

Numbered CSS fragments that compose a single visually-complex surface: the AI Conversation scenario picker. Splitting one giant stylesheet into ordered parts makes diffs reviewable and lets each concern (stage, transitions, chrome, deck media, thumbs, states) be edited in isolation. The underscore prefix keeps the folder sorted to the top alongside `_api`.

## Key Files

- `lux-convo.picker.01-ui-stage.css` — top-level `.lux-ui` stage and mode routing between `.lux-intro`, `.lux-picker`, `.lux-chatwrap`, `.lux-convo-progress`.
- `lux-convo.picker.02-transitions.css` — cross-mode fades and transitions.
- `lux-convo.picker.03-panel-chrome.css` — picker panel chrome (borders, shadows, framing).
- `lux-convo.picker.05-deck-shell.css` — `.lux-deck` 3D card-deck container (`transform-style: preserve-3d`).
- `lux-convo.picker.06-deck-media.css` — per-card media (images/video) behavior.
- `lux-convo.picker.10-deck-states-and-atoms.css` — hover/active/focus states and atomic rule groups.

## Conventions

- **Numeric ordering matters.** Files are loaded in filename order (01 → 10). Later parts intentionally override earlier ones. Don't reorder without checking the cascade.
- **Picker-only.** `_parts/` exists for the AI Conversation picker surface. Other surfaces use flat `lux-*.css` files at the repo root.
- **No JS here.** CSS only. Behavior lives in `features/convo/picker-deck.js` and siblings.

## See Also

- [features/convo/](../features/convo) — the picker behavior these fragments style
- `lux-convo.picker.css` (repo root) — the `@import` aggregator that pulls these fragments in order
