# features/interactions

Shared UI interaction helpers that are too small to be features in their own right but too specific to live in `helpers/`: phoneme hover cards, Youglish hover, phoneme-chip audio, metric modals, legend toggles, score-error collapse, and the click-hint affordance.

Auto-boots on import — `bootInteractions()` fires idempotently, and commonly-used functions are re-attached to `globalThis` for legacy callers.

## Key Files

- `index.js` — barrel + auto-boot. Re-attaches legacy globals (`setupYGHover`, `initPhonemeAudio`, `showClickHint`, etc.).
- `boot.js` — `bootInteractions`. Idempotent. Uses dynamic imports with fallbacks so sandbox path quirks don't break the app.
- `ph-hover.js` / `ph-hover/` — phoneme hover card (video + articulator + examples).
- `ph-chips.js` / `ph-audio.js` — click-to-play audio on phoneme chips.
- `metric-modal.js` / `metric-modal/` — the detail modal for Accuracy/Fluency/Completeness/Prosody tiles.
- `tips.js` — metric-tile tip animations.
- `score-collapse.js` — expand/collapse on the detail rows.
- `legend-toggle.js` — prosody legend show/hide.

## Conventions

- Importing `features/interactions/index.js` has side effects (auto-boot + globals). That's intentional.
- Legacy globals survive for HTML pages that expect them (admin, inline scripts). Do not remove them without auditing inline `<script>` usage.
- Phoneme assets are resolved via `src/data/phonemes/assets.js` — hover and audio modules should never hardcode paths.

## See Also

- [src/data/phonemes/](../../src/data/phonemes/) — the phoneme metadata + assets
- [ui/lux-warn.js](../../ui/lux-warn.js) — `warnSwallow` is used throughout the boot fallbacks
