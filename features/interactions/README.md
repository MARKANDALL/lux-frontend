# features/interactions

The interaction hub. Hover behaviors (phoneme tooltips, Youglish links), audio previews, legend toggles, phoneme chip behavior, tip animations, score-error collapse, and the metric-modal surface. Also responsible for re-attaching a handful of legacy globals that older modules still reach for.

## Key Files

- `index.js` — barrel that imports every interaction primitive and re-attaches legacy globals (`setupYGHover`, `initScoreErrorCollapse`, `setupPhonemeHover`, …).
- `boot.js` — safe, idempotent boot with dynamic-import fallbacks so CodeSandbox / path quirks can't brick the page.
- `ph-hover.js` + `ph-hover/` — phoneme hover tooltips (rendered, carousel, modal, video variants).
- `ph-chips.js`, `ph-audio.js` — phoneme chip behavior and audio preview playback.
- `metric-modal.js` + `metric-modal/` — the "tap a metric card to see details" modal surface.
- `yg-hover.js` — Youglish hover links for individual words.
- `score-collapse.js`, `legend-toggle.js`, `tips.js` — results-view collapse behavior, prosody legend toggling, and animated metric tips.
- `helpers.js`, `utils.js` — small interaction helpers (`showClickHint`, `safePlay`, `playWithGesture`, `prepareVideo`).

## Conventions

- **Idempotent boot.** `bootInteractions()` sets an `interactionsBooted` flag so repeat calls are no-ops.
- **Legacy globals are kept intentionally.** Anything re-attached to `globalThis` in `index.js` exists so older non-module code still finds it. Don't remove without auditing all callers.
- **Dynamic-import fallbacks.** `loadFirst([paths], label)` tolerates multiple path shapes so CSB and local dev both load the same module.

## See Also

- [ui/](../../ui) — shared non-interaction UI primitives
- [features/results/](../results) — the main consumer of the metric modal and phoneme hover
