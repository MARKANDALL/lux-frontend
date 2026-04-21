# R20 · Subfolder README Generator

<!-- Path: docs/routines/registry/R20-subfolder-readme-generator.md — Live registry entry for the one-shot subfolder README generator. Index at docs/routines/registry/INDEX.md. -->

- **Dashboard name:** R20 · Subfolder README Generator *(created 2026-04-20)*
- 🟢 Active · `lux-frontend` · docs · one-shot
- Daily 11:00 PM UTC (`0 23 * * *`) · Opus 4.7 (1M) · cron *(parked schedule — intended to run once via manual trigger, then pause)*
- **Output:** one README.md per meaningful subfolder + draft PR "docs: generate README.md for every meaningful subfolder" + comment on issue "Subfolder README Tracker (R20)" (creates if missing)
- **Active:** 2026-04-20 → TBD · **Edited:** 2026-04-20 · **Last run:** —
- **Depends on:** —

## Prompt

```
UTILITY GATE — run FIRST. If any skip condition is true,
stop and do not proceed. Do NOT read any source file,
do NOT grep, do NOT scan until this gate clears.

Routine ID:     lux-subfolder-readme-generator
Input globs:    (whole repo)

0. FORCE CHECK — honor explicit overrides.
   If either of these is true, delete .routine-state/lux-subfolder-readme-generator.sha,
   skip all SKIP gates below, and proceed to a full baseline scan:

   a. `git log -1 --format=%B HEAD | grep -q '\[force-scan\]'`
   b. `[ -f .routine-state/lux-subfolder-readme-generator.force ]`

1. last_sha = `cat .routine-state/lux-subfolder-readme-generator.sha 2>/dev/null || echo ""`
   curr_sha = `git rev-parse HEAD`

2. SKIP A — same commit since last run:
   If last_sha == curr_sha:
     → write skip stub, EXIT.

3. If last_sha is empty: first run — proceed to step 5 (full baseline).

4. SKIP B — no meaningful changes:
   changed = `git diff --name-only $last_sha HEAD 2>/dev/null | grep -v '_agents-archive/\|kodama-reports/\|\.GOLD$\|\.md$'`
   If changed is empty:
     → write curr_sha to .routine-state/lux-subfolder-readme-generator.sha
     → write skip stub, EXIT.

5. Proceed. At end of successful run, write curr_sha to .routine-state/lux-subfolder-readme-generator.sha.

Skip stub template:
# Subfolder README Generator — YYYY-MM-DD
## Summary
✅ No meaningful changes since last run (HEAD @ <short-sha>). No READMEs generated.
Still open the draft PR so the skip is visible.

====================================================================

You are generating README.md files for every meaningful subfolder in the Lux Pronunciation Tool frontend (lux-frontend). This is a ONE-SHOT routine — after this run succeeds, it will be paused indefinitely.

GOAL: A new developer opening ANY folder in this repo should see a README.md that tells them, in under 2 minutes of reading:
- What this folder's purpose is
- What the 3-5 most important files inside do
- Any conventions or gotchas specific to this folder
- Where it sits in the broader architecture

SCOPE — generate READMEs for these top-level folders:
- _api/              (Vercel serverless endpoints)
- app-core/          (architectural spine: bus, storage, runtime, state)
- core/              (scoring, prosody — shared business logic)
- features/          (feature modules — each subfolder gets its own README)
- helpers/           (shared utilities)
- scripts/           (build-time scripts)
- src/               (Vite entry points per page)
- tests/             (Vitest protection-ring tests)
- tools/             (dev tools, proxies)
- ui/                (UI components, warp-core, auth-dom, lux-warn)
- public/            (static assets — brief README, not exhaustive)
- admin/             (admin pages)
- prosody/           (prosody rendering)
- _parts/            (CSS fragments — brief README explaining the pattern)
- docs/              (SKIP — docs/ already has its own docs structure)

FOR features/ SPECIFICALLY: also generate a README in each direct subfolder of features/ (balloon, convo, dashboard, harvard, interactions, life, my-words, next-activity, onboarding, passages, practice-highlight, progress, recorder, results, streaming, voice-mirror). Each features/<name>/README.md should describe that specific feature module.

SKIP THESE FOLDERS ENTIRELY:
- node_modules/
- .vercel/
- dist/
- _ARCHIVE/ (archived code — no README needed)
- _agents-archive/ (already has its own README)
- .routine-state/
- any folder starting with a dot

PROCESS:

1. List the target folders from the SCOPE above that actually exist in the repo.
2. For each folder, read between 2 and 8 representative files inside it (prioritize index.js, the main module, and any file with "core" or "main" in its name).
3. Write a README.md with this structure:
```

## Notes

**Created 2026-04-20 during Stage 3 routine drafting.** First new routine since Anthropic Routines launched Apr 14. Chosen as the "warmup" routine for the new drafting pass: simplest shape (read-only scan + write-files + single PR output), no external dependencies, no connectors.

**Intended lifecycle:** run once via manual trigger, produce one big PR with ~15-25 new README files across top-level folders and `features/` subfolders, merge the PR, then pause R20 indefinitely. Keep configured for reference — the prompt is reusable as a template for future "one-shot doc generation" routines.

**Utility Gate v2 applied from day one** — SHA-pinned, idempotent. If accidentally re-triggered on the same commit, writes a skip stub instead of regenerating. First run bypasses the gate naturally (empty state file = full scan).

**Why this pattern matters for the fleet:** one-shot routines that generate bulk documentation are a natural fit for Claude Code Routines. Same pattern could later be applied to: "README for every _api/ route," "JSDoc for every exported function in app-core/," "migration guide for every deprecated module." R20 is the proof-of-concept.

**Failure-mode hedges baked into the prompt:**
- Honesty clause: "If unsure about what a folder does, write: 'Purpose: unclear from file contents — author review requested.'"
- Do-not-invent clause: "Reference ACTUAL filenames you read — do not invent files."
- Stale-README respect: existing READMEs are read first; only overwritten if clearly stale.
- Write-files-only: "Do NOT modify any code files. READMEs only."

**Post-run checklist (after the PR is reviewed):**
1. Merge the PR.
2. Pause R20 on the dashboard.
3. Update this file's status line: `🟢 Active` → `🟡 Paused`.
4. Update this file's `Active:` line with the retire-to-paused date.
5. Commit the registry update.

**Model choice:** Opus 4.7 1M because the routine enumerates the entire repo and reads 2-8 files per folder across 15-25 folders. That's 30-200 file reads + 15-25 synthesis passes in a single run — large-context territory.