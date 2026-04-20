# Registry Observations — 2026-04-19

<!-- Path: docs/routines/REGISTRY_OBSERVATIONS_2026-04-19.md — Snapshot of cross-fleet patterns, anomalies, and portable lessons surfaced during the registry build. Sibling to docs/routines/registry/ (per-routine files) and the three idea/strategy/catalog docs. -->

Snapshot companion to `docs/routines/registry/` — everything learned during the per-routine audit that belongs at the fleet level, not inside any one routine's file. Generated during the 2026-04-19 registry build after paste-in of all 15 live prompts.

Per-routine specifics live in `registry/R??-*.md`. The bird's-eye view lives in `registry/INDEX.md`. **This file is the analysis layer** — the themes that emerged once all 15 routines were visible side-by-side.

---

## 1. Portable patterns worth lifting to `CLAUDE_ROUTINES_PLAYBOOK.md`

Eight reusable lessons the current fleet demonstrates. Each one should become a named pattern in the Playbook so future routines can reference them instead of rediscovering them.

**Sequential execution by default (R03, R08).** Both architecture audits explicitly forbid parallel sub-agents. R03's prompt documents its own prior timeout post-mortem: "The previous version of this routine ran 5 checks in parallel sub-agents and timed out (API Error: Stream idle timeout on 2026-04-15)." When two independent routines land on the same anti-pattern, it stops being a quirk and starts being a rule. Playbook entry: *"Routines run one check at a time, fully, before the next. Parallel sub-agents are forbidden by default; opt in only with explicit justification."*

**Paired-routine anti-duplication (R01 ↔ R02).** R02's prompt contains an explicit `WHAT NOT TO LOOK FOR` section listing R01's five checks verbatim and saying "If you find yourself about to flag one of the above, STOP. That's the nightly's job." This separation-of-concerns between pattern-match (R01) and behavioral-read (R02) is the canonical pattern for any future paired daily scanner. Playbook entry: *"When pairing a scanner with a reviewer, make the boundary explicit in both prompts. The reviewer's prompt should enumerate the scanner's checks and hard-gate against duplicating them."*

**Git is not the filesystem for gitignored files (R06, R09).** Both monthly hygiene prompts explicitly mandate filesystem enumeration for `.GOLD` detection because `*.GOLD` is gitignored. The R06 prompt says verbatim: *"This has caused past routine runs to report '0 .GOLD files' when the actual count on disk was substantially higher."* Same lesson in two independent routines. Playbook entry: *"Any audit of gitignored files must use filesystem enumeration (`find`, recursive walk). `git ls-files` and `git grep` will see zero."*

**Fails closed on unexpected drift (R15).** R15's hard rule — "If you find fewer or more than 27 total replacements across the three files, STOP and report the discrepancy without opening a PR" — is the crown jewel pattern for any surgical autofix. The discrepancy itself becomes the signal. Playbook entry: *"Surgical autofix routines must pre-count expected operations, verify post-edit counts match, and STOP rather than proceed on mismatch."*

**Be honest about confidence (R02).** R02's prompt contains an explicit directive: *"Be honest about confidence: say 'I'm not sure about this' when the issue depends on runtime behavior you can't verify statically."* Rare in LLM prompts. Makes uncertainty itself a valid output rather than a bug to hide. Playbook entry: *"Prompts should explicitly grant the routine permission to express uncertainty. Low-confidence findings labeled as such beat high-confidence findings that are wrong."*

**Self-check before flagging (R06, R09).** Both monthly prompts attach a self-check clause to each check: "for each candidate, grep the package.json scripts and config files one more time." R01 extends this into a three-step mandatory false-positive check before any URL drift finding. The pattern: every check body ends with a question the routine must answer before reporting. Playbook entry: *"Each check in a routine prompt should end with an explicit self-check clause naming the most likely false-positive condition for that check."*

