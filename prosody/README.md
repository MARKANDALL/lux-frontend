# prosody

Prosody analysis pipeline: per-word timing, tempo classification, gap detection, and the ribbon renderer that surfaces rhythm in the results UI. Pure business logic + a small renderer. Features should import the barrel in `core/prosody/index.js`, not these files directly.

## Key Files

- `core-calc.js` — timestamp parsing (Azure tick format, ISO, ms/sec strings), `computeTimings()`, `median()`, and the `ticksToSec` converter. Tolerant of multiple upstream shapes because Azure responses drift.
- `annotate.js` — per-word `classifyTempo(durationSec, medianDur)` (slow / fast / ok) and `classifyGap(prevEnd, currStart)` (missing / unexpected / ok) plus a `devAuditProsody()` inspector.
- `prosody-render-bars.js` — renders the prosody ribbon (timing bars) for a results row.
- `prosody-help-bars.js` — help/legend rendering for the prosody legend toggle.

## Conventions

- Thresholds (`1.45×` median → slow, `0.6×` → fast, `0.6s` gap → unexpected, `0.35s` → missing) are product calibration — do not tune without updating the audit doc.
- Timing inputs may arrive in Azure ticks (100ns units), seconds, or strings — always route through `ticksToSec` / `toSec` in `core-calc.js`.
- Consumers should import via `core/prosody/index.js`, not directly from this folder, so the public surface stays stable.

## See Also

- [`core/prosody/index.js`](../core/prosody/index.js) — the public barrel
- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — prosody section
- [`features/results/`](../features/results/) — where the ribbon is rendered into rows
