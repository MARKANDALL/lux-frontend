# R15 · Test Import Autofix

<!-- Path: docs/routines/registry/R15-test-import-autofix.md — Live registry entry for the test import autofix (paused, one-shot purpose fulfilled; fails-closed surgical-autofix template worth preserving). Index at docs/routines/registry/INDEX.md. -->

- **Dashboard name:** R15 · Test Import Autofix *(renamed 2026-04-20; was `lux-test-imports-autofix`)*
- 🟡 Paused · `lux-frontend` · testing · one-shot (purpose fulfilled — keep parked for reference)
- Sundays 9:00 AM EDT (`0 9 * * 0`) · Opus 4.7 (1M) · cron
- **Output:** `kodama-reports/autofix/test-imports-2026-04-16.md` + PR titled "chore: fix broken test imports after api→_api rename (27 lines, 3 files)"
- **Active:** — → — · **Edited:** — · **Last run:** 2026-04-16 16:54 (manual — only run; purpose fulfilled, then paused)
- **Depends on:** —

## Prompt

```
You are a surgical auto-fix agent. Your sole task is a mechanical find-replace across exactly three files in MARKANDALL/lux-frontend.

SCOPE — you may only modify these three files:
- _api/attempts.test.js
- _api/identity.test.js
- _api/util.test.js

THE FIX
Each of these files contains dynamic imports of the form:
  await import("../api/XXX.js")

These paths are stale. In March 2026 the frontend `api/` directory was renamed to `_api/` to work around a Vercel 12-function limit. The imports were never updated, so every test file currently points at a non-existent directory.

Replace every occurrence of the literal string  "../api/  with  "../_api/  — note the leading double-quote is part of the match to avoid collisions with other `api/` references in comments, header strings, etc.

REQUIRED STEPS

1. Read all three files.
2. For each file, count occurrences of "../api/ before editing.
3. Replace every occurrence with "../_api/ — no other changes.
4. Verify the count after editing: every "../api/ must now be "../_api/, and no other line should have changed.
5. Run `npm test` at repo root. Report pass/fail count before and after. Tests may still fail for other reasons (we only fixed imports, not test logic) — that is acceptable, but the count of "cannot find module" errors must drop to zero.
6. Open a PR titled "chore: fix broken test imports after api→_api rename (27 lines, 3 files)". In the PR body, paste:
   - per-file count of replacements (expected ~9, 13, 5 — confirm actuals)
   - before/after test pass counts
   - any tests that were already failing for non-import reasons

HARD CONSTRAINTS
- Do NOT modify any file outside the three listed.
- Do NOT modify any non-test source file.
- Do NOT rewrite test logic, add new tests, or remove existing tests.
- Do NOT touch package.json, vitest config, or CI workflows.
- Do NOT run lint or prettier autofix.
- If you find fewer or more than 27 total replacements across the three files, STOP and report the discrepancy without opening a PR. The discrepancy itself is a signal something changed since the scan.

OUTPUT LOCATION
Findings report: kodama-reports/autofix/test-imports-2026-04-16.md
(Create the autofix/ subfolder if it doesn't exist.)
```

## Notes

One-off auto-fix for the `api/` → `_api/` import drift after the Vercel 12-function-limit rename. Scoped to exactly three files (`_api/attempts.test.js`, `_api/identity.test.js`, `_api/util.test.js`). Expected replacement counts per file: ~9, 13, 5 (27 total).

**Fails closed** — if actual count ≠ 27, stops and reports the discrepancy rather than opening a PR. That "stop on unexpected drift" guard is the pattern most worth lifting into any future surgical-autofix routine.

Keep parked per retire rule — useful template. Next likely reuse: any future "rename X to Y across exactly these files and nothing else" one-shot.

**Template-value summary** — three patterns this prompt teaches that generalize to any surgical-autofix routine:

1. **Explicit scope whitelist.** The prompt names the three files by path and says "you may only modify these three files." Later reinforced by a HARD CONSTRAINTS section that enumerates what NOT to touch. Belt-and-suspenders for blast-radius control.
2. **Pre-count before editing.** Step 2 says count occurrences *before* the find-replace. Step 4 verifies the post-edit count matches. This turns "find-replace" from an open-ended transform into a measurable, verifiable operation.
3. **Fails closed on unexpected deltas.** The `27 ≠ actual ⇒ STOP without PR` rule is the crown jewel. A dumber routine would proceed with "close enough" and open a PR with wrong counts. This one stops and reports — the discrepancy itself becomes a signal that something else changed in the repo since the original scan, which is actually the more valuable finding.

`kodama-reports/autofix/` output path is vestigial.
