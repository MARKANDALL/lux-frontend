# R07 — `lux-backend-nightly-health`

<!-- Path: docs/routines/registry/R07-backend-health-scan.md — Live registry entry for the weekly backend health scan. Index at docs/routines/registry/INDEX.md. -->

- **Rename →** Backend Health Scan
- 🟢 Active · `luxury-language-api` · code-quality · rotating-weekly
- Sundays 4:15 AM EDT (`15 4 * * 0`) · Opus 4.7 (1M) · cron *(name says "nightly" — run history shows a recent flip from daily to weekly; see Notes)*
- **Output:** `kodama-reports/backend-nightly/YYYY-MM-DD.md` ⚠️ vestigial path + draft PR "Backend health scan — YYYY-MM-DD" + comment on issue "Backend Nightly Health Tracker" (creates if missing)
- **Active:** — → — · **Edited:** — · **Last run:** 2026-04-19 04:23 (scheduled — Sunday) · run history also shows 2026-04-18 04:21 and 2026-04-17 04:20, both SCHEDULED — these pre-flip daily fires confirm the cadence was changed from daily → weekly very recently; also 2026-04-16 17:02 (manual)
- **Depends on:** —

## Prompt

```
You are auditing the Lux Pronunciation Tool BACKEND (luxury-language-api) for code health regressions introduced in the last 7 days of commits. This routine runs weekly on Sundays. Be surgical, factual, and concise — Mark wants signal, not noise.

ACTIVITY GATE (run FIRST):
Run `git log --since="7 days ago" --name-only --pretty=format:"" | sort -u | grep -E '\.(js|mjs)$' | grep -v '_ARCHIVE\|\.GOLD'`

If the output is empty, write:
# Backend Health Scan — YYYY-MM-DD
## Summary
✅ No substantive backend code changes in the last 7 days. No scan performed.

Open the draft PR as usual so the skip is visible. Exit here.

SCOPE: Scan all .js and .mjs files under the repo root. Skip node_modules/, .vercel/, _ARCHIVE/, and any folder starting with an underscore.

CANARY FILES — never flag or suggest changes to these (they are the spine of the backend):
- api/router.js
- lib/pool.js
- lib/supabase.js
- lib/voice.js
- vercel.json
- package.json
- routes/evaluate.js
Observations about canaries go in the "Notes" section at the end, not as findings.

LEGACY CODE FILTER:
Before flagging any file, check `git log -1 --format=%cr <file>`. If the file has NOT been modified in the last 60 days AND the issue would otherwise be flagged, append it to a "## Legacy Backlog" section instead of main findings. (Backend moves slower than frontend; 60 days is the right window here, not 30.)

CHECKS:

1. POSTGRES POOL DRIFT — Every route that queries Postgres should import the shared pool from lib/pool.js. Find any route file that creates its own `new Pool(...)` or writes to `globalThis.__lux_pool` directly instead of using `import { pool } from "../lib/pool.js"`.

2. SILENT CATCHES — Find catch blocks that TRULY swallow errors. A true silent catch has a body that is ONLY one of: empty `{}`, `return null;`, `return;`, or `/* ignore */`.

DO NOT FLAG these catch patterns (all legitimate):
- `.catch((err) => console.warn(...))` — logged failures ✓
- `catch (e) { return res.status(500).json(...) }` — deliberate error response ✓
- `catch (e) { logger.error(...); throw e; }` — logged rethrow ✓
- Any fire-and-forget `.catch(() => {})` that is preceded by a comment indicating intentional silence AND the operation is non-critical (e.g., analytics, timestamp updates)

A catch is silent if AND ONLY IF: no console.* call, no logger call, no throw, no error-response, and no documented-intentional fire-and-forget comment.

3. MISSING AUTH GATE ON PAID ROUTES — Find any route under routes/ that calls OpenAI, Azure Speech, ElevenLabs, or any external paid API WITHOUT an auth check at the top of the handler. The canonical admin-token pattern is:
   const token = (req.headers["x-admin-token"] || "").toString().trim() || (req.query?.token || "").toString().trim();
   const expected = (process.env.ADMIN_TOKEN || "").toString().trim();
   if (!expected || token !== expected) return res.status(401).json({ error: "unauthorized" });

IMPORTANT: If a route is gated at the router level (api/router.js's ADMIN_ONLY list) but has no per-handler check, this is architectural defense-in-depth debt, not a live security hole. Report it as INFO, not HIGH. Only flag as HIGH if the route has NO gate at either the router level or handler level.

4. CORS DRIFT — Find any route handler that does not either (a) handle OPTIONS preflight with a 204 response, or (b) set Access-Control-Allow-Origin headers.

EXCLUSION: CORS is now centrally managed by api/router.js (canonical post-2026-03 pattern). Individual route files relying on router-level CORS are CORRECT, not drift. Only flag a route if it explicitly overrides or wildcards CORS.

5. ENV VAR DRIFT — List any `process.env.VARIABLE_NAME` reference in code that has no corresponding entry in .env.example at repo root. Also list entries in .env.example that are referenced nowhere in code. (.env.example now exists as of 2026-04-18.)

FINDINGS CAP: Maximum 10 findings in main section. Overflow goes to "## Additional Findings" by file:line only.

OUTPUT:
- Create kodama-reports/backend-nightly/YYYY-MM-DD.md
- Open draft PR titled "Backend health scan — YYYY-MM-DD"
- Comment summary on GitHub issue titled "Backend Nightly Health Tracker" (create if missing)

REPORT STRUCTURE:

# Backend Health Scan — YYYY-MM-DD

## Summary
[X] pool drift | [X] silent catches | [X] missing auth gate | [X] CORS drift | [X] env var drift

## Top Priority
[ONE sentence: "If you spend 15 minutes this week, look at X because Y." OR "None — all findings are advisory."]

## Findings
### 1. Postgres pool drift
[For each finding: `file/path.js:LINE` — one-sentence description]
[If none: "✅ Clean"]

[Repeat for each category]

## Legacy Backlog
[Issues in files not modified in 60+ days, listed by file:line only]
[If none: "✅ None"]

## Notes
[Observations about canaries, broader patterns, week-over-week trends]

RULES:
- Do not fix anything. Report only.
- Be exact about line numbers.
- When uncertain, prefer NOT flagging. False positives damage signal.
- If all checks pass, still create the report — say "✅ All checks passed" prominently.
```

