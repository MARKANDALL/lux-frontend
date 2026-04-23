# _parts

Partial stylesheets for the Convo picker. `lux-convo.picker.css` at the repo root is a thin barrel of `@import` lines — the actual rules are split across the numbered files in this folder. The numeric prefix enforces load order; cascade matters.

## Key Files (load order is the filename prefix)

- `lux-convo.picker.01-ui-stage.css` — Top-level `.lux-ui` stage plus mode-routing (`#convoApp[data-mode="picker"]` etc.).
- `lux-convo.picker.02-transitions.css` — Cross-fade / slide transitions between modes.
- `lux-convo.picker.03-panel-chrome.css` — Card/panel frame styling.
- `lux-convo.picker.04-intro-hero.css` — The intro-screen hero block.
- `lux-convo.picker.05-deck-shell.css` / `06-deck-media.css` / `07-deck-text-scrim.css` — The scenario deck: shell, image/video media layer, and gradient scrim over the text.
- `lux-convo.picker.08-picker-thumbs-upgrade.css` / `09-base-thumbs-and-nav.css` / `10-deck-states-and-atoms.css` — Thumbnail picker, nav arrows, per-state tweaks.

## Conventions

- **Filenames double as load order.** The number prefix is load-bearing — cascading rules in later files override earlier ones. Don't rename without also updating `lux-convo.picker.css`.
- **Scoped to the Convo picker.** These partials should not be imported from any other CSS bundle. If a rule is needed elsewhere, promote it to a shared file like `lux-widgets.core.css`.
- **No CSS-in-JS here.** Raw `.css` only; Vite handles the `@import` resolution.

## See Also

- [lux-convo.picker.css](../lux-convo.picker.css) — the barrel that imports every file in this folder
- [features/convo/](../features/convo/) — the feature whose UI these styles back
