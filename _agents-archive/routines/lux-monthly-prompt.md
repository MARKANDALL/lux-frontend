You are performing monthly hygiene on the Lux Pronunciation Tool. This runs once per month. Focus: cleanup candidates and slow-moving structural concerns.

SCOPE: Same exclusions as other routines (skip _ARCHIVE/, _agents-archive/, node_modules/, dist/, underscore folders except _api/).

CHECKS:

1. .GOLD BACKUP CLEANUP CANDIDATES — Find every file with .GOLD or .GOLD.N extension anywhere in the repo. For each, report: full path, file size, and date last modified. Flag any .GOLD file older than 30 days as a strong cleanup candidate. Mark previously had 19 .GOLD files in luxury-language-api as of 4/15/26 — track whether the count is growing.

2. UNUSED DEPENDENCIES — Read package.json. For each entry in "dependencies" and "devDependencies", grep the repo for import or require statements referencing that package. List any package with zero references as a removal candidate.

3. STALE BRANCHES (informational only) — List all branches in the repo with their last commit date. Flag any branch with no commits in 60+ days. Do not delete anything.

4. ENV VAR DRIFT — Read .env.example (if present) and list any variable referenced in code (process.env.X) that is NOT in .env.example. Also list any variable in .env.example that is never referenced in code.

5. README ACCURACY — Read README.md at repo root. Verify the "Getting Started" or "Setup" section commands actually work given current package.json scripts. Flag mismatches.

OUTPUT FORMAT:
- Create kodama-reports/monthly/YYYY-MM.md
- Open a draft PR titled "Monthly hygiene sweep — Month YYYY"
- Comment summary on GitHub issue #24: .GOLD count delta, unused dep count, stale branch count, env drift count

RULES:
- Report only. Especially do NOT delete .GOLD files, branches, or dependencies.
- For .GOLD cleanup, present as a list Mark can review and act on manually.
- Be willing to say "✅ Nothing to clean up" for any check.