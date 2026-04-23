# features/harvard

Harvard Sentences picker and library modal. Lazy-loads the 72-list corpus and its phoneme metadata on first use so the practice page stays lean.

## Key Files

- `index.js` — wires the picker UI, manages the `K_HARVARD_RANDOM_BAG` reshuffle pattern, and lazy-loads list data via `ensureHarvardPassages()`.
- `modal.js` / `modal-controller.js` / `modal-controller/` — the Harvard Library modal (phoneme-filtered browsing, favourites).
- `modal-phoneme-metrics.js` / `modal-phoneme-rows.js` — phoneme-aware filters and row rendering.
- `modal-favs.js` — favourites persistence.
- `modal-render-list.js` — main list body render path.

## Conventions

- The corpus is large and phoneme-filterable — keep all corpus access behind `ensureHarvardPassages()` / `loadHarvardList()` so the data blob stays lazy.
- Random-bag pattern: once each list has appeared, the bag refills — avoid biasing by replacing the bag shuffle logic without re-checking coverage.
- `harvardKey(n)` → `"harvardNN"` is the canonical key form; always zero-pad.

## See Also

- [`src/data/harvard.js`](../../src/data/harvard.js) — corpus + phoneme metadata
- [`scripts/build-harvard-phonemes.mjs`](../../scripts/build-harvard-phonemes.mjs) — how the phoneme meta is generated
- [`features/passages/`](../passages/) — passages share the same `setPassage()` interface
