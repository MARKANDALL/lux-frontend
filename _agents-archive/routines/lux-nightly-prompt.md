You are auditing the Lux Pronunciation Tool frontend for code health regressions introduced in the last 24 hours of commits. This routine runs nightly. Be surgical, factual, and concise — Mark wants signal, not noise.

SCOPE: Scan all .js, .jsx, .html, and .css files under the repo root. Skip node_modules/, dist/, _ARCHIVE/, _agents-archive/, and any folder starting with an underscore except _api/.

CHECKS (perform all, report only findings — silence on clean checks):

1. RAW LOCALSTORAGE — Find any direct localStorage.getItem, localStorage.setItem, localStorage.removeItem, or localStorage.clear calls outside of app-core/lux-storage.js. All storage access must route through lux-storage.js named key constants.

2. SILENT CATCHES — Find catch blocks that swallow errors without calling warnSwallow(). A "silent catch" is any catch (e) {} or catch block whose body does not invoke warnSwallow or rethrow. ui/lux-warn.js is the canonical helper.

3. BROKEN IMPORTS — Find commented-out import statements (lines starting with // import or /* import) AND any import that references a path that does not exist on disk. Flag both.

4. URL DRIFT — Find backend-calling URLs in helper files that do not follow the canonical pattern. The canonical pattern, used by every working backend helper in this repo, is:

   import { API_BASE, apiFetch } from "./util.js";
   const SOMETHING_URL = `${API_BASE}/api/route-path`;

Flag a URL literal as drift ONLY if it meets one of these conditions:

(a) Uses `/_api/` anywhere in a URL literal passed to fetch() or apiFetch() (e.g., `/_api/router?...`). The `_api/` prefix is a repo folder name ONLY — no server-side handler exists for `/_api/` URLs in dev (vite.config.js proxies only `/api`) or prod (vercel.json has no rewrite for `/_api/`). Any `/_api/` URL is broken.

(b) Uses a bare `/api/...` path in an actual fetch() or apiFetch() call WITHOUT the `${API_BASE}` prefix. Bare `/api/` paths 404 in production because the frontend domain has no proxy to the backend — only the Vite dev proxy catches them, so it appears to work in dev but breaks when deployed.

DO NOT FLAG (these are correct or not applicable):
- `${API_BASE}/api/...` — this IS the correct canonical pattern for all 12+ backend helpers; flagging it is a false positive
- `/api/` references inside comments (// or /* */), JSDoc blocks, markdown files, console.log strings, or test assertions
- `/api/` in vite.config.js — that IS the proxy prefix and is correct there
- `/api/` inside docs/, kodama-reports/, _agents-archive/, or any .md/.txt file
- Anything inside _ARCHIVE/ or .GOLD/.GOLD.N files

Before flagging, verify the file actually imports apiFetch or uses fetch() — if the `/api/` string is not inside an actual network-call construction, it is not drift.

Self-check: for each finding you are about to report, answer "what would make this a false positive?" If the answer is "it is inside a comment" or "it already has ${API_BASE}", do not flag.

5. MISSING MOUNTS — Find any feature module that defines a mount* function (e.g., mountVoiceMirrorButton) but is never imported by its expected consumer. Cross-reference features/results/summary.js, features/harvard/modal-actions.js, and features/convo/ entry points.

OUTPUT FORMAT:
- Create a markdown file at kodama-reports/nightly/YYYY-MM-DD.md
- Open a draft PR titled "Nightly health scan — YYYY-MM-DD" with that file as the only change
- Then post a comment summary on GitHub issue #22 containing: total findings count by category, link to the PR, and the top 3 most severe findings inline

REPORT STRUCTURE (in the markdown file):
# Nightly Health Scan — YYYY-MM-DD

## Summary
[X] localStorage violations | [X] silent catches | [X] broken imports | [X] url drift | [X] missing mounts

## Findings
### 1. Raw localStorage outside lux-storage.js
[For each finding: `file/path.js:LINE` — one-sentence description]
[If none: "✅ Clean"]

[Repeat structure for each check category]

## Notes
[Any observations about repo state worth knowing]

RULES:
- Do not fix anything. Report only.
- Do not flag findings inside _ARCHIVE/, _agents-archive/, node_modules/, or files with .GOLD or .GOLD.N extensions.
- If you find zero issues across all checks, still create the report and PR — say "✅ All checks passed" prominently.
- Be exact about line numbers. If you cite a line, it must be correct.
