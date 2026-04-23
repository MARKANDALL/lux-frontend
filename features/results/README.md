# features/results

Results renderer for Practice Skills — takes an Azure pronunciation-assessment payload and builds the full Results card: score ring, metric tiles, phoneme chips, prosody ribbon, trouble section, and the multi-part summary view. Consumers are `features/recorder/` (per-attempt) and `features/dashboard/` (summary).

## Key Files

- `index.js` — Canonical entry. `showPrettyResults(data)`, `showDetailedAnalysisSingle(result)`, `showSummary({ allPartsResults, currentParts })`, `showRawData`, `updateSummaryVisibility`. Boots phoneme hover/chip hydration lazily and exactly once per page.
- `header.js` / `header-modern.js` — Results header shell: score ring, metric tiles, accordion toggles, prosody legend. `header.js` re-imports the interactions modules directly (ES-module path) with legacy-global fallbacks for pre-module shim support.
- `render-core.js` / `render-helpers.js` / `render-modern.js` — Core rendering of the word/phoneme table. `showPrettyResults` in `render-modern.js` is the Phase-E renderer.
- `rows.js` / `rows-logic.js` — Per-word row construction (phoneme chips + prosody ribbon per row).
- `summary.js` / `summary-shell.js` / `summary-feedback.js` — Multi-part summary view. `showSummaryWithTracking` wraps `summary-shell` with part-progression analytics.
- `syllables.js` / `syllables/` — Syllable break rendering when Azure returns syllable data.
- `deps.js` — Internal wiring for external dependencies (phoneme audio, legend toggle, metric modal).

## Conventions

- **Boot once per page.** `phonemeHoverBooted` and `hydratePhonemeChips` guards are intentional — multiple mounts break tooltip positioning.
- **Phase-E renderer is the canonical path.** `legacyShowPrettyResults` is the module's own `render-modern.js` export, renamed for clarity — not an older implementation to migrate away from.
- **Raw data is user-toggleable.** `showRawData` + `#lux-show-raw-link` give a learner (or dev) a way to peek at the raw Azure JSON — keep it available.

## See Also

- [features/interactions/](../interactions/) — the hover/chip/audio/modal behaviors attached here
- [core/scoring/index.js](../../core/scoring/index.js) — the threshold constants referenced everywhere
- [prosody/](../../prosody/) — where the ribbon is rendered from
