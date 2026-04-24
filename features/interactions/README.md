# features/interactions

Cross-cutting micro-interactions for the results view: hover tooltips for Youglish-linked words, phoneme hover with mouth-front video and audio, phoneme chip click behavior, score-error collapse animation, prosody legend toggle, metric-tile tip animation, and the metric-score modal.

This folder used to live under `ui/interactions/` (some comments still reference that path). It's effectively a feature-level toolbox — features import individual pieces; `boot.js` provides a single safe entry that auto-loads everything.

## Key Files

- `index.js` — barrel export + re-attaches a small set of legacy globals (`setupYGHover`, `initPhonemeAudio`, `initScoreErrorCollapse`, `initProsodyLegendToggle`, `animateMetricTips`).
- `boot.js` — `bootInteractions`, idempotent. Dynamic-imports each piece with fallbacks so CodeSandbox path quirks don't break everything.
- `ph-hover.js` / `ph-hover/` — phoneme hover tooltip controller with carousel, video, and modal subviews.
- `metric-modal.js` / `metric-modal/` — per-metric explanation modal (Accuracy, Fluency, Completeness, Pron, Prosody).
- `yg-hover.js` — Youglish hover preview.
- `ph-audio.js`, `ph-chips.js` — phoneme audio playback and chip click behavior.
- `score-collapse.js`, `legend-toggle.js`, `tips.js` — small animation/toggle helpers.
- `helpers.js`, `utils.js` — `showClickHint`, `safePlay`, `playWithGesture`, `prepareVideo`.

## Conventions

- Each piece must be idempotent — `boot.js` may be called more than once on hot reloads or page transitions.
- Use the dynamic-import-with-fallback pattern in `boot.js` when adding new pieces; do not assume any single path resolves on every host.
- Phoneme assets (mouth-front video, audio) come from `public/vid/ph-front/` and the API.

## See Also

- [`features/results/`](../results/) — the primary surface these interactions enrich
- [`prosody/prosody-help-bars.js`](../../prosody/prosody-help-bars.js) — separate prosody tooltip system
