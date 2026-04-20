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
IDCurrent NameProposed Clean NameStatusCadenceRepoCategoryFileR01lux-nightly-health-scanFrontend Health Scan🟢Daily 3:33 AM EDTlux-frontendcode-qualityR01R02lux-deep-code-reviewDeep Code Review🟢Daily 4:00 AM EDTlux-frontendcode-qualityR02R03lux-weekly-architecture-auditFrontend Architecture Audit🟢Sundays 4:00 AM EDTlux-frontendcode-qualityR03R04lux-dependency-vulnerability-scanDependency Vulnerability Scan🟢Tuesdays 4:00 AM EDTlux-frontendsecurityR04R05lux-frontend-performance-budgetFrontend Performance Budget🟢Saturdays 4:00 AM EDTlux-frontendperfR05R06lux-monthly-hygieneFrontend Hygiene Sweep🟢Day 1 · 8:00 UTClux-frontendcode-qualityR06R07lux-backend-nightly-healthBackend Health Scan🟢Sundays 4:15 AM EDTluxury-language-apicode-qualityR07R08lux-backend-weekly-architectureBackend Architecture Audit🟢"Biweekly" Sundays 5:00 UTC ⚠️ (cron fires ~14–18×/month — see R08)luxury-language-apicode-qualityR08R09lux-backend-monthly-hygieneBackend Hygiene Sweep🟢Day 1 · 9:00 UTCluxury-language-apicode-qualityR09R10lux-deploy-smoke-testDeploy Smoke Test🟡Daily 5:00 AM EDTlux-frontendinfraR10R11lux-frontend-accessibility-auditFrontend Accessibility Audit🟡Thursdays 4:00 AM EDTlux-frontendlux-specificR11R12lux-test-scaffoldTest Scaffold Generator🟡Wednesdays 4:00 AM EDTlux-frontendtestingR12R13lux-generate-env-exampleEnv Example Generator🟡Sundays 3:00 AM EDTlux-frontendinfraR13R14lux-rewrite-architectureArchitecture Doc Rewriter🟡Sundays 2:00 AM EDTlux-frontenddocsR14R15lux-test-imports-autofixTest Import Autofix🟡Sundays 9:00 AM EDTlux-frontendtestingR15
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
Legacy Model → 1 routine (R14 lux-rewrite-architecture) — both manual runs failed; see R14 Notes
Clear pattern: 1M for anything that enumerates the whole repo; standard for anything with an explicit file-count cap or bounded-output scope. R14 is an outlier on Legacy Model and almost certainly needs the model bumped before retire/reactivate is decided. All 15 cards use "Default" permissions and have no connectors attached.


Dashboard names are just display labels. Rename freely — nothing is bound to them. The Proposed Clean Name column tracks a planned rename pass; not yet applied.
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

Decide R07's cadence. Run history confirms the routine was flipped daily → weekly between Apr 19 and now (three consecutive SCHEDULED fires Apr 17/18/19, then "Next run: Apr 26" = weekly). The name lux-backend-nightly-health is now stale. Either rename to lux-backend-weekly-health and keep weekly, or flip back to daily (there's headroom). Single highest-ROI cadence decision in the fleet.
Stagger Sunday. Six routines currently land on Sunday (R03 04:00, R07 04:15, R08 near-daily via cron bug, R13 03:00, R14 02:00, R15 09:00) — several paused but will stack if reactivated. Spread across weekdays when possible.
Add new daily routines from the Backlog. Morning Briefing 🔵, Secret Scanner 🔵, Bundle Size Tracker 🔵, Vercel Function Count Watch 🔵 are the obvious first picks.
Activate R10 once deployment lands. Cleanest unpause — but only after Vercel goes public, and ideally converted to a webhook trigger (deployment.succeeded) rather than daily cron.
Fix R08's cron. Current cron 0 5 1-7,15-21 * 0 fires ~14–18×/month via cron's OR-logic, not biweekly. Two fix paths in the R08 file.
Resolve R14's model mystery. Only routine on Legacy Model; both manual runs failed. Upgrade to Opus 4.7 1M and run once to diagnose. Outcome determines retire-vs-keep-parked.
Investigate R01's Apr 18 03:34 run-icon anomaly. Icon visually distinct from surrounding green-checks — likely failed/cancelled/timed-out. R03 documented a prior stream-idle-timeout on Apr 15; worth tracking across R01 runs.
Add activity gate to R11. Currently no pre-check — would run full HTML/JS scan every Thursday regardless of changes. Gate on HTML/JS changes in last 7 days before unpause.
Resolve issue-number collisions. #22 (R01 + R02 — by design, paired tracker). #23 (R03 + R12 — collision). #24 (R04 + R06 — collision). Security signal deserves its own tracker; test-scaffold output probably belongs in its own.


Navigation

Per-routine files: R01-*.md through R15-*.md in this folder
Sibling docs: ../CLAUDE_ROUTINES_BACKLOG.md, ../CLAUDE_ROUTINES_PLAYBOOK.md, ../LUX_ROUTINES_FROM_CATALOG.md
Planned sibling: ../EFFECTIVENESS_LOG.md (auto-generated by a future meta-routine)