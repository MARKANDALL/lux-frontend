Instructions
You are performing monthly hygiene on the Lux Pronunciation Tool FRONTEND repo (MARKANDALL/lux-frontend). This runs once per month. Focus: cleanup candidates and slow-moving structural concerns. A separate monthly routine covers the backend (luxury-language-api).

SCOPE: Same exclusions as other routines — skip _ARCHIVE/, _agents-archive/, node_modules/, dist/, .vite/, and any folder starting with an underscore except _api/.

CRITICAL DETECTION RULE — READ BEFORE CHECK 1:
Both .gitignore files in the Lux repos list `*.GOLD` as ignored. Any scan using `git ls-files`, `git grep`, or any git-based file enumeration WILL NOT SEE .GOLD files even when they exist on disk. This has caused past routine runs to report "0 .GOLD files" when the actual count on disk was substantially higher. For Check 1 below, you MUST use filesystem enumeration (e.g., recursive directory walk, `find . -name '*.GOLD*'`, or equivalent) — NOT git commands.

CHECKS:

1. .GOLD BACKUP CLEANUP CANDIDATES
   Use FILESYSTEM enumeration (not git — see critical detection rule above) to find every file with extension `.GOLD` or matching `.GOLD.<number>` (e.g., foo.js.GOLD.2) anywhere in the repo, excluding the scope exclusions above.
   For each, report: full path, file size in KB, date last modified, age in days.
   Flag any .GOLD file older than 60 days as a strong cleanup candidate. This matches the age threshold used by the manual one-shot deletion task (any backup older than 60 days is backed by git history at this point — many commits have happened since).
   Track count delta: report total .GOLD count found this run, and note whether the count is higher, lower, or equal to the most recent run (if a prior monthly report exists in kodama-reports/monthly/, compare against it; otherwise just report the current count).
   Self-check before reporting: did you use filesystem enumeration? If you only checked tracked git files, re-run with a filesystem scan — you will have missed gitignored backups.

2. UNUSED DEPENDENCIES
   Read package.json. For each entry in "dependencies" and "devDependencies", grep the repo (including .html, .css, .js, .jsx, .ts, .mjs, vite.config.js, and scripts/) for import, require, or CSS @import statements referencing that package. List any package with zero references as a removal candidate.

   DO NOT flag these as unused (they are used indirectly and require manual review):
   - Any package starting with `@types/` — TypeScript type-only packages
   - Any package that appears in vite.config.js, postcss.config.*, tailwind.config.*, or vercel.json — build-tool plugins
   - Any package whose name appears in package.json "scripts" entries — CLI tools used by npm scripts
   - vite, vitest, @vitejs/*, rollup — core build/test tooling (won't show as imports but are required)

   Self-check before flagging: for each candidate, grep the package.json scripts and config files one more time. Build tool plugins often appear only in configuration, never in source imports.

3. STALE BRANCHES (informational only)
   List all branches in the repo with their last commit date. Flag any branch with no commits in 60+ days.
   DO NOT flag or suggest deleting: main, master, or any branch referenced in open pull requests.
   Do not delete anything. Report is advisory only.

4. ENV VAR DRIFT
   Read .env.example at repo root. If it does not exist, report that fact and skip the rest of this check.
   List any variable referenced in code that is NOT present in .env.example. Check BOTH of these patterns:
   (a) process.env.VARIABLE_NAME  — standard Node/runtime pattern
   (b) import.meta.env.VITE_VARIABLE_NAME  — Vite build-time pattern (these are common in frontend code and will be missed if you only check process.env)
   Also list any variable in .env.example that is never referenced in code.
   Self-check before flagging: did you check both process.env and import.meta.env patterns? Vite-prefixed vars (VITE_*) will only ever appear in import.meta.env, never in process.env.

5. README ACCURACY
   Read README.md at repo root. Verify that commands mentioned in Getting Started, Setup, Development, or Quickstart sections exist in package.json "scripts" (if they are `npm run X` commands) or are valid standalone commands (if they are `npm install`, `git clone`, etc.). Flag mismatches.
   Self-check before flagging: is the README command actually wrong, or just different phrasing for the same outcome? Only flag if a user following the README would hit an actual error.

OUTPUT FORMAT:
- Create kodama-reports/monthly/YYYY-MM.md
- Open a draft PR titled "Monthly hygiene sweep — Month YYYY"
- Comment summary on GitHub issue #24: .GOLD count (with delta vs prior run), unused dep count, stale branch count, env drift count

REPORT STRUCTURE (in the markdown file):
# Monthly Hygiene Sweep — Month YYYY

## Summary
- .GOLD files: [X] total, [Y] older than 60 days (delta from prior run: [+N / -N / no change / first run])
- Unused dependency candidates: [X]
- Stale branches (60+ days): [X]
- Env var drift: [X] in code but not .env.example, [Y] in .env.example but not in code
- README mismatches: [X]

## Findings
### 1. .GOLD backup cleanup candidates
[Table or list: path | size | last modified | age in days]
[If none: "✅ Nothing to clean up"]

[Repeat for each check category]

## Notes
[Any observations worth flagging, e.g., .gitignore changes, new dep patterns, branch structure changes]

RULES:
- REPORT ONLY. Do not delete .GOLD files, branches, dependencies, or anything else. This routine never modifies the working tree.
- For .GOLD cleanup, present as a list Mark can review and act on manually via a separate one-shot task.
- Be willing to say "✅ Nothing to clean up" for any check — false positives are worse than silence.
- For every finding, ask yourself: "what would make this a false positive?" If the answer is any of the conditions in the check's self-check clause, do not flag.
- Be exact about file paths and line numbers. If you cite a path or line, it must be correct.
- Do not flag findings inside _ARCHIVE/, _agents-archive/, node_modules/, dist/, .vite/, or underscore-prefixed folders (except _api/).
