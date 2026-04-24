# prosody

Per-word timing analysis: parses Azure tick offsets into seconds, computes word durations, classifies tempo (slow / fast / ok) against the passage median, and flags gaps (`unexpected` long pause / `missing` expected pause). Renders the two-bar prosody ribbon shown under each word in the results view.

This folder is the implementation; [`core/prosody/index.js`](../core/prosody/index.js) re-exports a small public surface so consumers don't reach in directly.

## Key Files

- `core-calc.js` — `toSec` / `ticksToSec` parsers (handles Azure's 100-nanosecond ticks, ms strings, HH:MM:SS), `computeTimings`, `median`.
- `annotate.js` — `classifyTempo(durationSec, medianDur)` returns `slow|fast|ok` against the per-passage median; `classifyGap(prevEnd, currStart)` returns `unexpected|missing|ok`.
- `prosody-render-bars.js` — `renderProsodyRibbon(index, words, timings, medianDur)` returns the HTML string for the two-bar ribbon.
- `prosody-help-bars.js` — body-level tooltip wiring for the ribbons (`initProsodyTooltips`, idempotent install).

## Conventions

- All thresholds are tuned and documented inline — see the constants in `annotate.js` (1.45×median = slow, 0.6×median = fast, 0.6s gap = unexpected).
- Functions are pure where possible; only `prosody-help-bars.js` touches the DOM.
- New consumers should import from [`core/prosody/index.js`](../core/prosody/index.js), not directly from these files.

## See Also

- [`features/results/rows.js`](../features/results/rows.js) — primary consumer of the prosody ribbon
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — prosody is part of "Phoneme + prosody is fluency"
