# R05 · Frontend Performance Budget

<!-- Path: docs/routines/registry/R05-frontend-performance-budget.md — Live registry entry for the weekly frontend performance budget check. Index at docs/routines/registry/INDEX.md. -->

- **Dashboard name:** R05 · Frontend Performance Budget *(renamed 2026-04-20; was `lux-frontend-performance-budget`)*
- 🟢 Active · `lux-frontend` · perf · rotating-weekly
- Saturdays 4:00 AM EDT (`0 4 * * 6`) · Opus 4.7 (1M) · cron
- **Output:** `kodama-reports/performance/YYYY-MM-DD.md` + draft PR "Performance budget check — YYYY-MM-DD" + comment on issue "Performance Budget Tracker" (creates if missing)
- **Active:** — → — · **Edited:** — · **Last run:** 2026-04-18 04:06 (scheduled) — also 2026-04-16 17:06 (manual)
- **Depends on:** —

## Prompt

```
ACTIVITY GATE (run FIRST):
Run `git log --since="7 days ago" --name-only --pretty=format:"" | sort -u`

If the output is ENTIRELY empty (zero files changed in any way), write:
# Performance Budget Check — YYYY-MM-DD
## Summary
✅ Zero repo changes in the last 7 days. No budget check performed.

Open the draft PR. Exit.

If ANY file changed (including docs, config, package.json), proceed with the check. Performance regressions can come from any change.

You are performing a weekly performance budget check on the Lux Pronunciation Tool frontend. STATIC ANALYSIS ONLY — no lighthouse runs, no bundle builds, no network requests.

SCOPE: Scan .js, .jsx, .css, .html. Skip node_modules/, dist/, _ARCHIVE/, _agents-archive/, underscore folders except _api/.

CHECKS:

1. OVERSIZED JS FILES — List files over 500 lines. For each: line count, one-line summary of what the file does (read top-of-file comment or first export). Don't recommend splits for cohesive domain files — some files are legitimately large.

2. OVERSIZED CSS FILES — List .css files over 800 lines. Note whether each is authored or a rollup (e.g., lux-layout.COMBINED.css is a generated combined file — flag separately with a note, not as drift).

3. EAGER IMPORTS OF HEAVY MODULES — Top-level (non-lazy) imports of:
   - wavesurfer.js
   - Three.js (three)
   - Plotly
   - D3
   - tensorflow or tensorflowjs
   - Any feature entry importing 20+ other modules at the top of src/main.js or main.js that could be `import()`-lazy

   A "heavy" import only matters if it's loaded during initial page load. If it's already inside a function body or dynamic import(), it IS already lazy — don't flag.

4. DUPLICATE UTILITY FUNCTIONS — Functions with the same name defined (not just imported) in 3+ different files. Common offenders: escapeHtml, clamp, debounce, formatDate, throttle. Flag as candidates for consolidation.

5. IMAGE ASSETS WITHOUT OPTIMIZATION — .png or .jpg under public/ larger than 200KB. These should likely be WebP. Skip .mp4 / video formats.

DO NOT FLAG:
- Config files (vite.config.js, package.json, etc.) regardless of size
- Generated rollup files — flag separately with note
- Files under the size thresholds
- Lazy-imported heavy modules

Self-check per finding: "would fixing this meaningfully improve initial load time or bundle size?" If the answer is "maybe, marginally," severity = LOW.

OUTPUT:
- Create kodama-reports/performance/YYYY-MM-DD.md
- Draft PR titled "Performance budget check — YYYY-MM-DD"
- Summary comment on GitHub issue titled "Performance Budget Tracker" (create if missing)

REPORT STRUCTURE:
# Performance Budget Check — YYYY-MM-DD
## Summary
- Oversized JS files: [X]
- Oversized CSS files: [X]
- Eager heavy imports: [X]
- Duplicate utility candidates: [X]
- Unoptimized images: [X]
## Findings
[Per check]
## Notes
[Trends vs prior reports — getting heavier or lighter]

RULES:
- Report only. Static analysis only.
- Do NOT run lighthouse, bundlers, or anything that compiles/fetches.
- Be exact with line counts and file sizes.
```

## Notes

Has an explicit activity gate — `git log --since="7 days ago"` empty ⇒ writes a short "zero changes" stub and exits. Copy this gate pattern to any weekly routine where no-change weeks should be effectively free.

Thresholds: JS >500 lines, CSS >800 lines, images >200KB. Heavy-import watchlist: wavesurfer.js, three, Plotly, D3, tensorflow/tensorflowjs.

Two runs observed so far (Apr 16 manual, Apr 18 scheduled) — first real weekly fire landed clean.

`kodama-reports/performance/` output path is vestigial.
