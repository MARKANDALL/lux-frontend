# features/interactions

Shared micro-interactions wired across the Practice and Results surfaces: phoneme hover cards, phoneme audio playback, YouGlish hover, score-error collapse, prosody legend toggle, metric tip animations, and click hints. These are the small behaviors that make the results readout feel alive.

## Key Files

- `index.js` — Imports every interaction module and re-attaches legacy `globalThis` aliases (e.g. `globalThis.setupYGHover`) so older call sites keep working while migration completes.
- `boot.js` — Idempotent, dynamic-import-based boot with fallback paths for CodeSandbox/quirky loaders. The canonical entrypoint for auto-wiring.
- `ph-hover.js`, `ph-audio.js`, `ph-chips.js` — Phoneme chip behavior: hover card, audio preview, chip click/collapse.
- `yg-hover.js` — YouGlish hover preview.
- `score-collapse.js` / `legend-toggle.js` / `tips.js` — Score-error collapse, prosody legend toggle, metric tip animation.
- `helpers.js`, `utils.js` — `showClickHint`, `safePlay`, `playWithGesture`, `prepareVideo`.

## Conventions

- Boot is idempotent; calling `bootInteractions()` twice is a no-op. Rely on `guardedListener` from `app-core/lux-listeners.js` for document/window handlers.
- Legacy global aliases stay in `index.js` until all callers migrate; do not remove them unsupervised.
- Phoneme audio URLs resolve through `src/data/phonemes/assets.js`.

## See Also

- [features/results/README.md](../results/README.md) — main consumer surface
- [src/data/phonemes/](../../src/data/phonemes/) — phoneme asset registry
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
