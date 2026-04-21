# prosody

Per-word timing, tempo classification, gap detection, and the two-bar prosody ribbon renderer. This is the "music of speech" layer — everything Azure gives us as raw tick offsets becomes classified per-word tempo (slow/fast/ok) and gap state (missing pause / unexpected pause) here.

Consumers should import from [core/prosody/index.js](../core/prosody/index.js) (the canonical gateway), not from this folder directly — but the math and rendering live here.

## Key Files

- `core-calc.js` — Timestamp parsing (ticks → seconds, ISO durations, HMS, raw numbers) and timing math. Exports `computeTimings`, `median`, `ticksToSec`.
- `annotate.js` — The classifiers. `classifyTempo(dur, median)` → `slow`/`fast`/`ok`. `classifyGap(prevEnd, currStart)` → `ok`/`missing`/`unexpected`. Plus `devAuditProsody` for debugging.
- `prosody-render-bars.js` — Renders the two-bar prosody ribbon (tempo bar + gap bar) used on the Results rows. Width-scales against median duration; classes drive the colors.
- `prosody-help-bars.js` — Renders the legend/help bars shown when the prosody-legend toggle is open.

## Conventions

- Thresholds are product commitments — `slow` at ≥1.45× median, `fast` at ≤0.6× median, `missing` at 0.35–0.6s gap, `unexpected` at >0.6s. Change them intentionally.
- Pure computation in `core-calc.js` and `annotate.js` (no DOM). Rendering is isolated in the `*-bars.js` files.
- Consumers go through [core/prosody/index.js](../core/prosody/index.js) — the barrel decides what's public.

## See Also

- [core/prosody/index.js](../core/prosody/index.js) — canonical import surface
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — prosody awareness in the product story
- [features/results/](../features/results/) — where the ribbon is rendered
