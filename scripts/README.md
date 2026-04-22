# scripts

Build-time and developer-tooling scripts. Run with `node scripts/<name>.mjs` from the repo root. These never ship to the browser.

## Key Files

- `build-harvard-phonemes.mjs` — Reads `src/data/harvard.js`, looks every word up in the CMU pronouncing dictionary, and emits phoneme metadata consumed by the Harvard picker and next-practice targeting.
- `build-passage-phonemes.mjs` — Same idea for non-Harvard passages; produces `src/data/passage-phoneme-meta.js`.
- `check-absolute-imports.mjs` — Fails CI if any JS/TS file imports from `/src/` or `/api/` (absolute-from-root imports are banned).
- `no-silent-catches.mjs` — Fails CI if the repo contains empty catch blocks (`catch {}` / `catch (_) {}`). Mechanical guardrail against regressions of the no-silent-catches rule.
- `hygiene-report.mjs` — Read-only repo scanner: big files, risky sinks, TODO density. Flags `--active` (default), `--all`, `--no-vendor`, `--no-html`.
- `make-thumbs.mjs` — Uses `sharp` to generate 280px webp thumbnails from `public/convo-img/` for the conversation scenario picker.
- `lux-release.ps1`, `lux-snapshot.ps1` — Windows PowerShell helpers for release/snapshot workflows.

## Conventions

- `.mjs` for Node scripts so they are always ESM regardless of `package.json` type.
- Scripts are read-only or produce generated files under `src/data/` or `public/`; never modify hand-written source.
- Guardrail scripts (`check-absolute-imports`, `no-silent-catches`) exit non-zero on violations so CI can enforce them.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- `package.json` for script wiring
