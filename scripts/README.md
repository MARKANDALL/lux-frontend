# scripts

Node scripts run at build time or on demand from the command line. These never ship to the browser — they generate data files, produce assets, or gate CI on repo hygiene rules.

## Key Files

- `build-harvard-phonemes.mjs` — regenerates phoneme metadata for the 72 Harvard passages by running the CMU pronouncing dictionary over each word. Output feeds `src/data/harvard-phoneme-meta.js`.
- `build-passage-phonemes.mjs` — same idea for the non-Harvard curated passages; produces `src/data/passage-phoneme-meta.js`.
- `make-thumbs.mjs` — generates WebP thumbnails for `public/convo-img/**` via `sharp` (`MAX_W=280`, `QUALITY=60`).
- `check-absolute-imports.mjs` — hygiene gate that fails CI if any JS/TS file inside `src/ui/features/app-core/core/helpers/api` imports from `/src/...` or `/api/...` (absolute-from-root imports).
- `no-silent-catches.mjs` — hygiene gate that fails CI if the repo grows new empty `catch {}` / `catch (_) {}` blocks.
- `hygiene-report.mjs` — read-only scanner for big files, risky sinks, and TODOs. Prints an actionable report; ACTIVE mode skips `_ARCHIVE` / `_OLD` / `_LEGACY` unless `--all`.
- `lux-release.ps1`, `lux-snapshot.ps1` — PowerShell helpers for local release and snapshot captures.

## Conventions

- **`.mjs` for Node.** These files are ES modules run with `node scripts/foo.mjs`. They are not bundled by Vite.
- **Read-only by default.** Hygiene scanners must never rewrite source. Generators write to predictable paths under `src/data/` or `public/`.
- Breaking any of the CI hygiene scripts (`check-absolute-imports`, `no-silent-catches`) is a red build — fix the code, don't silence the script.

## See Also

- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — hygiene rules these scripts enforce
- [src/data/](../src/data) — where generator output lands
