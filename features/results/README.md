# features/results

Post-assessment rendering: the word/phoneme breakdown, prosody ribbon, score tiles, summary screen, and the hand-off seam to AI coaching. Consumes Azure Pronunciation Assessment results via the recorder and turns them into readable, clickable UI.

## Key Files

- `index.js` — Public surface: `showPrettyResults`, `showSummary`, `showDetailedAnalysisSingle`. Boots phoneme hover/chip behaviors once.
- `render-modern.js` — Modern (current) results renderer; legacy is behind `index.js.bak` for reference only.
- `render-core.js` / `render-helpers.js` / `rows.js` / `rows-logic.js` — The word/phoneme row rendering pipeline.
- `header.js` / `header-modern.js` — Top-of-results header (overall scores, CEFR band).
- `summary.js` / `summary-shell.js` / `summary-feedback.js` — End-of-passage summary screen and AI feedback shell.
- `syllables.js` + `syllables/` — Syllable-level breakdown.

## Conventions

- All scoring tier / coaching tier decisions come from `core/scoring/`; never hard-code thresholds here.
- Prosody ribbon rendering comes from `core/prosody/` — this folder only decides placement.
- HTML is produced by string-template helpers and inserted with `innerHTML`; every user-origin string must pass through `helpers/escape-html.js` first.

## See Also

- [features/recorder/README.md](../recorder/README.md) — upstream producer
- [features/interactions/README.md](../interactions/README.md) — hover/audio/chip behaviors wired here
- [core/scoring/](../../core/scoring/), [core/prosody/](../../core/prosody/)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
