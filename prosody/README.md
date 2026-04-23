# prosody

Implementations behind the Lux prosody system — per-word timing, tempo classification, pause/gap detection, and the two-bar ribbon rendered next to each word in results. Consumers should import via `core/prosody/index.js` (the canonical gateway), not from this folder directly.

## Key Files

- `core-calc.js` — Timestamp parsing and stats. `computeTimings(words)` normalizes Azure's 100ns `Offset`/`Duration` ticks (and several fallback shapes) into `{ start, end, durationSec }`. Also exports `median`, `ticksToSec`, and `getSpeakingRate` (slow / ok / fast at 2.0 / 4.0 wps).
- `annotate.js` — Per-word classifiers. `classifyTempo(dur, medianDur)` → slow/ok/fast using ×1.45 and ×0.6 multipliers. `classifyGap(prevEnd, currStart)` → ok / missing (≥0.35s) / unexpected (>0.6s). `devAuditProsody` dumps a `console.table` for debugging unit mismatches.
- `prosody-render-bars.js` — `renderProsodyRibbon(index, words, timings, medianDur)` — the HTML string for the two-bar gap + tempo ribbon, with scaled widths, tooltips, and a11y labels.
- `prosody-help-bars.js` — Explainer tooltip wiring for the legend next to the prosody bars.

## Conventions

- **Azure word timings are always 100ns ticks.** `computeTimings` converts with `v / 1e7`. Never assume milliseconds — a mis-classification produces the "2902s / 0 wpm" bug.
- **Thresholds live in `annotate.js`.** Don't re-implement tempo/gap cutoffs elsewhere.
- **Import from the gateway.** Downstream code should import from `core/prosody/index.js` so this folder can be reorganized without breaking consumers.

## See Also

- [core/prosody/index.js](../core/prosody/index.js) — canonical gateway (thin re-export barrel)
- [features/results/](../features/results/) — the primary consumer of the ribbon
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
