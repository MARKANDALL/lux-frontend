# features/interactions

Cross-cutting interactive behaviors that hang off the Results surface: phoneme hover cards, phoneme chips, YouGlish word hover, the prosody legend toggle, the score-error collapse toggle, and the metric modal. Each module is individually importable, but `boot.js` wires the standard bundle used by Practice Skills and AI Conversation.

## Key Files

- `index.js` — Barrel re-export + auto-boot. Also re-attaches legacy globals (`globalThis.setupYGHover`, `globalThis.setupPhonemeHover`, …) so pre-module inline scripts still work.
- `boot.js` — `bootInteractions()`. Idempotent; lazy-imports `ph-hover`, `ph-chips`, `yg-hover`, `ph-audio` with fallback paths and calls the first matching init export.
- `ph-hover.js` / `ph-hover/` — Phoneme hover overlay (card that appears on phoneme-chip hover with IPA, tips, video).
- `ph-chips.js` — Phoneme chip hydration + click/tooltip wiring in Results rows.
- `yg-hover.js` — Word-header YouGlish explainer hover.
- `ph-audio.js` — Phoneme header click/hover audio/video explainer.
- `metric-modal.js` / `metric-modal/` — Per-metric (accuracy/fluency/prosody/completeness) detailed modal.
- `legend-toggle.js`, `score-collapse.js`, `tips.js`, `helpers.js`, `utils.js` — Misc. UI toggles, tooltip animations, and shared utilities (`safePlay`, `playWithGesture`).

## Conventions

- **Idempotent boot.** `bootInteractions()` sets `interactionsBooted = true` — safe to call from multiple entries (Practice, Convo).
- **Legacy globals are for pre-module shims only.** New code should `import` named exports directly; `globalThis.*` re-attachment is a back-compat layer.
- **Lazy imports inside `boot.js`.** Each helper is loaded via dynamic `import(…)` with a fallback path so CodeSandbox quirks don't break the Results page.

## See Also

- [features/results/](../results/) — the primary host of these interactions
- [features/recorder/index.js](../recorder/index.js) — calls `initMetricScoreModals`
