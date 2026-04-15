# Kodama Week 3 Risk Gate — First Write-Mode Task (.GOLD Cleanup)

Signed off: 2026-04-14 (end of Week 2 session)
Status: PENDING EXECUTION. Week 3 begins next session.

## Risk level: HIGH

- First time Kodama writes to the Lux repo
- Deletes files (not source code, but still destructive)
- 28 files in scope
- Mitigated by: canary hard-abort (verified Week 2), git tags wrapping each run, human review gate between Claude output and git commit

## Task in plain English

28 `.GOLD` backup files are scattered in the Lux repo from past refactors (Finding #7, Week 1). Delete the subset that is safe to delete: `.GOLD` files where (a) the source file still exists and (b) the source file has not been modified since the `.GOLD` timestamp.

## Module plan

- No edits to `supervisor.ps1`
- One new task added to `tasks-queue.json`
- Task prompt instructs Claude to:
  1. Find all `.GOLD` files in `C:\dev\LUX_GEMINI` (exclude `node_modules/`, `.git/`)
  2. For each, check source file existence and modification time vs. `.GOLD` timestamp
  3. Delete only `.GOLD` files meeting both safety criteria
  4. Report manifest: deleted, kept, why

## Invocation

```powershell
& "$env:USERPROFILE\.kodama\supervisor.ps1" -WriteMode
```

First live exercise of Patch 6 write-mode branch. First `--permission-mode acceptEdits` pass to Claude.

## Safety envelope

1. Canary hard-abort still applies. Task prompt must avoid mentioning any canary filename.
2. Git pre-tag before Claude runs. `git reset --hard kodama/pre-<ts>` restores repo state on any failure.
3. Human review gate before git commit. Supervisor does NOT auto-commit Claude's writes in Week 3.
4. Bounded scope: only `.GOLD` files. No `.js`, `.css`, `.md`, `.json` touched.
5. Dry-run first: `-DryRun -WriteMode` should show `Mode: WRITE-MODE` banner without Claude call.

## Smoke tests (in order)

1. Dry-run with `-WriteMode`: verify banner shows `Mode: WRITE-MODE`, clean exit
2. Live run with `-WriteMode`: Claude deletes safe `.GOLD` files, wall-clock 60–180s expected
3. Manual `git diff kodama/pre-<ts> kodama/post-<ts>`: only `.GOLD` deletions should appear, zero non-`.GOLD` changes, zero canary mentions
4. Manual commit (only if diff clean): `git add -A; git commit -m "chore: .GOLD cleanup via Kodama (week 3)"; git push origin main`

## Where to look if it breaks

- Banner shows `READ-ONLY` despite `-WriteMode` → param block binding issue; verify `[switch]$WriteMode`
- `--permission-mode acceptEdits` rejected → CLI version mismatch; check `claude --version`
- Claude deletes unexpected non-`.GOLD` files → prompt too broad; revert, tighten prompt
- Claude refuses despite safe candidates → prompt too restrictive; adjust and retry
- `git diff` shows changes in canary files → SEVERE, should not be possible; immediate `git reset --hard`, file finding
- Wall-clock > 240s → anomaly; Ctrl+C, investigate

## Revert paths

- Before GO: type anything but GO, supervisor aborts, no harm
- After GO, before commit: `cd C:\dev\LUX_GEMINI; git reset --hard kodama/pre-<ts>`
- After commit (last resort): `git reset --hard HEAD~1; git push --force-with-lease origin main`

## Commit plan after success

```powershell
cd C:\dev\LUX_GEMINI; git add -A; git commit -m "chore: .GOLD cleanup via Kodama (week 3, N files removed)"; git push origin main; git tag -a kodama/week-3-first-write -m "First Kodama write-mode task: .GOLD cleanup. N files removed, zero canary hits, human-reviewed diff."; git push origin kodama/week-3-first-write
```

Replace `N` with actual count of deleted files.

## What this Risk Gate decides

- [x] Scope: 28 `.GOLD` files, safe subset only
- [x] Invocation: `-WriteMode` flag per run, not global default
- [x] Review gate: human inspects diff before commit
- [ ] Prompt wording: DEFERRED to next session. Write destructive prompts with fresh eyes.

## Next-session checklist

1. Re-read this file
2. Draft the exact task prompt (non-canary-mentioning, scope-limited, safe-subset logic)
3. Add task to `tasks-queue.json`
4. Dry-run with `-WriteMode`
5. Live run with `-WriteMode`
6. Inspect diff
7. Commit or revert
8. Write `WEEK-3-FINDINGS.md`
