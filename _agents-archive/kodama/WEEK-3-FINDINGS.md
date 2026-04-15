# Kodama Week 3 Findings

Running log of first write-mode operation. Updated as smoke tests and live runs produce data.
Week 3 scope: first write-mode task (.GOLD cleanup), two real runs, one age-based rule iteration.
Nothing in this file changes `supervisor.ps1`. Week 4 gated on Week 3 completion.

## Run ledger

| Run | Date       | Task ID                     | Wall-clock | Mode       | Model                  | Outcome                                        |
|-----|------------|-----------------------------|------------|------------|------------------------|------------------------------------------------|
| 15  | 2026-04-15 | w3-01-gold-cleanup          | 103.2s     | WRITE-MODE | claude-sonnet-4-6      | First write-mode invocation. 0 deletions — strict same-state-redundancy rule matched no files. Pipeline proven end-to-end. |
| 16  | 2026-04-15 | w3-02-gold-cleanup-age60    | 156.3s     | WRITE-MODE | claude-sonnet-4-6      | Added age-based fallback (>60 days). 8 of 28 files deleted under Rule B, 0 under Rule A, 20 kept. Supervisor crashed on bar-prompt step (input contamination). |

## Findings

### Finding #15: Write-mode pipeline works end-to-end (Patch 6 + Patch 4 verified live)
First real `-WriteMode` invocation. Banner correctly displayed `Mode: WRITE-MODE`. `--permission-mode acceptEdits` passed to Claude CLI without rejection. Claude actually deleted files (8 in run 16) — not just claimed to. File system count confirmed: 28 → 20 .GOLD files. Tag pre/post sequence completed for both runs.

### Finding #16: Strict same-state redundancy rule matches near-zero in active development
Run 15 (w3-01) used only Rule A — "delete if source unchanged since .GOLD". Result: 0 deletions out of 28 candidates. Reason: in an actively-edited repo, every source has been modified since its .GOLD was made. The original safety rule is too strict to be useful as a sole criterion. Conclusion: same-state redundancy is a valid floor, but needs a complementary path.

### Finding #17: Age-based fallback (60-day cutoff) is the practical deletion rule
Run 16 (w3-02) added Rule B: "delete .GOLD if its own timestamp is older than 60 days." Rationale: Git history backs older states. Result: 8 of 28 deleted, all confidently old (Oct 14, 2025 through Dec 3, 2025). Border behavior was correct — Claude held the line at exactly 2026-02-14 cutoff, kept files dated within 25 hours after the cutoff. Future: re-run periodically with same 60-day rolling window.

### Finding #18: .GOLD files are .gitignored — no commit ever needed for cleanup
Discovered after the fact: `.gitignore` line 69 contains `*.GOLD`. This explains why `git status` showed "working tree clean" after 8 real deletions. Implication: the Week 3 Risk Gate's "human review of git diff before commit" review gate did not apply to this category of work — there is no diff to review. The deletions are permanent on disk and Git is correctly silent. Going forward, cleanup of any .gitignored category (`.GOLD`, `_ARCHIVE`, generated files, etc.) does NOT require the commit-or-revert step. The `kodama/pre-<ts>` tag is still the valid revert path if needed (it would restore via filesystem, not via git checkout).

### Finding #19: Supervisor crashes when terminal input is pasted at the bar % prompt
Run 16: at the `Enter current weekly bar % ...` prompt, instead of pressing Enter to skip, multi-command shell text was pasted (`git status; Write-Host ...`). The supervisor passed this string to `[int]$bar_after` on line 160, throwing `InvalidArgument: Cannot convert value to type System.Int32`. The crash occurred after the Claude run completed and after the post-tag was created, but before the budget update and queue pop. State was manually reconciled: budget incremented runs_today 1→2 and runs_this_week 13→14; queue popped w3-02 and bumped completed 14→15.

**Patch 8 candidate (parked for next supervisor patch session):** make `[int]$bar_after` defensive — try-cast or skip on parse failure, default to `$bar_before`. Also: budget update + queue pop should happen BEFORE the bar % prompt, not after, so a crash at this step doesn't leave state inconsistent.

### Finding #20: Wall-clock data — write-mode is comparable to read-mode tree walks
- Run 15 (Rule A only, 28 file inspection): 103.2s
- Run 16 (Rule A + Rule B, 28 file inspection + 8 deletions): 156.3s

Both within the 60–180s prediction window from Week 2 Finding #6. Adding deletions added ~50s to the run, roughly 6s per file deleted. Useful baseline for estimating future cleanup tasks.

## Week 4 readiness checklist

- [x] Write-mode pipeline verified live (real deletions, real tags, real budget tracking)
- [x] Canary hard-abort still in force (was not triggered this week — no canary names in any prompt)
- [x] Tag `kodama/week-3-first-write` pushed to Lux main
- [x] All Week 3 deletions accounted for in run-log.jsonl
- [ ] Patch 8 (bar-prompt defensive parsing + reorder budget update) — supervisor patch session
- [ ] Backend `.GOLD` cleanup (`luxury-language-api` repo) — separate Risk Gate, separate session
- [ ] First non-`.GOLD` write task (silent-catch wrapping, dead code removal, etc.)

## Parked for Week 4+

- Backend `luxury-language-api` repo has many .GOLD and .GOLD.2 files. Different canary list, different scope. Needs its own Risk Gate.
- Consider re-running `w3-02` style cleanup monthly with rolling 60-day cutoff. Could be added to a future "scheduled tasks" feature in the supervisor.
- `_ARCHIVE` directory was correctly excluded today. Future task: review `_ARCHIVE` contents on its own terms — some of it may be worth deleting outright after enough time has passed.
- The single Dec 14, 2025 `index.js.GOLD` deleted in this run was 4 months old. Heavy implication: routine cleanup with monthly cadence would prevent this kind of multi-month accumulation.
