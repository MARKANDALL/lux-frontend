Routines Registry — INDEX
<!-- Path: docs/routines/registry/INDEX.md — Bird's-eye view of the live fleet. Full per-routine details live in sibling `R??-*.md` files. -->

Part of a 4-file system:

CLAUDE_ROUTINES_BACKLOG.md — idea pool (universal patterns)
CLAUDE_ROUTINES_PLAYBOOK.md — strategy, architectural patterns, traps
LUX_ROUTINES_FROM_CATALOG.md — Lux-catalog-derived ideas
This folder (registry/) — the truth layer: what's actually configured right now

Sync rule: Dashboard edits and registry-file edits happen in the same sitting, or they didn't happen.
Retire rule: Paused routines stay parked indefinitely. Retirement is an explicit, rare decision — not automatic, not triggered by idle time. Paused is cheap; reference value is high.
File-per-routine rule: Each active, paused, or retired routine gets its own R??-<name>.md file. This INDEX stays lean forever.
Status: 🟢 active · 🟡 paused · 🔴 retired
Category: code-quality · security · perf · docs · testing · infra · business · career · personal-ops · meta · lux-specific
Rotation: core-every-night · rotating-weekly · one-shot · seasonal · reactivation-candidate


Quick Index
| ID  | Dashboard Name                       | Status | Cadence                                                         | Repo                 | Category      | File |
|-----|--------------------------------------|--------|-----------------------------------------------------------------|----------------------|---------------|------|
| R01 | R01 · Frontend Health Scan           | 🟢     | Daily 3:33 AM EDT                                               | lux-frontend         | code-quality  | R01  |
| R02 | R02 · Deep Code Review               | 🟢     | Daily 4:00 AM EDT                                               | lux-frontend         | code-quality  | R02  |
| R03 | R03 · Frontend Architecture Audit    | 🟢     | Sundays 4:00 AM EDT                                             | lux-frontend         | code-quality  | R03  |
| R04 | R04 · Dependency Vulnerability Scan  | 🟢     | Tuesdays 4:00 AM EDT                                            | lux-frontend         | security      | R04  |
| R05 | R05 · Frontend Performance Budget    | 🟢     | Saturdays 4:00 AM EDT                                           | lux-frontend         | perf          | R05  |
| R06 | R06 · Frontend Hygiene Sweep         | 🟢     | Day 1 · 8:00 UTC                                                | lux-frontend         | code-quality  | R06  |
| R07 | R07 · Backend Health Scan            | 🟢     | Sundays 4:15 AM EDT                                             | luxury-language-api  | code-quality  | R07  |
| R08 | R08 · Backend Architecture Audit     | 🟢     | "Biweekly" Sundays 5:00 UTC ⚠️ (cron fires ~14–18×/month — see R08) | luxury-language-api  | code-quality  | R08  |
| R09 | R09 · Backend Hygiene Sweep          | 🟢     | Day 1 · 9:00 UTC                                                | luxury-language-api  | code-quality  | R09  |
| R10 | R10 · Deploy Smoke Test              | 🟡     | Daily 5:00 AM EDT                                               | lux-frontend         | infra         | R10  |
| R11 | R11 · Frontend Accessibility Audit   | 🟡     | Thursdays 4:00 AM EDT                                           | lux-frontend         | lux-specific  | R11  |
| R12 | R12 · Test Scaffold Generator        | 🟡     | Wednesdays 4:00 AM EDT                                          | lux-frontend         | testing       | R12  |
| R13 | R13 · Env Example Generator          | 🟡     | Sundays 3:00 AM EDT                                             | lux-frontend         | infra         | R13  |
| R14 | R14 · Architecture Doc Rewriter      | 🟡     | Sundays 2:00 AM EDT                                             | lux-frontend         | docs          | R14  |
| R15 | R15 · Test Import Autofix            | 🟡     | Sundays 9:00 AM EDT                                             | lux-frontend         | testing       | R15  |
Active: 9 · Paused: 6 · Retired: 0 · Total configured: 15

Per-Routine Entry Format (template for every R??-*.md file)
### R?? — `dashboard-name`
- **Rename →** Proposed Clean Name
- 🟢 Active · `repo-name` · category · rotation-tag
- Cadence (`cron-expression`) · Model · trigger-type
- **Output:** where findings land
- **Active:** start → retire · **Edited:** last-edit · **Last run:** last-successful-run
- **Depends on:** upstream routine/file, or —

**Prompt:**
(full prompt verbatim in a fenced code block)

**Notes:** any routine-specific context

Operating Notes

Registry beats dashboard. When they disagree, fix the dashboard to match the registry and commit.
Paused ≠ retired. Paused routines are parked indefinitely; they cost nothing to keep configured and retain reference value. Retirement is explicit and rare.
Runs-per-day is the real ceiling, not routine count. The dashboard's 15/day is a daily-run budget; routine count on standby is effectively unbounded. Closing the 2.5 → 15 daily-runs gap is a scheduling question, not a new-routines question.
Model varies across the fleet. Final tally (all 15 cards confirmed):

