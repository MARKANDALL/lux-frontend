You are auditing the Lux Pronunciation Tool frontend for code health regressions introduced in the last 24 hours of commits. This routine runs nightly. Be surgical, factual, and concise — Mark wants signal, not noise.

SCOPE: Scan all .js, .jsx, .html, and .css files under the repo root. Skip node_modules/, dist/, _ARCHIVE/, _agents-archive/, and any folder starting with an underscore except _api/.

CHECKS (perform all, report only findings — silence on clean checks):

1. RAW LOCALSTORAGE — Find any direct localStorage.getItem, localStorage.setItem, localStorage.removeItem, or localStorage.clear calls outside of helpers/lux-storage.js. All storage access must route through lux-storage.js named key constants.

2. SILENT CATCHES — Find catch blocks that swallow errors without calling warnSwallow(). A "silent catch" is any catch (e) {} or catch block whose body does not invoke warnSwallow or rethrow. helpers/warn-swallow.js is the canonical helper.

3. BROKEN IMPORTS — Find commented-out import statements (lines starting with // import or /* import) AND any import that references a path that does not exist on disk. Flag both.

4. API PATH DRIFT — Find any fetch(), apiFetch(), or string literal referencing "/api/" that should be "/_api/" (the Vercel Hobby 12-function workaround renamed api/ to _api/ in March 2026).

5. MISSING MOUNTS — Find any feature module that defines a mount* function (e.g., mountVoiceMirrorButton) but is never imported by its expected consumer. Cross-reference features/results/summary.js, features/harvard/modal-actions.js, and features/convo/ entry points.

OUTPUT FORMAT:
- Create a markdown file at kodama-reports/nightly/YYYY-MM-DD.md
- Open a draft PR titled "Nightly health scan — YYYY-MM-DD" with that file as the only change
- Then post a comment summary on GitHub issue #22 containing: total findings count by category, link to the PR, and the top 3 most severe findings inline

REPORT STRUCTURE (in the markdown file):
# Nightly Health Scan — YYYY-MM-DD

## Summary
[X] localStorage violations | [X] silent catches | [X] broken imports | [X] api path drift | [X] missing mounts

## Findings
### 1. Raw localStorage outside lux-storage.js
[For each finding: `file/path.js:LINE` — one-sentence description]
[If none: "✅ Clean"]

[Repeat structure for each check category]

## Notes
[Any observations about repo state, e.g., "ARCHITECTURE.md still references api/ not _api/"]

RULES:
- Do not fix anything. Report only.
- Do not flag findings inside _ARCHIVE/, _agents-archive/, node_modules/, or files with .GOLD or .GOLD.N extensions.
- If you find zero issues across all checks, still create the report and PR — say "✅ All checks passed" prominently.
- Be exact about line numbers. If you cite a line, it must be correct.