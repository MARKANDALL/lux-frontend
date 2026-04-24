# scripts

Build-time and hygiene scripts run from `package.json`. None of these ship to the browser; they generate static data, scan the repo for issues, or assemble assets.

## Key Files

- `build-harvard-phonemes.mjs` — runs the 72 Harvard sentence lists through the CMU Pronouncing Dictionary to produce phoneme-level metadata (`src/data/harvard-phoneme-meta.js`). Enables phoneme-driven Harvard list filtering.
- `build-passage-phonemes.mjs` — same idea for the curated passages, writing `src/data/passage-phoneme-meta.js`.
- `make-thumbs.mjs` — uses `sharp` to generate WebP thumbnails of the conversation scenario images in `public/convo-img/`.
- `hygiene-report.mjs` — read-only repo scanner for big files, risky sinks (`innerHTML`, `eval`), and `TODO` markers. `--all` includes archive folders and lockfiles.
- `no-silent-catches.mjs` — fails CI if `catch {}` or `catch (_) {}` blocks are introduced (every catch must log via `globalThis.warnSwallow`).
- `check-absolute-imports.mjs` — fails CI if any source file imports from `/src/` or `/api/` (root-absolute imports break the Vite build).

## Conventions

- All scripts are ES modules (`.mjs`) and run with plain `node`.
- Pure read-only scripts (hygiene, check-absolute-imports, no-silent-catches) exit non-zero on failure so they can gate CI.
- Generated files under `src/data/*-phoneme-meta.js` are committed; rerun the build script after any change to source word lists.

## See Also

- [`package.json`](../package.json) for the npm-script entry points (`build:harvard:phonemes`, `build:passages:phonemes`, `thumbs`, `hygiene`)
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
