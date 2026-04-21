# features/results

The results view. Takes the raw Azure assessment response and renders: the summary card, per-word score rows with phoneme chips, prosody ribbons, syllable breakdowns, trouble-sound/word chips, and the AI-feedback section. This is where the scoring, prosody, and coaching layers visually come together.

## Key Files

- `index.js` — canonical `showPrettyResults` / `showDetailedAnalysisSingle` / `showSummary` exports. Boots phoneme hover and the summary tracking shell on first use.
- `summary.js` — canonical summary builder (v1.5.0 ATLAS). LOCKED to the Blue/Yellow/Red 80/60 schema; mounts the Voice Mirror button for authed users.
- `summary-shell.js`, `summary-feedback.js` — tracked summary shell and the detailed per-phoneme feedback text.
- `render-modern.js` — thin adapter that calls into `render-core.js` with prepared inputs.
- `render-core.js`, `render-helpers.js` — the real renderer (rows, phoneme chips, prosody ribbons).
- `rows.js`, `rows-logic.js` — per-word row assembly.
- `header.js`, `header-modern.js` — the results header (score ring + CEFR + action buttons).
- `syllables.js` + `syllables/` — syllable stress rendering and CMU stress lookup.
- `deps.js` — localized dependency imports consolidated for easier refactoring.

## Conventions

- **Scoring schema is locked.** Don't fork thresholds here — always import `scoreClass` / `fmtPctCefr` / `cefrBand` from `core/scoring/index.js`.
- **Escape everything.** User text flows through `helpers/escape-html.js` before being placed into result HTML.
- **`index.js.bak` is a backup** left during a migration and will be removed — don't import from it.

## See Also

- [core/scoring/](../../core/scoring) — the canonical scoring gateway
- [prosody/](../../prosody) — the ribbon renderer this folder calls
- [features/voice-mirror/](../voice-mirror) — the "hear it in my voice" button mounted from `summary.js`
