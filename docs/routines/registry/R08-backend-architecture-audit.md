# R08 · Backend Architecture Audit

<!-- Path: docs/routines/registry/R08-backend-architecture-audit.md — Live registry entry for the backend architecture audit. Index at docs/routines/registry/INDEX.md. -->

- **Dashboard name:** R08 · Backend Architecture Audit *(renamed 2026-04-20; was `lux-backend-weekly-architecture`)*
- 🟢 Active · `luxury-language-api` · code-quality · rotating-weekly
- `0 5 1-7,15-21 * *` · 5:00 AM UTC (= 1:00 AM EDT / 12:00 AM EST) · Opus 4.7 (1M) · cron
  - *Cron fires 14×/month (days 1–7, 15–21); in-prompt Sunday-only gate collapses non-Sunday fires to a skip stub so effective cadence is 2 runs/month. See Notes.*
- **Output:** `kodama-reports/backend-weekly/YYYY-WW.md` (ISO week) + draft PR "Backend architecture audit — YYYY week WW" + comment on issue "Backend Weekly Architecture Tracker" (creates if missing)
- **Active:** — → — · **Edited:** — · **Last run:** 2026-04-19 01:04 (scheduled) — also 2026-04-18 21:39 (manual), 2026-04-16 17:03 (manual)
- **Depends on:** —

## Prompt

```
SUNDAY-ONLY GATE (run FIRST — BEFORE the activity gate):
Run `date -u +%u`
If the output is NOT "7" (i.e., today is not Sunday UTC), write:
# Backend Architecture Audit — YYYY-MM-DD
## Summary
⏭️ Scheduled but not Sunday — biweekly routine only runs on Sundays. Skipping.
Open the draft PR so the skip is visible. Exit here.

You are performing a biweekly architecture audit on the Lux Pronunciation Tool BACKEND (luxury-language-api). Runs every other Sunday.

ACTIVITY GATE (run FIRST):
Run `git log --since="14 days ago" --name-only --pretty=format:"" | sort -u | grep -E '\.(js|mjs)$' | grep -v '_ARCHIVE\|\.GOLD'`

If the output shows changes ONLY to .md files or test files, write:
# Backend Architecture Audit — YYYY Week WW
## Summary
✅ No substantive architecture changes in the last 14 days. No audit performed.

Open the draft PR as usual. Exit here.

SCOPE: Scan routes/, lib/, api/. Skip node_modules/, .vercel/, underscore-prefixed folders.

CANARY FILES (inform, don't flag):
- api/router.js
- lib/pool.js
- lib/supabase.js
- lib/voice.js
- vercel.json
- package.json
- routes/evaluate.js

RUN SEQUENTIALLY — do one check at a time, fully, before moving to the next. No parallel sub-agents.

CHECKS:

1. OVERSIZED ROUTE FILES — List any file under routes/ longer than 400 lines. For each: line count, one-line description, and whether it could reasonably be split (multiple unrelated responsibilities = yes; one heavy handler = no).
STABILITY EXCEPTION: If a file has been >400 lines for multiple consecutive audits AND hasn't changed in the last 60 days, downgrade to informational. Repeatedly re-flagging stable-but-long files is noise.

2. LIB HELPER USAGE — For each file in lib/, count how many route files import from it. Flag:
   - lib helpers imported by 0 routes (dead code candidate)
   - lib helpers imported by exactly 1 route (may belong IN that route)
   Also list the top 3 most-imported lib helpers — these are the true canaries and should be treated with extra care.

3. ROUTER HEALTH — Read api/router.js. Count routes registered in the ROUTES const. List:
   - Routes imported at top of file but not present in ROUTES (dead import)
   - Entries in ROUTES that reference an undefined symbol (broken registration)
   - Any lazy-loaded route whose lazyRoute() target file does not exist

DO NOT CHECK:
- Code style or formatting
- Comment density
- Test coverage (separate concern)
- Dependency version staleness (monthly hygiene handles this)

FINDINGS CAP: Maximum 15 findings (architecture covers broader territory than nightly scans).

OUTPUT:
- Create kodama-reports/backend-weekly/YYYY-WW.md (WW = ISO week number)
- Draft PR titled "Backend architecture audit — YYYY week WW"
- Comment summary on GitHub issue titled "Backend Weekly Architecture Tracker" (create if missing)

REPORT STRUCTURE:
# Backend Architecture Audit — YYYY Week WW
## Summary
- Oversized route files: [X]
- Dead/single-use lib helpers: [X]
- Router registration issues: [X]
## Top Priority
[ONE sentence: the architecture concern most worth addressing, or "None — architecture is stable."]
## Findings
[Per check]
## Notes
[Canary observations, stable patterns, trends since last audit]

RULES:
- Run sequentially. No parallel sub-agents.
- Keep report under 1500 words.
- Report only. No fixes.
- Stable long-standing patterns = informational, not findings.
```

## Notes

✅ **Cron fixed 2026-04-20 via Option A (truly biweekly Sunday).** Changed cron from `0 5 1-7,15-21 * 0` to `0 5 1-7,15-21 * *` (dropped the DOW restriction that was triggering cron's OR-gotcha). Added a `SUNDAY-ONLY GATE` at the top of the prompt that uses `date -u +%u` to skip with a stub if today is not Sunday UTC. Effective cadence: 2 runs/month on the 1st-or-2nd Sunday and 3rd-or-4th Sunday. Non-Sunday fires produce trivially cheap skip stubs (~1-2 tool calls).

**Historical context (preserved for future cron archaeology):** original cron was `0 5 1-7,15-21 * 0`. Cron's OR-logic-when-both-DOM-and-DOW-are-restricted meant it fired on **any of**: day-of-month in 1–7, day-of-month in 15–21, OR weekday is Sunday — roughly 14–18 runs/month instead of 2. Confirmed empirically when Apr 20 (Monday, day 20) was showing as scheduled. The `* *` fix is the canonical workaround for this gotcha: restrict by one axis only, gate the other axis in code.

### Design

Checks: oversized route files (>400 lines, with a stability exception for files unchanged in 60 days), lib helper usage (0-use = dead-code candidate, 1-use = may belong in that route, top-3 most-imported = canaries), router health (dead imports, broken ROUTES entries, missing lazyRoute targets).

Canary files enumerated explicitly so they're informational, not flagged.

Findings cap: 15.

**"Run sequentially — no parallel sub-agents"** is called out in the prompt (rare rule; keep on future deep-audit prompts). This is the second place in the fleet that makes the anti-pattern explicit — R03's frontend architecture audit documents the same rule as a post-mortem fix after the Apr 15 timeout. Together they make the case for promoting "sequential by default" to `CLAUDE_ROUTINES_PLAYBOOK.md` as a standing rule, not a per-routine reminder.