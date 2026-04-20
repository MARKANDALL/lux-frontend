# R08 — `lux-backend-weekly-architecture`

<!-- Path: docs/routines/registry/R08-backend-architecture-audit.md — Live registry entry for the backend architecture audit (⚠️ "biweekly" is misleading — see Notes). Index at docs/routines/registry/INDEX.md. -->

- **Rename →** Backend Architecture Audit
- 🟢 Active · `luxury-language-api` · code-quality · rotating-weekly
- `0 5 1-7,15-21 * 0` · 5:00 AM UTC (= 1:00 AM EDT / 12:00 AM EST) · Opus 4.7 (1M) · cron
  - *⚠️ Prompt says "Runs every other Sunday." Cron OR-logic means it actually fires on days 1–7, days 15–21, OR every Sunday — roughly 14–18 runs/month, not 2. See Notes for calibration options.*
- **Output:** `kodama-reports/backend-weekly/YYYY-WW.md` (ISO week) + draft PR "Backend architecture audit — YYYY week WW" + comment on issue "Backend Weekly Architecture Tracker" (creates if missing)
- **Active:** — → — · **Edited:** — · **Last run:** 2026-04-19 01:04 (scheduled) — also 2026-04-18 21:39 (manual), 2026-04-16 17:03 (manual)
- **Depends on:** —

## Prompt

```
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

⚠️ **Cron does not match prompt intent — top calibration candidate.** Cron `0 5 1-7,15-21 * 0` combined with cron's OR-logic-when-both-DOM-and-DOW-are-restricted fires on **any of**: day-of-month in 1–7, day-of-month in 15–21, OR weekday is Sunday. Effective frequency: ~14–18 runs/month, not 2.

**Confirmed empirically:** today (Sun 2026-04-19, day 19) ran as scheduled AND tomorrow (Mon 2026-04-20, day 20, not a Sunday) is also scheduled per the dashboard — only OR-logic produces that pattern.

### Fix options

- **(a) If intent is truly "every other Sunday"** — change cron to `0 5 1-7,15-21 * *` and add a top-of-prompt gate: "If today is not Sunday, write a short skip stub and exit." Restores 2 runs/month.
- **(b) If intent is "more frequent than weekly"** — drop "biweekly" from the prompt intro, rename routine, and keep the cron. In this case the stated "Runs every other Sunday" sentence in the prompt is actively misleading and should go.

### Design

Checks: oversized route files (>400 lines, with a stability exception for files unchanged in 60 days), lib helper usage (0-use = dead-code candidate, 1-use = may belong in that route, top-3 most-imported = canaries), router health (dead imports, broken ROUTES entries, missing lazyRoute targets).

Canary files enumerated explicitly so they're informational, not flagged.

Findings cap: 15.

**"Run sequentially — no parallel sub-agents"** is called out in the prompt (rare rule; keep on future deep-audit prompts). This is the second place in the fleet that makes the anti-pattern explicit — R03's frontend architecture audit documents the same rule as a post-mortem fix after the Apr 15 timeout. Together they make the case for promoting "sequential by default" to `CLAUDE_ROUTINES_PLAYBOOK.md` as a standing rule, not a per-routine reminder.