Opus 4.7 1M → 9 routines (R01, R05, R06, R07, R08, R09, R11, R13, R15) — whole-repo scans, multi-check sweeps, filesystem enumeration, paired audits
Opus 4.7 standard → 5 routines (R02, R03, R04, R10, R12) — all bounded scope: ≤5-file review, 3-check sweep, npm-audit output, fixed-string no-op, top-5 inbound-import analysis
Legacy Model → 1 routine (R14 · Architecture Doc Rewriter) — both manual runs failed; see R14 Notes
Clear pattern: 1M for anything that enumerates the whole repo; standard for anything with an explicit file-count cap or bounded-output scope. R14 is an outlier on Legacy Model and almost certainly needs the model bumped before retire/reactivate is decided. All 15 cards use "Default" permissions and have no connectors attached.


Dashboard names now include the R## prefix (applied 2026-04-20) — e.g., `R01 · Frontend Health Scan`. The Proposed Clean Name column is now historical; new routines should be created with the `R## · Descriptive Name` format from the start.
kodama-reports/* output paths are vestigial. Flag but don't fix during registry build; clean up during a later prompt-sharpening pass.
Cron timezone is not uniform. The built-in trigger picker (e.g., "every Saturday at 4:00 AM EDT") is stored in local time with an EDT label. The Custom cron picker (e.g., 0 9 1 * *) is stored in UTC. Card headers in the individual files note the timezone explicitly whenever it matters.
Morning Review window: Mark's free time on teaching days is roughly 1–5 PM and Fridays. Target routine finish time: by 6:00 AM so reports are ready for afternoon review. Morning Briefing routine (planned) will consolidate overnight output for one-screen reading.
Effectiveness tracking: not done by hand. A future meta-routine reads issues/PRs from the last 30 days across all routines and writes docs/routines/EFFECTIVENESS_LOG.md. See Backlog → Meta section.


Daily-Run Accounting

Configured routines: 15 (standby capacity is effectively unbounded; only the runs-per-day ceiling matters)
Daily-runs budget: 15/day included
Average daily scheduled runs now observed: ~3/day baseline (R01 + R02 fire every weekday, plus one of R03/R04/R05/R07/R11/R12/R13/R15 depending on day-of-week), with R06 and R09 adding one run each on the first of the month, R08 producing a near-daily load until its cron is fixed, and R10/R14 dark (paused)
Headroom: ~12 runs/day unused

Path to closing the gap (Schedule Calibration queue)

Decide R07's cadence. Run history confirms the routine was flipped daily → weekly between Apr 19 and now. ~~Name drift (lux-backend-nightly-health vs weekly cron)~~ ✅ RESOLVED 2026-04-20 via R## rename pass — dashboard name is now "R07 · Backend Health Scan" (cadence-neutral). Still pending: decide whether to keep weekly or flip back to daily (there's headroom). Single highest-ROI cadence decision in the fleet.
~~Stagger Sunday.~~ ✅ NO ACTION 2026-04-20. Only 3 of 6 Sunday routines are active (R03, R07, R08); R08's apparent bunching is actually its cron bug (tracked separately). R03 + R07 are paired-by-design (15-min offset). Revisit if active Sunday count exceeds 4.
Add new daily routines from the Backlog. Morning Briefing 🔵, Secret Scanner 🔵, Bundle Size Tracker 🔵, Vercel Function Count Watch 🔵 are the obvious first picks.
Activate R10 once deployment lands. Cleanest unpause — but only after Vercel goes public, and ideally converted to a webhook trigger (deployment.succeeded) rather than daily cron.
~~Fix R08's cron.~~ ✅ DONE 2026-04-20. Cron changed from `0 5 1-7,15-21 * 0` to `0 5 1-7,15-21 * *` to avoid cron's OR-gotcha. Added SUNDAY-ONLY GATE at top of prompt (`date -u +%u`). Effective cadence now 2 runs/month. Details in R08 Notes.
~~Resolve R14's model mystery.~~ ✅ DIAGNOSED 2026-04-20. Model bump to Opus 4.7 1M was correct; new failure mode is prompt-level (stream timeout on verbose exploration). Prompt-fix list captured in R14 Notes. R14 stays paused (one-shot, non-blocking).
~~Investigate R01's Apr 18 03:34 run-icon anomaly.~~ ✅ RESOLVED 2026-04-20. Zombie "Pondering..." session on Anthropic-side infra, not a prompt bug. Surrounding runs all green. No action required. Details in R01 Notes.
~~Add activity gate to R11.~~ ✅ DONE 2026-04-20. Utility Gate v2 applied (SHA-pinned, scope-filtered: HTML/JS/JSX globs). Safe to reactivate.
~~Resolve issue-number collisions.~~ ✅ DONE 2026-04-20. #22 stays shared by design (R01 + R02 paired tracker). #23 → R12 moved to new issue #58 (Test Scaffold Tracker). #24 → R04 moved to new issue #57 (Security Tracker).


Navigation

Per-routine files: R01-*.md through R15-*.md in this folder
Sibling docs: ../CLAUDE_ROUTINES_BACKLOG.md, ../CLAUDE_ROUTINES_PLAYBOOK.md, ../LUX_ROUTINES_FROM_CATALOG.md
Planned sibling: ../EFFECTIVENESS_LOG.md (auto-generated by a future meta-routine)