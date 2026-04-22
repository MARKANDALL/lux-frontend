# prosody

Prosody rendering and timing logic: per-word tempo classification (slow / fast / ok), inter-word gap classification (missing pause / unexpected pause), and the two-bar ribbon rendered under each word in practice results. Consumers usually import through `core/prosody/index.js`, which barrels these modules.

## Key Files

- `core-calc.js` — Timestamp parsing (ticks/ms/seconds/various suffixes) and stat helpers: `computeTimings`, `median`, `ticksToSec`.
- `annotate.js` — Per-word classifiers: `classifyTempo(duration, medianDur)` (slow ≥ median×1.45, fast ≤ median×0.6) and `classifyGap(prevEnd, currStart)`.
- `prosody-render-bars.js` — `renderProsodyRibbon(index, words, timings, medianDur)` — returns the HTML for the two-bar tempo/gap ribbon.
- `prosody-help-bars.js` — `initProsodyTooltips()` — installs a body-level tooltip that explains ribbon bars on hover (styled by `lux-popover.css`).

## Conventions

- Numeric classifiers are side-effect free and safe to import in Node.
- The `core/prosody/index.js` gateway is the intended import surface; feature code should import from there, not directly from this folder.
- Tempo thresholds are content-neutral — do not hard-code per-passage cutoffs.

## See Also

- [core/prosody/](../core/prosody/) — the barrel features import from
- `lux-results.prosody.css` at the repo root — ribbon styling
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
