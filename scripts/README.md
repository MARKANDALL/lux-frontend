# scripts

Node scripts that run at build time or as one-off maintenance tasks. These are not shipped to the browser; they are invoked via `node scripts/<file>` or npm scripts. The `.mjs` extension is deliberate (ES modules outside Vite's bundle).

## Key Files

- `build-harvard-phonemes.mjs` — Runs the 72 Harvard Sentence lists through the CMU Pronouncing Dictionary to emit phoneme-level metadata. Output feeds `src/data/harvard-phoneme-meta.js` and enables phoneme-driven passage targeting.
- `build-passage-phonemes.mjs` — Same idea for the non-Harvard curated passages. Produces `src/data/passage-phoneme-meta.js`.
- `check-absolute-imports.mjs` — Fails CI if any JS/TS under `src/`, `ui/`, `features/`, `app-core/`, `core/`, `helpers/`, or `api/` imports from a root-absolute path (`/src/…`). Forces relative imports.
- `no-silent-catches.mjs` — Guardrail scanner that fails CI on empty `catch {}` or `catch (_) {}` blocks. Uses `rg` and excludes `node_modules`, `dist`, `.min.js`.
- `hygiene-report.mjs` — Read-only repo scanner (big files, risky sinks, TODO density). Supports `--active` (default), `--all`, `--no-vendor`, `--no-html`.
- `make-thumbs.mjs` — Uses `sharp` to generate `public/convo-img/thumbs/` (max width 280, WebP quality 60) from the scenario artwork.
- `lux-release.ps1`, `lux-snapshot.ps1` — Windows PowerShell release/snapshot helpers.

## Conventions

- **`.mjs` for ES modules** so these run directly under Node without Vite.
- **Read-only reporting scripts** (`hygiene-report`, `check-absolute-imports`, `no-silent-catches`) must never mutate the repo — they print findings and exit non-zero on failure.
- **Build-step scripts** (`build-*-phonemes.mjs`) write into `src/data/` and are the canonical producers of phoneme metadata — edit the script, then re-run, rather than hand-editing the output.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — Harvard + CMU pipeline
- [package.json](../package.json) — npm script bindings
