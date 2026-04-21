# scripts

Build-time and dev-time scripts — static data generators, hygiene scanners, release helpers. Nothing in here runs at app runtime.

Most are invoked from `npm run *` targets defined in `package.json`.

## Key Files

- `build-harvard-phonemes.mjs` — Runs the 72 Harvard Sentence lists through the CMU Pronouncing Dictionary to generate `src/data/harvard-phoneme-meta.js`. Prerequisite for phoneme-driven drill targeting.
- `build-passage-phonemes.mjs` — Same pattern for non-Harvard passages, emits `src/data/passage-phoneme-meta.js` (lazy-loaded at runtime).
- `hygiene-report.mjs` — Read-only repo scanner. Flags big files, risky sinks, `TODO`s. Flags: `--active` (default), `--all`, `--no-vendor`, `--no-html`.
- `no-silent-catches.mjs` — Mechanical guardrail. Fails if the repo contains empty catch blocks (`catch {}` or `catch (_) {}`). Part of `npm run hygiene`.
- `check-absolute-imports.mjs` — Fails if any file imports from `/src/` or `/api/` (absolute-from-root imports — Vite-only paths that break outside the dev server).
- `make-thumbs.mjs` — Generates conversation scenario thumbnails.
- `lux-release.ps1` / `lux-snapshot.ps1` — PowerShell release/snapshot helpers (author's local workflow).

## Conventions

- Use `.mjs` for Node ESM scripts. `.ps1` files are author-local Windows scripts and not part of CI.
- Scripts are read-only or write-only. They must not import from `src/`, `features/`, etc. in a way that pulls in browser globals — keep them Node-safe.
- Anything that produces a generated data file should be deterministic and re-runnable from a clean checkout.

## See Also

- `package.json` — script entry points (`npm run build:harvard:phonemes`, `npm run hygiene`, etc.)
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — pedagogy section explains why the phoneme metadata exists
