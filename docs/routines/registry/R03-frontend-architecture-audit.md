# R03 — `lux-weekly-architecture-audit`

<!-- Path: docs/routines/registry/R03-frontend-architecture-audit.md — Live registry entry for the weekly frontend architecture audit. Index at docs/routines/registry/INDEX.md. -->

- **Rename →** Frontend Architecture Audit
- 🟢 Active · `lux-frontend` · code-quality · rotating-weekly
- Sundays 4:00 AM EDT (`0 4 * * 0`) · Opus 4.7 (standard, not 1M) · cron
- **Output:** `kodama-reports/weekly/YYYY-WW.md` (ISO week) ⚠️ vestigial path + draft PR "Weekly architecture audit — YYYY week WW" + comment on **issue #23**
- **Active:** 2026-04-14 → — · **Edited:** — · **Last run:** 2026-04-19 04:06 (scheduled — Sunday, first scheduled fire under current sequential-execution prompt) — also 2026-04-16 16:56 (manual), 2026-04-15 22:28 (manual)
- **Depends on:** —

## Prompt

```
ACTIVITY GATE (run FIRST):
Run `git log --since="7 days ago" --name-only --pretty=format:"" | sort -u | grep -v '_agents-archive\|kodama-reports\|\.md$'`
If the output is empty, write the report file with just:
# Weekly Architecture Audit — YYYY-WW
## Summary
✅ No substantive code changes in the last 7 days. No audit performed.
Still open the draft PR so the skip is visible. Exit here. Do NOT run the checks below.

You are performing a weekly architecture audit on the Lux Pronunciation Tool FRONTEND (MARKANDALL/lux-frontend).

The previous version of this routine ran 5 checks in parallel sub-agents and timed out (API Error: Stream idle timeout on 2026-04-15). THIS version runs sequentially — do one check at a time, fully, before moving to the next. No parallel sub-agents under any circumstances.

SCOPE: Scan .js, .jsx, .html, .css. Skip node_modules/, dist/, .vite/, _ARCHIVE/, _agents-archive/, underscore folders except _api/.

CHECKS (run sequentially):

1. OVERSIZED FILES — List files over 500 lines (JS) or 800 lines (CSS). For each: line count, one-line description. Identify top 3 refactor candidates per Mark's Refactor Constitution v2 (target ~200±100 lines, ≤6 modules per feature area).

2. MODULE SPRAWL — For each feature folder under features/, count files. Flag any folder with more than 15 files as having sprawl. Also check app-core/, core/, helpers/, ui/ — these should stay small and tight.

3. DOC DRIFT — Compare docs/ARCHITECTURE.md against actual repo structure. List directories mentioned in ARCHITECTURE.md that no longer exist on disk, and top-level directories that exist but are not mentioned.

DROPPED FROM PRIOR VERSION (these caused timeouts):
- Dead code detection (too speculative to be reliable in a time-boxed routine)
- Prosody dual-home check (phase-specific from March 2026, resolved)
- Deep dependency graph analysis (too expensive)

Self-check per finding: is this a known stable pattern (e.g., lux-bus.js being large because it's a central hub)? If yes, note it but don't treat as actionable.

OUTPUT:
- Create kodama-reports/weekly/YYYY-WW.md (WW = ISO week number)
- Draft PR titled "Weekly architecture audit — YYYY week WW"
- Comment summary on GitHub issue #23

REPORT STRUCTURE:
# Weekly Architecture Audit — YYYY Week WW
## Summary
- Oversized files: [X]
- Feature folders with sprawl: [X]
- ARCHITECTURE.md drift: [X]
## Findings
[Per check]
## Notes
[Stable patterns noted but not flagged]

RULES:
- Sequential. No parallel sub-agents. No concurrent tool calls where avoidable.
- Keep report under 2000 words.
- Report only. No fixes.
- If a check returns nothing, say "✅ Clean" and move on.
```

## Notes

**Post-mortem-shaped prompt.** The routine explicitly documents its own prior failure mode in-prompt: "The previous version of this routine ran 5 checks in parallel sub-agents and timed out (API Error: Stream idle timeout on 2026-04-15). THIS version runs sequentially."

Three dropped checks are listed verbatim — dead code detection, prosody dual-home check, deep dependency graph analysis — preserving institutional memory across rewrites. That "DROPPED FROM PRIOR VERSION" block is a pattern worth copying to any future prompt revision: capture the reason alongside the removal so a future operator doesn't re-add them.

Three remaining checks: oversized files (JS >500 lines, CSS >800 lines) with Refactor Constitution v2 targets (~200±100 lines, ≤6 modules per feature area), module sprawl (feature folders >15 files), doc drift (ARCHITECTURE.md vs actual disk).

Hard report cap: **2000 words** — explicit, unusual, keeps the deliverable useful.

The "**no parallel sub-agents under any circumstances**" directive is the single most portable Operating lesson in the fleet — worth lifting to `CLAUDE_ROUTINES_PLAYBOOK.md` as a "sequential by default" anti-pattern warning.

Today's 04:06 scheduled fire is the first under the sequential rewrite — worth pulling the report to confirm the rewrite actually cleared the timeout.

Posts to **issue #23** (Architecture Tracker), which R12 also posts to per its prompt — collision noted in INDEX.md Path-to-closing-the-gap §9.

Model is Opus 4.7 **standard, not 1M** — three-check weekly sweep is bounded.

`kodama-reports/weekly/` output path is vestigial.
