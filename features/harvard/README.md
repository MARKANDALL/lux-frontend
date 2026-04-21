# features/harvard

The Harvard Sentences library — 72 phonetically-balanced practice passages filterable by phoneme content. This folder owns picker wiring, random-bag selection, and the Harvard Library modal (phoneme rows, favorites, detail view).

## Key Files

- `index.js` — wires the Harvard picker into the passage selector; lazy-loads Harvard list data and the library modal chunk on demand. Manages the random-bag (no-immediate-repeats) pick order via `K_HARVARD_RANDOM_BAG`.
- `modal.js` — thin entrypoint that re-exports `createHarvardLibraryModal` from `modal-controller.js`.
- `modal-controller.js` + `modal-controller/` — the library modal (list view, filtering, selection flow).
- `modal-phoneme-rows.js`, `modal-phoneme-metrics.js` — per-phoneme rows and metrics displayed in the modal.
- `modal-favs.js` — favorites pin/unpin.
- `modal-data.js`, `modal-dom.js`, `modal-dom-helpers.js` — data loading and DOM plumbing for the modal.
- `modal-actions.js`, `modal-render-list.js` — row actions and list rendering.

## Conventions

- **Lazy-load the data.** `ensureHarvardPassages()` and the modal chunk are imported only when needed — the picker surface stays lightweight.
- **Random-bag, not `Math.random()`.** Passage selection draws from a persistent bag (`K_HARVARD_RANDOM_BAG`) so learners don't see the same passage twice in a row.
- **Phoneme meta is generated.** `src/data/harvard-phoneme-meta.js` is produced by `scripts/build-harvard-phonemes.mjs`; never hand-edit it.

## See Also

- [src/data/harvard.js](../../src/data/harvard.js) — the canonical Harvard passage list
- [scripts/build-harvard-phonemes.mjs](../../scripts/build-harvard-phonemes.mjs) — regenerates phoneme meta
- [features/passages/](../passages) — the picker this feature plugs into
