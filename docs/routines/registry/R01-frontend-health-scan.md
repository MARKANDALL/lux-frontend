# R01 · Frontend Health Scan

<!-- Path: docs/routines/registry/R01-frontend-health-scan.md — Live registry entry for the frontend nightly health scan. Index at docs/routines/registry/INDEX.md. -->

- **Dashboard name:** R01 · Frontend Health Scan *(renamed 2026-04-20; was `lux-nightly-health-scan`)*
- 🟢 Active · `lux-frontend` · code-quality · core-every-night
- Daily 3:33 AM EDT (`33 3 * * *`) · Opus 4.7 (1M) · cron
- **Output:** `kodama-reports/nightly/YYYY-MM-DD.md` ⚠️ vestigial path + draft PR "Nightly health scan — YYYY-MM-DD" + comment on **issue #22** (top 3 findings inline + PR link + Top Priority line)
- **Active:** 2026-04-14 → — · **Edited:** — · **Last run:** 2026-04-19 03:33 (scheduled) — recent history: 2026-04-18 20:17 (manual), 2026-04-18 03:34 (scheduled — **⚠️ icon differs from green-check successes, likely failed/cancelled/timed-out**, see Notes), 2026-04-17 03:41 (scheduled), 2026-04-16 16:55 (manual), 2026-04-16 03:36 (scheduled); more history available via "Load more"
- **Depends on:** —

## Prompt

```
You are auditing the Lux Pronunciation Tool frontend for code health regressions introduced in the last 24 hours of commits. This routine runs nightly. Be surgical, factual, and concise — Mark wants signal, not noise.

ACTIVITY GATE (run this FIRST — if no work, stop early):
Run `git log --since="24 hours ago" --name-only --pretty=format:""` and filter out changes that ONLY touch files in these paths:
- _agents-archive/
- kodama-reports/
- *.md files (docs-only changes)

If the filtered list is empty, write the report file with just:
# Nightly Health Scan — YYYY-MM-DD
## Summary
✅ No substantive code changes in the last 24 hours. No scan performed.

Still open the draft PR as usual so the skip is visible. Exit here. Do NOT run the checks below.

SCOPE: Scan all .js, .jsx, .html, and .css files under the repo root. Skip node_modules/, dist/, _ARCHIVE/, _agents-archive/, and any folder starting with an underscore except _api/.

LEGACY CODE FILTER:
Before flagging any file in a check below, run `git log -1 --format=%cr <file>` to check last-modified time. If the file has NOT been modified in the last 30 days AND the issue would otherwise be flagged, DO NOT put it in main findings. Instead, append it to a "## Legacy Backlog" section at the bottom of the report. This prevents stale issues from re-surfacing in daily findings forever.

CHECKS (perform all, report only findings — silence on clean checks):

1. RAW LOCALSTORAGE — Find any direct localStorage.getItem, localStorage.setItem, localStorage.removeItem, or localStorage.clear calls outside of app-core/lux-storage.js. All storage access must route through lux-storage.js named key constants.

EXCLUSIONS: _api/identity.js and _api/util.js are legacy key-owner files; their localStorage calls are intentional and should NOT be flagged. Document this in the report footer if you skip them.

2. SILENT CATCHES — Find catch blocks that TRULY swallow errors. A true silent catch has a body that is ONLY one of: empty, `return null;`, `return;`, `return undefined;`, `/* ignore */`, or equivalent.

DO NOT FLAG these catch patterns (all legitimate):
- `catch (err) { warnSwallow(...) }` — using the canonical helper ✓
- `catch { return fallbackValue; }` — graceful fallback pattern ✓
- `catch (e) { console.warn(...); return null; }` — logged and fallback ✓
- Any catch in `ui/lux-warn.js` itself (the logger's own error handling is by design)
- `throw` statements inside catch (rethrows with transformation)

A catch block is silent if AND ONLY IF: (a) no function is called inside it, (b) no throw, (c) no console.* call. The presence of a `return` is not sufficient to call it silent — the discarding of context is what makes it silent.

3. BROKEN IMPORTS — Find commented-out import statements (lines starting with // import or /* import) AND any import that references a path that does not exist on disk. Flag both.

4. URL DRIFT — Find backend-calling URLs in helper files that do not follow the canonical pattern. The canonical pattern, used by every working backend helper in this repo, is:

   import { API_BASE, apiFetch } from "./util.js";
   const SOMETHING_URL = `${API_BASE}/api/route-path`;

Flag a URL literal as drift ONLY if it meets one of these conditions:

(a) Uses `/_api/` anywhere in a URL literal passed to fetch() or apiFetch() (e.g., `/_api/router?...`). The `_api/` prefix is a repo folder name ONLY — no server-side handler exists for `/_api/` URLs in dev (vite.config.js proxies only `/api`) or prod (vercel.json has no rewrite for `/_api/`). Any `/_api/` URL is broken.

(b) Uses a bare `/api/...` path in an actual fetch() or apiFetch() call WITHOUT the `${API_BASE}` prefix. Bare `/api/` paths 404 in production because the frontend domain has no proxy to the backend — only the Vite dev proxy catches them, so it appears to work in dev but breaks when deployed.

BEFORE FLAGGING ANY URL DRIFT FINDING, perform this mandatory 3-step check:

Step 1 — Get the full line and 3 lines above it with `sed -n '<line-3>,<line>p' <file>`.
Step 2 — Check if the line is inside a comment. A line is "inside a comment" if ANY of these are true:
  - The line itself starts with `//` or `*` (block comment continuation) or the URL is after `//` on that line
  - One of the 3 preceding lines contains `/**` or `/*` without a matching `*/` before the URL line
  - The URL is inside a template string literal that is itself being passed to console.log/warn/error
