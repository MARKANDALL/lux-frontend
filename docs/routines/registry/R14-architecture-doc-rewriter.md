# R14 — `lux-rewrite-architecture`

<!-- Path: docs/routines/registry/R14-architecture-doc-rewriter.md — Live registry entry for the architecture doc rewriter (paused, ⚠️ Legacy Model — both runs failed, needs diagnostic rerun). Index at docs/routines/registry/INDEX.md. -->

- **Rename →** Architecture Doc Rewriter
- 🟡 Paused · `lux-frontend` · docs · one-shot (purpose fulfilled — keep parked for reference)
- Sundays 2:00 AM EDT (`0 2 * * 0`) · **Legacy Model** ⚠️ (NOT Opus 4.7 — likely root cause of both run failures; see Notes) · cron
- **Output:** overwrites `docs/ARCHITECTURE.md` + draft PR "docs: rewrite ARCHITECTURE.md from actual repo state"
- **Active:** — → — · **Edited:** — · **Last run:** **both manual runs FAILED ❌** — 2026-04-16 17:07 (manual, failed), 2026-04-15 23:15 (manual, failed)
- **Depends on:** —

## Prompt

```
The existing docs/ARCHITECTURE.md is out of date. Generate a completely new, accurate ARCHITECTURE.md by reading the actual repo structure.

PROCESS:
1. List every top-level directory and its purpose (read the files inside to understand, don't guess)
2. Map the import graph: which modules depend on which? What's the boot sequence?
3. Identify the architectural spine: lux-bus.js (pub/sub), lux-storage.js (storage keys), apiFetch (API wrapper), warnSwallow/lux-warn (error visibility)
4. Document the _api/ serverless functions and what each one does
5. Document the features/ folder structure — each subfolder is a feature module
6. Note the HTML entry points: index.html, convo.html, progress.html, wordcloud.html, stream.html, life.html
7. Document the CSS architecture (the lux-*.css naming pattern)
8. Note key conventions: .GOLD backups, _ARCHIVE for deprecated code, _agents-archive for automation history

OUTPUT:
- Create a new docs/ARCHITECTURE.md (overwrite the existing one)
- Open a draft PR titled "docs: rewrite ARCHITECTURE.md from actual repo state"
- The document should be useful to a new developer joining the project — assume they know JavaScript but nothing about Lux

STYLE:
- Use markdown headers, not bullet-point walls
- Include a visual folder tree at the top (text-based, not mermaid)
- Keep it under 300 lines — comprehensive but not bloated
- Reference actual file names and paths, not abstractions
```

## Notes

**Critical model-drift finding — this is the only routine in the fleet configured on Legacy Model.** All other cards run Opus 4.7 (standard or 1M). Both manual runs of R14 failed (Apr 15 23:15 and Apr 16 17:07, both red X).

Almost certainly model-capacity: the prompt asks for whole-repo directory enumeration + import graph mapping + architecture spine write-up, all in a ≤300-line deliverable — a natural Opus 4.7 1M job that Legacy Model would choke on.

**Before retiring or reactivating, upgrade the model to Opus 4.7 1M and run once** to confirm whether failures were model-capacity or prompt-correctness. If the upgrade-and-rerun produces a clean ARCHITECTURE.md, the prompt is preserved as a valid "rewrite any doc" template for future use. If it still fails, the prompt itself needs work. Either way, resolve the model mystery before the failure signal rots into folklore.

Note: `ARCHITECTURE.md` was manually rewritten 2026-04-19, so this routine's one-shot purpose is already served on paper — the value of a rerun is **diagnostic, not productive**. The point of upgrading the model and running once is to verify the prompt shape works, so we can lift it as a template for future "rewrite any doc" routines (Bill of Rights rewriter, Master Idea Catalog rewriter, etc.) — all of which could follow R14's pattern.

One line worth preserving for any future "rewrite from actual state" routine: Step 1's **"read the files inside to understand, don't guess"** — a strong anti-hallucination hedge that keeps the LLM honest about source-of-truth.

Model-mystery resolution is item #6 on the Schedule Calibration queue in `INDEX.md`.
