# features/harvard

The Harvard Sentences library: 72 standardized phonetically-balanced passages, surfaced through a picker (on the Practice page) and a full-library modal with per-phoneme metrics, favorites, and random-bag selection. Next-practice targeting relies on this feature to pick passages that exercise a learner's trouble phonemes.

## Key Files

- `index.js` — Wires the Harvard picker UI, lazy-loads the Harvard passage data and the library modal bundle on demand, and manages the "random bag" rotation (stored under `K_HARVARD_LAST` / `K_HARVARD_RANDOM_BAG`).
- `modal.js` — Thin entrypoint; delegates to `modal-controller.js`.
- `modal-controller/` and `modal-controller.js` — Orchestration for the library modal: list rendering, selection, paging.
- `modal-phoneme-rows.js` / `modal-phoneme-metrics.js` — Per-phoneme rows showing coverage and recent scores per passage.
- `modal-favs.js` — Favorites persistence.

## Conventions

- Harvard passage data is lazy-loaded via `src/data/ensureHarvardPassages()`. Never statically import `harvard.js` on pages that do not need it; it stays off the first-paint path.
- Passage keys are generated via `harvardKey(n)` — format is `harvard01`, `harvard02`, ..., `harvard72`. Use the helper, never hand-build the string.

## See Also

- [features/passages/README.md](../passages/README.md) — passage state the picker drives
- [features/next-activity/README.md](../next-activity/README.md) — next-practice targeting consumes Harvard phoneme metadata
- [scripts/build-harvard-phonemes.mjs](../../scripts/build-harvard-phonemes.mjs)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
