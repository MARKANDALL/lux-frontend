# _parts

Numbered CSS fragments that compose the AI Conversation scenario picker. They are split by concern (stage, transitions, chrome, hero, shells, media, scrims, thumbs, states) so the picker's styling can be worked on in small slices without scrolling through one monolithic file.

## Key Files

- `lux-convo.picker.01-ui-stage.css` — Outer `.lux-ui` stage container.
- `lux-convo.picker.02-transitions.css` — Cross-fade / slide transitions between picker states.
- `lux-convo.picker.03-panel-chrome.css` — Panel frame / chrome styling.
- `lux-convo.picker.04-intro-hero.css` — Intro hero screen.
- `lux-convo.picker.05-deck-shell.css` — Scenario deck shell container.
- `lux-convo.picker.06-deck-media.css` — Deck-card background imagery/video.
- `lux-convo.picker.07-deck-text-scrim.css` — Readable scrim over deck media.
- `lux-convo.picker.08-picker-thumbs-upgrade.css` — Enhanced thumbnail treatments.
- `lux-convo.picker.09-base-thumbs-and-nav.css` — Base thumbnail grid + navigation chrome.
- `lux-convo.picker.10-deck-states-and-atoms.css` — Per-state atoms (e.g. `prefers-reduced-motion` guards).

## Conventions

- Files are numbered so import order is obvious and stable. Keep numbering contiguous when adding new slices; renumber only if you must.
- Each file owns one concern. Resist the urge to split into tinier pieces or merge them back into one.
- Picker CSS stays here; non-picker conversation styles live in `lux-convo.*.css` at the repo root.

## See Also

- `lux-convo.picker.css` at the repo root — the aggregator that `@import`s these fragments
- [features/convo/README.md](../features/convo/README.md)
