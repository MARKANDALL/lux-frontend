# Kodama Week 2 Findings

Running log of supervisor patch verification. Updated as each smoke test produces new data.
Week 2 scope: supervisor patch (seven edits), three read-only smoke tests, no write-mode activation.
Nothing in this file changes `supervisor.ps1`. Week 3 gated on Week 2 completion.

## Patch manifest (applied 2026-04-14)

| # | Patch | Status |
|---|-------|--------|
| 1 | UTF-8 output encoding (em-dash fix) | Verified |
| 2 | Cap raise: $DAILY_MAX 4→10, $WEEKLY_MAX 10→40 | Verified |
| 3 | -WriteMode param (default OFF) | Verified (scaffold) |
| 4 | Per-task model override + dynamic Mode/Model banner | Verified |
| 5 | Canary hard-abort (section 5b) | Verified |
| 6 | Plumbed $taskModel + WriteMode branch into Claude call | Verified |
| 7 | Prompt logging + model + write_mode fields in run log | Verified |

Pre-patch .GOLD: `supervisor.ps1.GOLD` (6098 bytes, 2026-04-14 00:25:32).
Post-patch tag: `kodama/week-2-patch` on Lux main.

## Run ledger

| Run | Date       | Task ID                     | Wall-clock | Output  | Model                  | Outcome                                        |
|-----|------------|-----------------------------|------------|---------|------------------------|------------------------------------------------|
| 12  | 2026-04-14 | w2-01-smoke-baseline        | 11.3s      | 129 ch  | claude-sonnet-4-6      | Clean run. Claude correctly rejected a bad path assumption in the prompt (see Finding #14). |
| 13  | 2026-04-14 | w2-02-smoke-canary-abort    | <1s        | —       | (never invoked)        | Hard-abort before Claude call. Budget unchanged, queue unchanged, canary_abort logged. |
| 14  | 2026-04-14 | w2-03-smoke-model-override  | 7.0s       | 49 ch   | claude-opus-4-6 (override) | Clean run. Opus invoked via per-task override. Banner displayed "(per-task override)" suffix as designed. |

## Findings

### Finding #10: Patched Claude call signature works end-to-end (Patch 6)
The WriteMode branch, $taskModel variable, and 2>&1 redirect all work. Verified via w2-01 (Sonnet default path) and w2-03 (Opus override path). No regression in the read-only invariant — both runs completed without touching repo source files.

### Finding #11: Canary hard-abort prevents Claude invocation (Patch 5) — SAFETY WIN
The section 5b scan correctly matched `lux-bus.js` in w2-02's prompt, logged a `canary_abort` event with canary_hits, and aborted before the GO prompt. Critically:
- Budget was not incremented (runs_today and runs_this_week unchanged)
- Queue was not popped (w2-02 remained at tasks[0] after abort)
- No git tag created
- No Claude call made

This is the key safety property for Week 3 write-mode enablement. A task that mentions a canary file is refused categorically. Even if write-mode is on, a canary-mention task cannot reach Claude.

### Finding #12: Per-task model override works (Patch 4)
w2-03 carried `"model": "claude-opus-4-6"` on the task object. The supervisor correctly:
- Resolved $taskModel to the override value
- Displayed "(per-task override)" suffix in the banner Model line
- Passed the override to the Claude CLI via `--model $taskModel`
- Logged the actual model used (not the default $MODEL) to run-log.jsonl

The fallback to $MODEL when no override is present was verified by w2-01 (no model field → Sonnet default).

### Finding #13: Early wall-clock data for Opus vs Sonnet on targeted reads
- Sonnet targeted file read: 11.3s (w2-01, line count on scenarios.js)
- Opus targeted file read: 7.0s (w2-03, file size on README.md)

Single data point per model — not a pattern yet. Notable that Opus was faster here, but the tasks differed in complexity (line count vs file size). Re-test with matched tasks in Week 3 if a comparison matters.

### Finding #14: scenarios.js actual path is features/convo/scenarios.js, 657 lines
Meta-finding: the w2-01 prompt assumed the file lived at `public/scenarios.js`. Claude correctly rejected the bad path and reported the real location (`features/convo/scenarios.js`, 657 lines). This validates that Kodama pushes back on hallucinated paths rather than fabricating line counts for nonexistent files — an important property for trusting future output. Kodama is not a yes-machine.

Reference for post-scenario-neutrality-overhaul file size: 657 lines.

## Week 3 readiness checklist

Before enabling write-mode, confirm all of the following:

- [x] All seven Week 2 patches verified live
- [x] Canary hard-abort proven to block Claude invocation
- [x] Per-task model override proven
- [x] Tag `kodama/week-2-patch` pushed to Lux main
- [x] Pre-patch .GOLD preserved at `~\.kodama\supervisor.ps1.GOLD`
- [ ] Week 3 task identified: .GOLD cleanup (28 files, per Finding #7 from Week 1)
- [ ] Week 3 Risk Gate written and signed off
- [ ] Write-mode supervisor invocation pattern chosen (-WriteMode flag on single task, not a global default)
- [ ] First write-mode task has bounded scope (single category, non-canary files only)
- [ ] Commit-or-revert review pattern confirmed: backup → write → diff → human review → commit or revert

## Parked for Week 3+

- Extend canary hard-abort to scan task output (not just input prompt). Currently section 10 only warns on canary mentions in Claude output. In write-mode, output canaries should abort the commit step — warn is insufficient.
- Supervisor currently has no concept of "task success" vs "task failure" beyond exit code. Week 3 should add a review gate between Claude invocation and budget/queue update — if human rejects the output, the budget should still increment (compute was spent) but queue should not advance.
- Consider adding `expected_wall_clock_seconds` hint to task objects, with a soft warning if actual wall-clock exceeds it by some factor. Would have caught the 131s anomaly from Week 1 cal-10 earlier.