**Read the files, don't guess (R14).** R14's Step 1 says: *"List every top-level directory and its purpose (read the files inside to understand, don't guess)."* Simple anti-hallucination hedge that generalizes to any "describe from source" routine. Playbook entry: *"Any routine that describes, summarizes, or documents code must be instructed explicitly to read source files before generating the description."*

**Activity gate as cheap cron prelude (R01, R02, R03, R05, R06, R07, R08, R09).** Eight of fifteen routines open with a `git log --since="..."` pipe that checks whether any relevant files changed in the cadence window; if not, the routine writes a short skip stub and exits before any real work. The gate itself costs milliseconds. Playbook entry: *"Every scheduled routine except one-shots and intentional no-ops should open with a git-log activity gate tuned to its cadence. Shape: `git log --since='<window>' --name-only --pretty=format:'' | sort -u | grep <relevance-filter>`. Empty result ⇒ short skip stub + draft PR for visibility + exit. Never enumerate the filesystem to decide whether to run."*

---

## 2. Fleet-wide anomalies to address during Schedule Calibration

Specific issues surfaced during the paste-in that need resolution. All cross-referenced to the INDEX's 9-item Path-to-closing-the-gap queue.

**Three weekly routines have no activity gate** — R04 (Dependency Vulnerability Scan), R11 (Frontend Accessibility Audit), R12 (Test Scaffold Generator). R04 is defensible because `npm audit --json` is a cheap local op and the database updates matter even without local changes — but it should be explicit in the prompt. R11 and R12 are both currently paused; add gates before unpause.

**R12's "no framework assumed" design is outdated.** The prompt was written before the Vitest migration. Repo is now on Vitest with 164 tests passing as of 2026-04-19. If R12 is reactivated, scaffolded tests should be Vitest-style `describe`/`it`/`expect` rather than bare `console.assert`. Prompt-sharpening pass item.

**R07 dashboard name drift.** Name says `lux-backend-nightly-health`; cadence is now weekly Sundays (run history confirms daily → weekly flip between Apr 19 and now). Prompt body and cron agree on weekly; only the display name is stale.

**R08 cron-intent mismatch empirically confirmed.** Cron `0 5 1-7,15-21 * 0` combined with cron's OR-logic fires ~14–18×/month, not biweekly. Mon Apr 20 (day 20, not a Sunday) is scheduled per the dashboard — only OR-logic produces that. Two fix paths in R08's Notes.

**R14 Legacy Model outlier.** Only routine in the fleet not on Opus 4.7. Both manual runs failed. Upgrade to Opus 4.7 1M and run once before deciding retire-vs-keep-parked; failures are almost certainly model-capacity, not prompt-correctness.

**R01 Apr 18 03:34 run-icon anomaly.** Run history shows an icon visibly distinct from surrounding green-checks — likely failed, cancelled, or stream-timeout. R03 documents a prior stream-idle-timeout on Apr 15, so "stream timeout on large frontend scan" is a known failure class worth tracking across R01 runs.

**Vestigial `kodama-reports/*` paths** — 11 different subpaths across the fleet (nightly, reviews, weekly, monthly, performance, accessibility, security, backend-nightly, backend-weekly, backend-monthly, autofix). Kodama is archived; the path namespace is leftover from the pre-routines era. Single coordinated rename pass during prompt-sharpening.

---

## 3. Issue-number collision map

Three GitHub issues currently serve as trackers for routine output. Not all collisions are accidents.

**Issue #22 — shared by R01 + R02 by design.** The two daily routines post complementary signal to a single tracker; this is the canonical paired-tracker pattern documented in §1 above. Embrace it formally: rename the issue if appropriate (e.g., "Daily Frontend Health — R01+R02").

**Issue #23 — collision between R03 (Frontend Architecture Audit) and R12 (Test Scaffold Generator).** Unrelated domains posting to the same tracker. R12 should get its own issue before reactivation, or the collision should be documented as intentional.

**Issue #24 — collision between R04 (Dependency Vulnerability Scan) and R06 (Frontend Hygiene Sweep).** Security signal currently buried in monthly-hygiene noise. R04 should get a dedicated "Security Tracker" issue.

