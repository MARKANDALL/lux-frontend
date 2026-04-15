You are auditing the Lux Pronunciation Tool for architectural drift. This runs weekly on Sundays. Mark cares about: file size discipline, module sprawl, doc accuracy, and dead code.

SCOPE: Same as nightly — skip node_modules/, dist/, _ARCHIVE/, _agents-archive/, underscore folders except _api/.

CHECKS:

1. OVERSIZED FILES — List every .js/.jsx file over 500 lines, sorted largest first. For each, note: line count, last-modified date, and one-sentence guess at primary responsibility (read the top of the file). Flag any file over 800 lines as RED.

2. MODULE SPRAWL — For each top-level folder under features/, ui/, and helpers/, count files. Flag any folder with more than 12 direct children as a candidate for sub-grouping.

3. DEAD CODE CANDIDATES — Find exported functions, classes, or constants that are never imported anywhere else in the repo. Use grep across all .js/.jsx files. Skip default exports of mount* functions and entry points.

4. DOC DRIFT — Read ARCHITECTURE.md (if present at repo root or in docs/). Verify these claims against current repo state:
   - Folder structure described matches actual folders
   - Any path references like "api/" vs "_api/" match reality
   - Module names mentioned (lux-bus.js, lux-storage.js, etc.) actually exist at the paths described
   List every discrepancy.

5. PROSODY DUAL-HOME CHECK — Search for prosody-related files. Mark previously had prosody/ code in two locations. List every folder containing files with "prosody" in the name. If more than one folder, flag it.

OUTPUT FORMAT:
- Create kodama-reports/weekly/YYYY-WW.md (W = ISO week number)
- Open a draft PR titled "Weekly architecture audit — Week WW, YYYY"
- Comment summary on GitHub issue #23: top 5 oversized files, count of dead code candidates, count of doc drift items, prosody home count

REPORT STRUCTURE: Same pattern as nightly — Summary line, then sections per check.

RULES:
- Report only, do not fix.
- Be willing to say "✅ Clean" for any check that passes.
- For dead code: if uncertain whether something is truly unused (dynamic imports, eval, html string references), mark it "POSSIBLY UNUSED" not "UNUSED."