Step 3 — Check if the line is inside an actual network call. Use grep to confirm the URL is an argument to `fetch(`, `apiFetch(`, `XMLHttpRequest`, or similar. If the URL is just a string constant assigned to a variable that is never passed to fetch, do NOT flag.

If the 3-step check is unsure, DO NOT FLAG. False positives are worse than missed findings.

DO NOT FLAG (these are correct or not applicable):
- `${API_BASE}/api/...` — this IS the correct canonical pattern for all 12+ backend helpers
- `/api/` references inside comments (// or /* */), JSDoc blocks, markdown files, console.log strings, or test assertions
- `/api/` in vite.config.js — that IS the proxy prefix and is correct there
- `/api/` inside docs/, kodama-reports/, _agents-archive/, or any .md/.txt file
- Anything inside _ARCHIVE/ or .GOLD/.GOLD.N files

5. MISSING MOUNTS — Find any feature module that defines a mount* function (e.g., mountVoiceMirrorButton) but is never imported by its expected consumer. Cross-reference features/results/summary.js, features/harvard/modal-actions.js, and features/convo/ entry points.

FINDINGS CAP:
Report a maximum of 10 findings total across all categories in the main findings section. If there are more than 10, pick the highest-severity 10 and add a "## Additional Findings" section listing the rest by file:line only (no descriptions). A flood of findings is low-signal; prioritize.

OUTPUT FORMAT:
- Create a markdown file at kodama-reports/nightly/YYYY-MM-DD.md
- Open a draft PR titled "Nightly health scan — YYYY-MM-DD" with that file as the only change
- Post a comment summary on GitHub issue #22 containing: total findings count by category, link to the PR, top 3 most severe findings inline, AND the "Top Priority" line (see below)

REPORT STRUCTURE (in the markdown file):
# Nightly Health Scan — YYYY-MM-DD

## Summary
[X] localStorage violations | [X] silent catches | [X] broken imports | [X] url drift | [X] missing mounts

## Top Priority
[ONE sentence: the single most important finding you'd personally look at first, or "None — all findings are advisory." If a finding is genuinely HIGH severity (broken production path, security issue), say so in bold.]

## Findings
### 1. Raw localStorage outside lux-storage.js
[For each finding: `file/path.js:LINE` — one-sentence description]
[If none: "✅ Clean"]

[Repeat structure for each check category]

## Legacy Backlog
[Issues in files not modified in the last 30 days, listed by file:line only.]
[If none: "✅ None"]

## Notes
[Any observations about repo state worth knowing]

RULES:
- Do not fix anything. Report only.
- Do not flag findings inside _ARCHIVE/, _agents-archive/, node_modules/, or files with .GOLD or .GOLD.N extensions.
- If you find zero issues across all checks, still create the report and PR — say "✅ All checks passed" prominently.
- Be exact about line numbers. If you cite a line, it must be correct. Do NOT guess or approximate.
- When uncertain about a finding, err on the side of NOT flagging. False positives damage signal.
```

## Notes

Highest-frequency cadence in the fleet alongside R02 — together they anchor the daily-signal tracker at issue #22. Five checks: raw localStorage, silent catches, broken imports, URL drift (with **mandatory 3-step false-positive check before flagging**), missing mounts. The URL drift check is the most sophisticated piece of logic in any routine prompt — encodes the full canonical pattern (`import { API_BASE, apiFetch } from "./util.js"; const SOMETHING_URL = \`${API_BASE}/api/route-path\`;`) and flags two distinct production-breakage patterns: (a) `/_api/` URL literals in actual fetch calls (no server-side handler exists — `_api/` is a repo folder name, not a proxy prefix; vite.config.js only proxies `/api` and vercel.json has no `/_api/` rewrite) and (b) bare `/api/...` paths without `${API_BASE}` (404 in prod because the frontend domain has no backend proxy; Vite dev proxy catches them so they appear to work locally).

**Legacy filter:** files untouched in 30 days route to `## Legacy Backlog` instead of main findings — prevents stale issues from re-surfacing forever.

Explicit exclusions worth preserving: `_api/identity.js` and `_api/util.js` are legacy key-owner files whose `localStorage` calls are intentional. Findings cap 10 with overflow to `## Additional Findings` (file:line only).

**~~Run-status anomaly Apr 18 03:34.~~ ✅ RESOLVED 2026-04-20.** Investigated during Tier B Schedule Calibration. Run was stuck in "Pondering..." state since Apr 18 (never reached tool-call phase, no error output, Cancel button unresponsive — zombie session). Surrounding runs all succeeded (Apr 17, 19, 20). Diagnosis: Anthropic-side infrastructure hang, not a prompt issue. No prompt changes required. If similar zombie runs appear and become recurring, escalate as a capacity/infra complaint rather than a prompt fix.

`kodama-reports/nightly/` output path is vestigial.