## Notes

**Name is stale — routine is no longer nightly.** Run history is the proof: three consecutive SCHEDULED fires on Apr 17 04:20, Apr 18 04:21, Apr 19 04:23 (daily pattern with typical cron jitter around 4:15-4:23) followed by "Next run: Apr 26 at 4:15 AM" (weekly pattern). The cadence was flipped daily → weekly between Apr 19 and now. The prompt body also says "This routine runs weekly on Sundays" — so prompt and current cron agree; only the dashboard name is stale.

Schedule Calibration pass options:
- (a) rename to `lux-backend-weekly-health` and keep weekly
- (b) flip back to daily (there's daily-runs headroom) and keep the "nightly" name

**Sophisticated prompt with four guard rails worth preserving:**

1. **Activity gate** — no JS/MJS changes in 7 days ⇒ short stub and exit
2. **Canary files** — `api/router.js`, `lib/pool.js`, `lib/supabase.js`, `lib/voice.js`, `vercel.json`, `package.json`, `routes/evaluate.js` are never flagged; observations go in Notes
3. **60-day legacy filter** — older files route to `## Legacy Backlog` instead of main findings (explicitly 60 days for backend vs 30 for frontend because backend moves slower)
4. **Router-level auth exclusion** — routes gated by `api/router.js`'s ADMIN_ONLY list report as INFO, not HIGH, since defense-in-depth ≠ live vulnerability

Five checks: pool drift, silent catches (with explicit "don't flag these patterns" list), missing auth gate on paid routes, CORS drift (centralized via `api/router.js` as of 2026-03), env var drift against `.env.example` (which exists as of 2026-04-18).

Findings cap of 10 in main section with overflow to `## Additional Findings`.

`kodama-reports/backend-nightly/` output path is vestigial.