---

## 4. Activity gate inventory (standardization reference)

The fleet has eight different gate shapes. Worth normalizing.

| Routine | Window | Filter | Notes |
|---|---|---|---|
| R01 | 24h | exclude `_agents-archive/`, `kodama-reports/`, `*.md` | most thorough filter |
| R02 | 48h | `\.js$` only, exclude archive + `\.test\.js$` | source-only |
| R03 | 7d | exclude archive, reports, `*.md` | |
| R05 | 7d | ANY change triggers (no filter) | broadest |
| R06 | 30d | exclude archive, reports, `*.md` | |
| R07 | 7d | `\.(js\|mjs)$`, exclude archive + `.GOLD` | most rigorous |
| R08 | 14d | `\.(js\|mjs)$`, exclude archive + `.GOLD` | R07 clone |
| R09 | 30d | `\.(js\|mjs)$`, exclude archive + `.GOLD` | R07 clone |
| R04 | none | — | should have one |
| R11 | none | — | should have one before unpause |
| R12 | none | — | should have one before unpause |
| R10 | none | — | no-op, doesn't need one |
| R13, R14, R15 | none | — | one-shots, don't need one |

**Recommendation for standardization:** R07's shape is the template. `git log --since="<window>" --name-only --pretty=format:"" | sort -u | grep -E '<ext-filter>' | grep -v '<exclusion-filter>'`. Every new routine copies this and tunes the window + filters.

---

## 5. Model distribution

Final fleet tally:

- **Opus 4.7 1M (9)** — R01, R05, R06, R07, R08, R09, R11, R13, R15. Whole-repo scans, multi-check sweeps, filesystem enumeration, paired audits.
- **Opus 4.7 standard (5)** — R02, R03, R04, R10, R12. All bounded scope: ≤5-file review, 3-check sweep, npm-audit output, fixed-string no-op, top-5 inbound-import analysis.
- **Legacy Model (1)** — R14. Outlier; both manual runs failed.

**Pattern:** 1M for anything that enumerates the whole repo; standard for anything with an explicit file-count cap or bounded-output scope. Consistent across the fleet with the single exception of R14, which is almost certainly a misconfiguration rather than a design choice.

---

## 6. Handoff to Schedule Calibration

All items above feed into the 9-item Path-to-closing-the-gap queue in `registry/INDEX.md`. Cross-references:

- INDEX items 1, 5, 6, 7 → §2 anomalies (R07, R08, R14, R01)
- INDEX item 2 → §4 activity gate inventory + Sunday bunching
- INDEX item 3 → Backlog (Morning Briefing, Secret Scanner, Bundle Size, Vercel Function Count)
- INDEX item 4 → §2 R10 unpause
- INDEX item 8 → §2 R11 activity gate
- INDEX item 9 → §3 issue-number collisions

When Schedule Calibration starts, this doc is the reference. When the calibration pass is complete, this doc becomes a historical snapshot — append future observations to a new dated sibling rather than overwriting.

---

## 7. One more for the Playbook queue

A point not derived from any single routine but from watching the fleet accrete over the past several days:

**Routine prompts are living documents.** R03 carries its own post-mortem in the `DROPPED FROM PRIOR VERSION` block. R07 carries a canary list and explicit anti-false-positive hedges. R06 and R09 carry the `.GOLD` lesson because prior runs failed without it. Every prompt that matters in this fleet has been edited in response to a specific failure.

The implication for the Playbook: **the prompt is not written once. It's edited after every failure, and the edit preserves the reason.** The `DROPPED FROM PRIOR VERSION` pattern is the right shape for this — when a check is removed, leave a one-line comment explaining why so a future operator doesn't re-add it. When a new guard rail is added, leave a one-line comment naming the failure mode that motivated it.

The Playbook should codify this: *"Every change to a live routine prompt leaves a comment in the prompt itself explaining what motivated the change. Prompts accumulate this history. The history is the value."*
