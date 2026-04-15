# Kodama Week 1 Findings

Running log of calibration observations. Updated as each run produces new data.
Week 1 scope: 10 runs, read-only mode, Sonnet 4.6 pinned, Tier 0 safety envelope.
Nothing in this file changes `supervisor.ps1`. Week 2 patch is gated on Week 1 completion.

## Run ledger

| Run | Date       | Task ID                     | Wall-clock | Output   | Canary          | Notes                                          |
|-----|------------|-----------------------------|------------|----------|-----------------|------------------------------------------------|
| 1   | 2026-04-10 | cal-01-largest-js           | 31.2s      | 1,119 ch | src/main.js     | Baseline. Accurate exports + line counts.      |
| 2   | 2026-04-11 | cal-02-lux-bus-contract     | 27.7s      | 2,622 ch | lux-bus.js      | ARCHITECTURE.md not found at prompt path. Pivoted to `app-core/lux-bus.js` source. Accurate but missed richer doc. |
| 3   | 2026-04-11 | cal-03-split-candidates     | 18.1s      | 784 ch   | none            | Cross-validated Run #1. Correctly excluded files under 400 lines. Flagged two generated data files. |
| 4   | pending    | cal-04-convo-bootstrap      | -          | -        | -               | -                                              |
| 5   | pending    | cal-05-recorder-warnswallow | -          | -        | -               | -                                              |
| 6   | pending    | cal-06-lux-bus-import-trace | -          | -        | -               | -                                              |
| 7   | pending    | cal-07-architecture-channels| -          | -        | -               | Redo of Run #2 with correct `docs/ARCHITECTURE.md` path. |
| 8   | pending    | cal-08-helpers-inventory    | -          | -        | -               | -                                              |
| 9   | pending    | cal-09-build-config-report  | -          | -        | -               | -                                              |
| 10  | pending    | cal-10-extension-census     | -          | -        | -               | -                                              |

## Findings

### Finding #1 — Task prompts must use full repo-rooted paths
**Status:** confirmed, Run #2.
**Observation:** Run #2's prompt said "Read ARCHITECTURE.md in C:\dev\LUX_GEMINI". Sonnet looked at the repo root, didn't find it there, reported "does not exist", and pivoted to reading `app-core/lux-bus.js` directly as primary source. The file actually lives at `docs/ARCHITECTURE.md`.
**Interpretation:** Sonnet headless does not do recursive filename searches before falling back. It takes paths literally. This is technically-correct but operationally lazy.
**Action for Week 2 task design:** every file path in `tasks-queue.json` prompts must be fully qualified from repo root. No implicit locations. No "find the file called X". If a file's location is ambiguous, say so explicitly: "search recursively under `C:\dev\LUX_GEMINI` for a file named X".
**Already applied:** tasks #4-#10 (added 2026-04-11) all use full paths.

### Finding #2 — Queue file is self-shrinking; no on-disk archive of completed tasks
**Status:** confirmed, observed during queue extension on 2026-04-11.
**Observation:** `supervisor.ps1` pops completed tasks off `tasks-queue.json` after each run. The file shrinks over time. By the time of the queue extension, the original 3-task bootstrap state was no longer on disk — only the single remaining task (`cal-03-split-candidates`). The completed prompts for cal-01 and cal-02 exist only inside `run-log.jsonl`, which stores them only if we had logged the prompt text (we currently do not — only the task ID).
**Interpretation:** If `run-log.jsonl` ever got corrupted or deleted, the original prompt text of completed tasks would be unrecoverable. `.GOLD` backups of `tasks-queue.json` only capture the state at the moment of backup, which by definition excludes everything already popped.
**Action for Week 2 supervisor patch:** add one of:
  (a) a `tasks-archive.jsonl` append-only file that captures each task's full record (id + prompt text) immediately before execution, or
  (b) extend `run-log.jsonl` records to include the full prompt text used for each run, not just the task ID.
Option (b) is simpler. Option (a) is cleaner separation-of-concerns. Decide at Week 2 patch time.
**Not urgent:** `run-log.jsonl` is append-only and hasn't been lost. This is a durability improvement, not a correctness fix.

