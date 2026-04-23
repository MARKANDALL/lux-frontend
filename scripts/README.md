# scripts

Build-time and hygiene scripts run via `npm` or CI — not shipped to the browser. Most are Node ESM (`.mjs`).

## Key Files

- `build-harvard-phonemes.mjs` — runs the 72 Harvard Sentences through the CMU Pronouncing Dictionary to generate per-sentence phoneme metadata consumed by the phoneme-filtered picker.
- `build-passage-phonemes.mjs` — the equivalent build for non-Harvard curated passages (`src/data/passages.js`).
- `check-absolute-imports.mjs` — fails CI if any source file imports with a leading-slash absolute path (`/src/`, `/api/`) instead of a relative import.
- `hygiene-report.mjs` — repo hygiene scanner: big files, risky sinks, TODO density. Read-only report; supports `--active`, `--all`, `--no-vendor`, `--no-html`.
- `no-silent-catches.mjs` — guardrail that fails if the repo grows empty `catch {}` or `catch (_) {}` blocks.
- `make-thumbs.mjs` — generates WebP thumbnails for scenario images under `public/convo-img/` via `sharp`.
- `lux-release.ps1` / `lux-snapshot.ps1` — PowerShell release and snapshot helpers (Windows-only dev workflow).

## Conventions

- ESM-only (`.mjs`). No TypeScript, no bundler — scripts run directly on Node 18+.
- Exposed via `npm run` entries in `package.json` (`build:harvard:phonemes`, `build:passages:phonemes`, `thumbs`, `hygiene`, etc.).
- Scripts must be idempotent and safe to rerun; output lives under `src/data/phonemes/` or `public/convo-img/thumbs/`.

## See Also

- [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — static data generation
- [`package.json`](../package.json) — script entrypoints
