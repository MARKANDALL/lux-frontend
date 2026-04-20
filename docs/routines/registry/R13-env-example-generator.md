# R13 · Env Example Generator

<!-- Path: docs/routines/registry/R13-env-example-generator.md — Live registry entry for the env example generator (paused, one-shot purpose fulfilled). Index at docs/routines/registry/INDEX.md. -->

- **Dashboard name:** R13 · Env Example Generator *(renamed 2026-04-20; was `lux-generate-env-example`)*
- 🟡 Paused · `lux-frontend` · infra · one-shot (purpose fulfilled — keep parked for reference)
- Sundays 3:00 AM EDT (`0 3 * * 0`) · Opus 4.7 (1M) · cron
- **Output:** `.env.example` at repo root + draft PR "chore: add .env.example with all 13+ referenced env vars"
- **Active:** — → — · **Edited:** — · **Last run:** 2026-04-16 17:08 (manual) — also 2026-04-15 23:14 (manual)
- **Depends on:** —

## Prompt

```
Generate a .env.example file for the Lux Pronunciation Tool by scanning the entire codebase for environment variable references.

SCAN FOR:
- process.env.ANYTHING in all .js files
- import.meta.env.ANYTHING in all .js and .html files
- Any references in vite.config.js to env vars

FOR EACH VARIABLE FOUND:
- Note which file(s) reference it
- Determine if it's a secret (API key, token) or a config value (URL, flag)
- Write a placeholder value: use "your-xxx-here" for secrets, use the actual default if one exists in the code

OUTPUT:
- Create .env.example at the repo root
- Include comments grouping vars by service (Supabase, Azure, Vercel, OpenAI, etc.)
- Include a header comment explaining the file's purpose
- Open a draft PR titled "chore: add .env.example with all 13+ referenced env vars"

RULES:
- Never include actual secret values, even if they appear in committed code
- If a var appears in .env or .env.local on disk, note it exists but do NOT copy the value
- Sort variables by service/category, not alphabetically
```

## Notes

Purpose fulfilled — `.env.example` was shipped (referenced as existing-as-of-2026-04-18 in R07's env-drift check, so one of the two manual runs produced the file that now lives in the repo). Status reclassified one-shot (was reactivation-candidate).

Pivot-to-drift-check path is already covered elsewhere: **R07 Check #5** does `process.env.*` vs `.env.example` drift both directions for the backend; **R09 does the same** for whichever repo it targets. Reactivating R13 as a recurring drift check would just duplicate those.

Cleaner option: **retire outright** and let the hygiene routines own drift. Per the retire rule, staying parked for now — but on the "genuine retire candidate" short list alongside R15.

One line worth lifting verbatim to any future config-generator routine: **"Sort variables by service/category, not alphabetically"** — service-grouping reads much better than alphabetical on real env files.

"13+" in the PR title is hardcoded and already dated — wrap into a `{count}` template if this prompt is ever reused as a scaffold.

Model is Opus 4.7 (1M) — whole-repo scan for `process.env.*` and `import.meta.env.*` benefits from the bigger window.
