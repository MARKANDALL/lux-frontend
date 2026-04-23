# prosody

The prosody rendering engine. Takes Azure's per-word timestamps and produces two pieces of output: a per-word classification (`tempo` ∈ {slow, fast, ok} and `gap` ∈ {missing, unexpected, ok}) and an HTML "ribbon" of tempo + gap bars that appears in the results view. This is the dimension of speech most tools ignore — the musical one.

## Key Files

- `core-calc.js` — timestamp parsing (`toSec`, `ticksToSec` — handles seconds, ms, ISO-8601 durations, hh:mm:ss), plus `computeTimings()` and `median()` used to derive the per-passage median word duration.
- `annotate.js` — `classifyTempo(durationSec, medianDur)` (thresholds: ≥1.45× median → slow, ≤0.6× → fast) and `classifyGap(prevEnd, currStart)` (>0.6 s → unexpected pause, <0 / missing → missing pause).
- `prosody-render-bars.js` — `renderProsodyRibbon(index, words, timings, medianDur)`. Emits the two-bar HTML (tempo bar width scaled to median, gap bar beside it) used per-word in the results grid.
- `prosody-help-bars.js` — help-text variant of the ribbon used in tooltips and legends.

## Conventions

- **Classify before render.** `annotate.js` is pure; `prosody-render-bars.js` depends on it. Renderers must not re-implement the thresholds.
- **Median, not mean.** Tempo is always compared against median word duration for the passage — means are distorted by long outlier words.
- **Consumers import via `core/prosody/index.js`.** That barrel re-exports the three public functions (`computeTimings`, `classifyTempo`, `classifyGap`, `renderProsodyRibbon`); feature code should not reach into this folder directly.

## See Also

- [core/prosody/index.js](../core/prosody/index.js) — the canonical import point
- [features/results/](../features/results) — the main consumer of the ribbon renderer
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — why prosody is treated as a first-class scoring dimension
