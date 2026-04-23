# features/interactions

Shared UI interaction hub. Wires hover tooltips, phoneme audio previews, the metric-score modal, legend toggles, and score-error collapse behaviour. Acts as a single mount point that imports and re-exports the individual interaction modules.

## Key Files

- `index.js` — hub: imports each interaction, re-attaches legacy `globalThis` aliases, and exposes `bootInteractions()`.
- `boot.js` — central idempotent boot routine with dynamic-import fallbacks (resilient to CSB path quirks).
- `ph-hover/` — phoneme chip hover carousel: tooltip render, video, modal, header preview.
- `metric-modal/` — detailed metric-score modal (derive, events, render).
- `ph-audio.js` / `ph-chips.js` — phoneme audio playback + chip behaviour.
- `yg-hover.js` — Youglish-on-hover word cards.
- `score-collapse.js` / `legend-toggle.js` / `tips.js` — small collapsible/tooltip helpers.

## Conventions

- `bootInteractions()` is idempotent — safe to call multiple times on page navigations.
- Legacy code expects these helpers at `globalThis.*` (e.g. `window.setupYGHover`); `index.js` preserves those bindings.
- If you add a new interaction, wire it through `boot.js` rather than booting it from a feature directly.

## See Also

- [`features/recorder/`](../recorder/) — calls `initMetricScoreModals` from here
- [`ui/`](../../ui/) — lower-level UI primitives that interactions compose on top of