### Finding #3 — Em-dash encoding artifact in PowerShell display
**Status:** confirmed, present in all three runs.
**Observation:** Every run's `--- CLAUDE OUTPUT ---` block displays `ΓÇö` where the output contains an em-dash (`—`). The mangling is consistent across runs, not intermittent.
**Interpretation:** PowerShell's default Windows console code page is misrendering Sonnet's UTF-8 output. The mangling is at the *display* layer only; the raw bytes in `run-log.jsonl` are likely correct (not yet verified).
**Action for Week 2 supervisor patch:** add one line near the top of `supervisor.ps1`:
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```
**Verification step before the fix goes in:** read `run-log.jsonl` with `Get-Content -Encoding UTF8` and confirm the raw bytes contain proper em-dashes, not `ΓÇö`. If raw bytes are mangled too, the fix is different.
**Cosmetic, not blocking.** All three runs produced correct content; only the display was ugly.

### Finding #4 — Wall-clock range narrower than anticipated
**Status:** tentative, three data points.
**Observation:** Three runs clocked 31.2s, 27.7s, 18.1s across three meaningfully different task shapes (top-N filter, doc summary with pivot, threshold filter). Range 18–31s.
**Interpretation:** Fixed overhead (tool startup, repo indexing, model reasoning) appears to dominate over generation cost at these output sizes (784-2622 chars). Prediction for Week 1 remaining runs: 15–45s range, with anything over 60s indicating something unusual (large file reads, recursive scans, rate limit queueing).
**Action:** none yet. Keep watching. Re-assess after Run #6.
**Week 2 implication:** supervisor's current implicit expectation that runs take "around a minute" is too generous by ~2x. This is good news for throughput planning but does not justify relaxing `$DAILY_MAX` or `$WEEKLY_MAX` on its own — the limiting resource is calibration quality, not wall-clock.

## Parked for Week 2 patch

Consolidated list of things the Week 2 supervisor edit should address. Ordered by ease, not importance.

1. Add `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` (Finding #3). One line.
2. Log full prompt text in `run-log.jsonl`, not just task ID (Finding #2). Small schema addition.
3. Add a `sonnet_bar_pct` field to `budget.json` alongside the existing `weekly_bar_pct` (which should be renamed `combined_bar_pct`). Then add a second floor check for Sonnet-specific usage.
4. Relax `$DAILY_MAX` and `$WEEKLY_MAX` based on end-of-Week-1 data. Current caps are 3/day, 10/week. `/status` at the midpoint of Week 1 (2026-04-11 afternoon) showed 4% combined / 0% Sonnet after 3 runs. Leaning toward 6/day, 25/week for Week 2. Final number decided after all 10 runs logged.
5. Add write-mode gated behind a separate flag (`-WriteMode` switch, default off). Week 3+ only. Not Week 2.
6. Reconsider the `.GOLD` convention for `tasks-queue.json` specifically — consider versioning queue snapshots by run count instead (`tasks-queue.json.after-run-3.bak`).

## Verified safety properties (do not remove, no matter what)

These have been observed working across three runs and should not be removed or weakened in any Week 2+ patch without a very explicit reason recorded here.

- **STOP file kill switch** fires before any state is loaded. First thing supervisor checks. Verified once in smoke test, present on every subsequent invocation.
- **Canary denylist** flags mentions of protected files without aborting legitimate read-only tasks. Zero false positives, zero false negatives across 3 runs.
- **Git checkpoint tags** written before and after every Claude call. 3 runs = 6 tags. Zero diffs between pre and post on any run (read-only invariant held).
- **Budget floors** hardcoded in `supervisor.ps1` constants, not config. `$DAILY_MAX`, `$WEEKLY_MAX`, `$RESERVE_FLOOR` cannot be raised by editing `budget.json`.
- **Model pinning** to `claude-sonnet-4-6`. Opus never called by Kodama.
- **Interactive GO prompt** gates every real run. `-DryRun` flag short-circuits it cleanly for testing.
- **Daily counter reset** fires automatically when `last_run_date` != today. Verified working across the 2026-04-10 → 2026-04-11 day boundary.
- **Append-only action log** at `run-log.jsonl`. Every run, every abort, every rate limit (when it happens) gets a line.

## Next milestone

Run #4 = tomorrow (2026-04-12) or later. Do not run today. Day cap is 3/3 after Run #3.

🌳

---

## Week 1 Close-Out (2026-04-13, 10:47pm ET)

**Decision:** Graduating Week 1 at 6 of 10 calibration runs. Runs #7-#10 parked, not cancelled.

**Rationale:** Runs #1-#6 covered 6 distinct task shapes (top-N scan, doc-summary with pivot, threshold filter, single-file deep read, multi-file pattern audit, cross-file dependency trace). Task-shape diversity is saturated. Remaining queue (docs read, helpers inventory, build config report, extension census) would produce confirmation data, not new shape data. Marginal learning value per additional run does not justify the calibration time vs. moving to Week 2 write-mode patch work.

**State at graduation:**
- 6 runs complete, zero safety failures
- Wall-clock range: 18.1-68.1 seconds, mean ~36s, all within expected bounds
- Canary system: 5 legitimate mentions flagged, 0 false positives, 0 false aborts
- Read-only invariant: held 6/6
- 4 findings logged (path literalness, queue shrinkage, encoding bug, wall-clock range)
- 12 git tags on Lux repo, all read-only label pairs

**What graduates Week 1 looks like:**
- All Week 1 state backed up to `*.WEEK1-PAUSE.GOLD` files
- Task queue frozen at `cal-07` through `cal-10` pending
- Budget counters frozen at `runs_today: 3, runs_this_week: 6`
- Supervisor.ps1 unchanged

**Next milestone: Week 2 supervisor patch.** Not tonight. When Mark is fresh.
Patch scope: UTF-8 encoding fix, full prompt text logged in run-log.jsonl, `-WriteMode` flag behind a default-off switch, canary denylist upgraded from warn-only to hard-abort when write mode is on, per-task model override. Risk Gate required before patch writes.

**Kodama is parked. Not dead. Not broken. Not in progress. Parked.**

🌳
---

## Findings #5–#9 (Week 1 closeout, 2026-04-14)

### Finding #5: Daily cap relaxed 3 → 4 for closeout run
Operator judgment call to complete cal-10 in a single evening rather than split across midnight. Disciplined execution: `.GOLD` backup taken at `supervisor.ps1.PRE-CAP-BUMP.GOLD` before edit. Single-line change on line 11 (`$DAILY_MAX = 4`), verified via Select-String before launch. Week 2 patch will set a new permanent cap based on end-of-Week-1 usage data.

### Finding #6: Wall-clock envelope has two bands, not one
Earlier prediction of 15–90s for read-only runs held for 9 of 10 runs (range 16.1–68.1s). cal-10 broke the envelope at 131.3s — expected, because filesystem-tree traversal with per-file extension grouping is O(n) disk I/O, fundamentally different from targeted file reads.

Revised Week 2 prediction:
- Targeted read tasks (specific files, grep-like queries): 15–90s
- Tree-walking tasks (full-repo enumeration, census, audit): 60–180s
- >180s on either: anomaly, worth investigating

### Finding #7: 28 .GOLD files exist in the Lux repo
cal-10 surfaced the same .GOLD count that Simoishi's first OpenClaw scan identified ~4 days ago. Nothing has been cleaned in the interim. Concrete candidate list for Week 3 write-mode calibration: .GOLD cleanup is bounded, non-canary, reviewable via git diff, and overdue. Proposed first write-mode task: delete .GOLD files older than 14 days whose source files are unmodified since the .GOLD was created.

### Finding #8: Repo file-extension baseline established
324 .js, 73 .mp4, 62 .css, 55 .jpg, 47 .webp, 28 .GOLD, 16 .md, 10 .html, 7 .json, 7 .mjs. Useful anchor for measuring future refactor impact.

### Finding #9: Sonnet weekly bar unmoved after 10 runs
Post-Week-1 /status snapshot: session 41%, combined weekly 8%, Sonnet-only weekly 0%. Ten headless Sonnet runs did not register on the Sonnet bucket. Current caps ($DAILY_MAX=4, $WEEKLY_MAX=10) are wildly conservative relative to actual consumption. Week 2 patch can safely raise to ~8/day, ~40/week without approaching the 75% reserve floor. Combined bar consumption is nearly all Opus interactive work, not Kodama.