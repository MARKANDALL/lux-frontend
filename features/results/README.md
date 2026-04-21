# features/results

The post-attempt results screen. Renders the score rings, metric tiles, per-word rows (with phoneme chips, prosody ribbon, click-to-play audio), summary, AI Coach drawer, and Voice Mirror button.

Split between modern and legacy rendering paths — `render-modern.js` is the active surface; `render-core.js` contains shared primitives.

## Key Files

- `index.js` — `showPrettyResults`, `showSummary`. The public entry. Wires phoneme hover + chip hydration once, then delegates to the modern renderer.
- `render-modern.js` — the current results renderer.
- `render-core.js` / `render-helpers.js` — shared row + chip rendering primitives.
- `rows.js` / `rows-logic.js` — per-word row construction: tempo/gap classification, phoneme chip assembly.
- `header-modern.js` / `header.js` — score ring + metric tile header.
- `summary.js` / `summary-shell.js` / `summary-feedback.js` — the post-session summary screen with tracking + AI-derived feedback.
- `syllables.js` / `syllables/` — per-syllable stress + phoneme detail.

## Conventions

- Locked to the Universal Blue/Yellow/Red scoring schema (80/60) via [core/scoring/index.js](../../core/scoring/index.js). Do not add new color tiers here.
- Prosody rendering goes through [core/prosody/index.js](../../core/prosody/index.js) — no direct import from the `prosody/` folder.
- Phoneme chips are interactive after `initPhonemeChipBehavior` runs — row HTML is static until then.
- `index.js.bak` is a legacy backup — do not re-enable without audit.

## See Also

- [core/scoring/index.js](../../core/scoring/index.js) — the scoring constitution
- [core/prosody/index.js](../../core/prosody/index.js) — prosody gateway
- [features/interactions/](../interactions/) — provides phoneme hover + chip behavior
