# features/harvard

The Harvard Sentences picker and library modal. Harvard is the standardized phonetically-balanced corpus (72 lists × 10 sentences) that anchors Lux's pronunciation practice library.

Lazy-loads the Harvard list data (it's large) and the library modal chunk (on demand). Drives the "practice a list" flow and the phoneme-filtered library browser.

## Key Files

- `index.js` — `wireHarvardPicker`, `loadHarvardList`. Public surface.
- `modal.js` — library modal entry. Renders the filterable grid of 72 lists.
- `modal-controller.js` — orchestrates modal state (filters, selection, favorites).
- `modal-phoneme-rows.js` / `modal-phoneme-metrics.js` — renders per-list phoneme coverage using `src/data/harvard-phoneme-meta.js`.
- `modal-favs.js` — per-user favorites (persisted via [app-core/lux-storage.js](../../app-core/lux-storage.js)).
- `modal-render-list.js` / `modal-data.js` — list rendering + data shaping.

## Conventions

- Harvard list data is lazy-loaded via `ensureHarvardPassages()` — never statically import from `src/data/harvard.js` at module top level.
- Phoneme metadata is pre-computed by `scripts/build-harvard-phonemes.mjs`. If you change the CMU mapping rules, re-run that script and commit the regenerated file.
- The "random bag" (shuffled queue with no immediate repeats) is persisted in localStorage under `K_HARVARD_RANDOM_BAG`.

## See Also

- [scripts/build-harvard-phonemes.mjs](../../scripts/build-harvard-phonemes.mjs) — generates the phoneme metadata
- [features/next-activity/](../next-activity/) — uses Harvard phoneme data to pick the best list for a learner's trouble sound
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md) — pedagogy section on Harvard
