# Master Idea Catalog Extractions (2026-04-19)

> **Purpose:** During the 2026-04-19 pass on `docs/LUX_MASTER_IDEA_CATALOG.md` (v6 → v6.1), this document tracks every change — both **outbound** (parking-lot items sorted into phases, obsolete content updated) and **inbound** (feature ideas synced in from other docs). Full provenance preserved so nothing is silently moved or lost.
>
> **Companion docs:** `docs/ARCHITECTURE_EXTRACTIONS_2026-04-19.md` and `docs/BILL_OF_RIGHTS_EXTRACTIONS_2026-04-19.md` (from earlier today's passes).
>
> **Key difference from the first two extractions docs:** the ARCHITECTURE and Bill of Rights passes were about **pulling audit-shaped content OUT** of scaffolding docs. This catalog pass is different — the catalog is already the right kind of doc, but it had (a) a messy parking lot that needed sorting, (b) obsolete references, and (c) feature ideas that were living in the audit instead of here. So this pass is mostly **inbound sync** and **internal cleanup**, not outbound extraction.
>
> **Disposition key:**
> - **INTERNAL SORT** — moved from catalog's own parking lot into the appropriate phase
> - **INBOUND SYNC FROM AUDIT** — feature idea pulled from audit into catalog (source copy stays in audit for per-page context)
> - **OBSOLETE UPDATE** — outdated reference replaced with current reality
> - **NO ACTION** — reviewed, decided to leave alone

---

## C1 — Obsolete: "OpenClaw agent for nightly codebase cleaning"

**Source:** `docs/LUX_MASTER_IDEA_CATALOG.md` line 649 (Ongoing → Code Quality section)

**Original content (verbatim):**

> 🟡 **Set up OpenClaw agent for nightly codebase cleaning:** Automated nightly agent that scans for dead code, unused imports, orphaned files, and other hygiene issues — catches drift before it accumulates. Keeps the codebase lean without relying on manual sweeps.

**Status:** **OBSOLETE UPDATE**

**Action taken:** Replaced with current-reality description. OpenClaw/Simoishi/Kodama were archived in April 2026 when Claude Code Routines launched. The nightly-hygiene goal is now served by routines #1 (nightly health scan → issue #22), #2 (weekly architecture audit → issue #23), #3 (monthly hygiene → issue #24), and #5 (deep code review).

**New content (in v6.1):**

> ✅ **Nightly codebase hygiene automation** *(superseded by Claude Code Routines — April 2026)*: The original OpenClaw/Simoishi/Kodama agent systems have been archived in `_agents-archive/`. Claude Code Routines now handle this via routines #1 (nightly health scan → issue #22), #2 (weekly architecture audit → issue #23), #3 (monthly hygiene → issue #24), and #5 (deep code review). See `docs/routines/CLAUDE_ROUTINES_BACKLOG.md` and `docs/routines/LUX_ROUTINES_FROM_CATALOG.md`.

**Reasoning:** The ✅ emoji marks this as goal-achieved, not a dropped idea. The goal (automated nightly codebase hygiene) is fully operational — just via a different mechanism than originally imagined. Preserves the historical context while telling the current reader the truth.

---

## C2 — INTERNAL SORT: Alt-meaning tooltip polish (parking lot → Phase 3.7)

**Source:** `docs/LUX_MASTER_IDEA_CATALOG.md` line 791 (bottom parking lot, under "I'M GOING TO START TO JUST DROP IN IDEAS" header)

**Original content (verbatim):**

> Alt-meaning tooltip polish (deferred 2026-04-16). Feature works as of fix-alt-meaning-proper-2026-04-16. Three UX improvements batched for later: remove ARPAbet phoneme line ("Alt 1/2: P R AH0 D UW1 S") — redundant with the pill itself; replace native title tooltip with custom HTML/CSS popover so font size can be controlled; pre-fetch on mount so first hover shows real content instead of "(Hover to load meaning + example)" placeholder. Scope: rewrite formatAltTitle → mountAltTooltip in features/results/syllables/alt-meaning.js, add lux-alt-tooltip.css. Est. 2-3 hours.

**Disposition:** **INTERNAL SORT → Phase 3.7 (Phoneme & Word Display Polish)**

**Action taken:** Moved into Phase 3.7 as a 🟡 bullet. Formatting polished (file paths in backticks, git tag in backticks). Priority tag added (🟡). "(Sorted from parking lot 2026-04-19.)" citation added at end.

**Reasoning:** This is a specific, scoped UI polish task on the phoneme/syllables display. Phase 3.7 "Phoneme & Word Display Polish" is the natural home. The specific feature (alt-meaning tooltip) is a subset of the broader "Phoneme tooltips with L1 translations" bullet already in 3.7, so it sits naturally alongside that context.

---

## C3 — INTERNAL SORT: Universal Custom Tooltip Replacement (parking lot → Phase 3.7)

**Source:** `docs/LUX_MASTER_IDEA_CATALOG.md` lines 793–799 (bottom parking lot)

**Original content (verbatim, reflowed):**

> #N — Universal Custom Tooltip Replacement (Project-Wide Native title Audit)
>
> The problem: Several places in Lux still surface information via the browser's native title attribute or browser-default hover tooltip. These are the small, cramped, default-font boxes that appear on hover — unstylable, platform-inconsistent (Windows looks different from macOS), delayed by OS-level timing the user can't customize, and invisible to many accessibility tools. The most obvious current example is the alt-meaning tooltip in the syllables column, where stress-shift meanings like "record (noun)" vs. "record (verb)" appear in a native title attribute showing raw ARPAbet phoneme strings (P R AH0 D UW1 S) that users don't understand.
>
> The scope: This is suspected to exist in multiple places across the project — not just alt-meaning. Likely suspects include phoneme hover tooltips in results table, help icons on knobs drawers, info tooltips in the AI Coach panel, some admin page form hints, convo scenario descriptors. Full audit needed.
>
> The fix: Replace every native title="…" that's acting as a visible hover hint with the existing custom popover system (lux-popover.js / lux-popover.css — already used elsewhere in the project). Design tokens already exist. No new CSS architecture needed — just consistent adoption.
>
> Why it matters: These tiny default tooltips are visual papercuts. Users see a polished interface, hover over something, and get a 1998-era Windows hint box. It's jarring, breaks immersion, and undermines the quality signal the rest of the UI sends. For a pronunciation-learning app whose users often have low-confidence English, every moment of "what is this saying to me?" friction compounds.
>
> Effort: ~2-3 hours for a full audit + replacement. Could be phased.
> Priority: Not urgent. Queue for polish phase / pre-launch aesthetic pass.

**Disposition:** **INTERNAL SORT → Phase 3.7 (Phoneme & Word Display Polish)**

**Action taken:** Condensed into a single 🟡 bullet in Phase 3.7. Preserved all key content (problem description, scope, fix, why-it-matters, effort estimate). Added cross-reference to the companion routine ("Native-Title Audit") in `docs/routines/LUX_ROUTINES_FROM_CATALOG.md` that can do the initial grep pass. Citation: "(Sorted from parking lot 2026-04-19.)"

**Reasoning:** The broader "replace all native title tooltips" task is a natural superset of C2 (alt-meaning tooltip polish), so they belong in the same phase adjacent to each other. The existing Native-Title Audit routine in `LUX_ROUTINES_FROM_CATALOG.md` can provide the input data; the catalog entry captures the feature-side response.

---

## C4 — INTERNAL SORT (with deduplication): Network Waterfall + 2G Throttle Audit (parking lot → Phase 3.8)

**Source:** `docs/LUX_MASTER_IDEA_CATALOG.md` lines 801–805 (bottom parking lot)

**Original content (verbatim, reflowed):**

> #N — Network Waterfall + 2G Throttle Audit (Per-Page)
>
> The idea: Run Chrome DevTools Network tab with "Slow 3G" and "2G" throttling simulated, for each major page (index / practice, convo, progress, wordcloud, life, stream). Record Time to First Contentful Paint, Time to Interactive, full waterfall identifying blocking requests, heaviest resources per page.
>
> Why: Heavy modules (WaveSurfer, d3) are correctly lazy-loaded (confirmed by performance budget routine #15). But the convo scenarios page specifically is suspected heavy — 25 scenarios, 50 character portraits, scene atmospheres, picker-deck system, knobs drawer, lots of DOM. If throttled to 2G it may be unusable. Real-world ESL users are often on unstable or low-bandwidth connections (phones in cafes, home internet in developing countries, classroom wifi).
>
> Likely outcome: 1-3 pages where additional lazy-loading or code-splitting would help. Convo page almost certainly one of them.
> Priority: Pre-launch perf pass. Catalog for later.

**Disposition:** **INTERNAL SORT → Phase 3.8 (Mobile — Responsive First Pass) + deduplication flag**

**Pre-existing duplicate:** This idea already exists in `docs/routines/LUX_ROUTINES_FROM_CATALOG.md` as the routine **"2G/Slow-3G Waterfall Routine"** under Phase 4 "Performance & UX Canaries". The routine is set to run weekly with Playwright/headless Chrome output to `/perf/2g-waterfall-<date>.json`.

**Action taken:** Added a 🟡 bullet to Phase 3.8 (Mobile) that describes the feature-side counterpart — what the routine output actually drives in the product (lazy-loading additions, code-splitting decisions). Cross-reference to the routine doc is explicit. This way the catalog captures "what the idea looks like when applied to the product" and the routines doc captures "how we automatically gather the data that drives it."

**Reasoning:** Two legitimate frames for the same underlying concern:
- **Routine side:** scheduled measurement, data collection, trend tracking
- **Catalog side:** what we do with the data — which pages to fix, where to apply lazy-loading

Both entries should exist, but they should clearly cross-reference each other rather than duplicating scope.

---

## C5 — INBOUND SYNC FROM AUDIT §1F: AI Coach UI & interaction ideas

**Source:** `docs/LUX_PROJECT_AUDIT_2026-04-17.md` §1F "AI Coach Feedback" (lines 236–295)

**Original audit content (verbatim excerpts, condensed):**

> ### Major Re-Think Needed: AI Coach Across The App
>
> This is a really big category that needs deep investigation. The AI coaches are great, but we really need to **calibrate them better**.
>
> #### Layout & Structure Concerns
> - The layout could probably be improved.
> - Coaching styles: Tutor, Sergeant, Expert. **This could be improved** — possibly more styles, possibly a "directed at a teacher" style for ID/teacher use.
> - Modes: Quick Tips or Deep Dive.
> - When it renders, it gives 6 different possible categories that it responds to in chunks of two. **I want to reanalyze: are we really asking the 6 most important questions? Is presenting them in chunks of 2 the best format?**
> - Possibly add **adjustable knobs** like the convo picker — particularly for **length of response**.
>
> #### Smarter Model?
> Maybe we need to hook it up to a smarter model. The user probably won't be calling on it constantly, so when they do, **it needs to be really good**.
>
> #### Coverage Across The App
> - Practice Skills area — present.
> - AI Conversations (guided practice) — present, basic build.
> - All Data / shared aggregated page — present but **not even hooked up yet**.
> - AI Conversation space (deeper integration) — probably not really hooked up either.
> Each location needs to be **uniquely targeted to its area**.
>
> #### Open Question: Should The User Be Able To Type To The AI Coach?
> Arguments for: huge interactivity and depth.
> Concerns: lots of work, and we'd have to be very careful with system-wide constraints / guardrails so it doesn't get used the wrong way.
> Related principle: if the AI Coach becomes more interactive, it should stay anchored to **Lux content, Lux results, and pronunciation work happening inside the app**, not become a general-purpose chatbot.

**Disposition:** **INBOUND SYNC FROM AUDIT → Phase 2.4**

**Action taken:** Added 6 new bullets to Phase 2.4 under a new sub-heading **"AI Coach UI & interaction (from audit §1F review)"**. Each bullet is citation-tagged `(Synced from audit §1F 2026-04-19.)` so provenance is preserved. No content removed from audit — the audit still has this content as context for its §1F page review.

**New bullets:**
1. Reanalyze the 6-categories-in-chunks-of-2 format
2. Adjustable knobs for AI Coach responses (length-of-response knob)
3. Expand coaching styles beyond Tutor/Sergeant/Expert
4. Upgrade the AI Coach model
5. Complete AI Coach coverage across all placements (with hookup status per location)
6. Type-to-AI-Coach interactivity (the open question)

**What was NOT synced (already in 2.4):**
- "AI Coach should react to the selected L1" (audit §1F.1) — already in 2.4's "system message overhaul" bullet which references L1 profile usage
- "Custom responses always" pattern — already in 2.4

**Reasoning:** The audit's §1F narrative is appropriate page-specific context ("here's what I noticed while reviewing the AI Coach page"), but the specific feature ideas inside it (knobs, model upgrade, coverage gaps, type-to-coach) need to live in the catalog as the authoritative feature roadmap. Without this sync, anyone reading just the catalog would miss critical product-direction thinking.

---

## C6 — INBOUND SYNC FROM AUDIT §1D: Metric Modal reactivity + trouble-chip intelligence

**Source:** `docs/LUX_PROJECT_AUDIT_2026-04-17.md` §1D "Results Display → Big Issue: Metric Modal Cards Need Major Improvement" (lines 175–191)

**Original audit content (verbatim):**

> ### Big Issue: Metric Modal Cards Need Major Improvement
>
> 1. **CSS work needed.** Cleanup pass required. The buttons don't have any hover or darkening effect.
> 2. **Too wordy.** We could do a better job showing less information up front, with crucial info first, and drawers to expand for more.
> 3. **The "How to interpret it" section is static and dumb.** Example: it says "if completeness is low, slow down and prioritize saying every word" — but it shows that even when the user's completeness is 100%. It needs to react to the actual score.
> 4. **Same problem on Fluency.** It says "a few long pauses hurt more than many tiny pauses" — even when the fluency score is 99%. Generic boilerplate. Make it specific and relevant to the actual score in each category.
> 5. **Repetition.** Some content is repeated across cards. E.g., "lowest driver is prosody" appears in every single card. Maybe that's intentional for cross-comparison, but I'm not sure. Worth re-examining.
>
> **Bottom line:** Clean it up, **make it smarter, more reactive, friendlier, and more useful**. We've already built it and we have the means to make it smart — we just need to actually wire that intelligence in.
>
> ### Trouble Chips & Word-Level Table — Same Pattern
>
> - ✅ Trouble chips render — **but they need to be made more intelligent too.**
> - ✅ Word-level results table renders — **same as phoneme chips. Make them smart and actually useful. Shouldn't be a huge task.**

**Disposition:** **INBOUND SYNC FROM AUDIT → Phase 3.3 (Layout & Visual Consistency)**

**Action taken:** Added 2 new bullets to Phase 3.3:
1. 🔵 **Metric Modal cards should be smart and reactive, not static** — full feature description with the concrete examples (Completeness, Fluency) from the audit
2. 🟡 **Trouble Chips & Word-Level Table — same smart-reactive pattern** — same upgrade path

Both bullets cite `(Synced from audit §1D 2026-04-19.)`

**Why I placed them in 3.3 not 2.2 (Diagnosis Engine):**

- 2.2 is about the **engine** — error signature detection, root-cause narration, minimal-pair generation
- 3.3 is about **layout & visual consistency** — how results are presented

The metric modal cards are a presentation layer that should react to engine output. Engine improvements live in 2.2; presentation improvements live in 3.3. These audit-synced items are about making the *presentation* react to the engine's data — so 3.3 is the right home.

**What was NOT synced:** The specific CSS issues (buttons lack hover effect) are audit-level polish tasks; they stay in the audit as actionable line items, not catalog features.

---

## C7 — NO ACTION: "Onboarding rebuild will be massively expanded" narrative

**Source:** `docs/LUX_PROJECT_AUDIT_2026-04-17.md` §1M.6 "Strategic note on full Onboarding rebuild"

**Original content (verbatim):**

> **1M.6 — Strategic note on full Onboarding rebuild:**
> Onboarding is going to be a massive area of focus very soon. This isn't just initial-onboarding either — it's about *tiered* understanding of how to use the different functions and features as the user progresses. The goal is to demonstrate clear human thinking and logical chain sequencing for the ID portfolio.

**Disposition:** **NO ACTION — already covered in catalog Phase 5.1 and Phase 5.7**

**Reasoning:** Phase 5.1 "User Onboarding" and Phase 5.7 "ID Career Tie-Ins" in the catalog already cover this ground — specifically the "walkthrough video," "Articulate 360 module," "clear human thinking and logical sequencing for ID portfolio" concepts. The audit's §1M.6 is appropriate page-level context (why we're flagging onboarding bugs as "pre-overhaul") but doesn't add new feature ideas that aren't already catalogued.

If you want me to add cross-references between the audit §1M.6 and the catalog Phase 5.1/5.7 for clarity, I can do that in a separate pass. Not urgent.

---

## C8 — NO ACTION: Claude's Observations section + Appendix B overlap

**Source:** `docs/LUX_MASTER_IDEA_CATALOG.md` "CLAUDE'S OBSERVATIONS & SUGGESTIONS" (lines 669–703) overlaps with "APPENDIX B — HONEST ASSESSMENT" (lines 754+)

**Observation:** Items 8–13 in the Observations section ("L1 profiling should be backed by a real data table," "Recording storage / privacy policy," "offline/low-connectivity mode," "social/community layer," "teacher-facing as separate product line," "Mark-as-coach as user research feedback loop") are re-stated in Appendix B "Gaps Worth Watching" at the bottom.

**Disposition:** **NO ACTION (flagged for your consideration)**

**Reasoning:** Both sections have independent value:
- The Observations section is in-line with the phases and organized as "what's strong + what's missing"
- Appendix B is framed as a deeper "honest assessment" including strengths, concerns, and focus recommendations

The duplication is mild (about 6 points of overlap) and each serves a different reading context. I flagged it here so you can decide if you want to deduplicate — but I didn't touch either section because the duplication may be intentional (redundancy as reinforcement).

If you want to deduplicate in a future pass, the cleaner move is probably to keep the in-line Observations section (since it integrates with the phase structure) and trim Appendix B to just strengths/concerns/focus recommendations, dropping the "Gaps Worth Watching" sub-section.

---

## C9 — NO ACTION: Routines docs sweep

**Source:** `docs/routines/CLAUDE_ROUTINES_BACKLOG.md`, `CLAUDE_ROUTINES_PLAYBOOK.md`, `LUX_ROUTINES_FROM_CATALOG.md`

**What I looked for:** Feature ideas that had drifted into the routines docs and should come back to the catalog.

**What I found:** Essentially nothing. The routines docs are disciplined about staying routine-shaped. `LUX_ROUTINES_FROM_CATALOG.md` is explicitly designed to reference catalog items (the inverse direction — routines *deriving from* catalog), so any catalog content there is correctly cross-referenced, not displaced.

Only exception: the "2G/Slow-3G Waterfall Routine" entry in `LUX_ROUTINES_FROM_CATALOG.md` has a duplicate in the catalog's old parking lot (now handled in C4 above via cross-referencing rather than duplication).

**Disposition:** **NO ACTION — routines docs are clean**

---

## C10 — NO ACTION: ARCHITECTURE and Bill of Rights extractions sweep

**Source:** `docs/ARCHITECTURE_EXTRACTIONS_2026-04-19.md` and `docs/BILL_OF_RIGHTS_EXTRACTIONS_2026-04-19.md` (today's companion docs)

**What I looked for:** Any feature ideas that got extracted to those docs but should end up in the catalog rather than merging into the audit.

**What I found:** Zero. Every item in both extractions docs is audit-shaped (bugs, status tables, fix lists, current red-zone files). No feature ideas.

**Disposition:** **NO ACTION — confirms the ARCHITECTURE and Bill of Rights extractions are correctly targeted at the audit, not the catalog**

---

## C11 — What I intentionally did NOT touch

1. **The 7 phases themselves** — structure is sound, no phase renaming or reordering.

2. **Individual phase bullets that already exist** — only added new bullets where audit content fills a genuine gap. Didn't rephrase or consolidate existing catalog content.

3. **Appendix A (V2 Restructure Summary)** — historical narrative of the v1→v2 shift. Still valuable context. Appendix B (Honest Assessment) — still valuable strategic framing.

4. **"v6 (added 2026-04-15)" additions** — Dynamic Conversation Text (3.4.1), Bridge Mode (2.8), Life Mode (6.13). These are recent and properly integrated.

5. **Priority-emoji recalibration** — didn't touch the 🔵/🟡/🟠/⚪ tags on existing items. Recalibration is its own exercise.

6. **Phase merging or splitting** — e.g., some might argue Phase 2.4 (AI Coach) and Phase 2.3 (Staggered Intelligence) have enough overlap to consolidate. Not touching without your explicit direction.

---

## Summary of changes in v6.1

| Change type | Count | Location |
|---|---|---|
| Internal sort (parking lot → phases) | 3 items | Phases 3.7 (×2), 3.8 (×1) |
| Obsolete references updated | 1 item | Ongoing → Code Quality |
| Inbound sync from audit §1F | 6 bullets | Phase 2.4 (new subsection) |
| Inbound sync from audit §1D | 2 bullets | Phase 3.3 |
| Cross-references to routines docs | 2 items | Phases 3.7, 3.8 |
| Version header update | 1 edit | Top of doc |

**Net catalog delta:** ~13 substantive additions, 1 obsolete update, parking lot cleared. Doc grew from 805 to 813 lines.

---

## Suggested next-step workflow

Same pattern as the two earlier passes:

1. **Review new catalog** (`MASTER_IDEA_CATALOG_NEW_2026-04-19.md`) — especially the new additions in Phase 2.4 and Phase 3.3.
2. **Review this extractions doc** — confirm dispositions feel right. Flag anything I synced that shouldn't have been, or anything I didn't sync that should have been.
3. **Swap in the new catalog** (one-liner below).
4. **Do NOT yet merge extractions into audit.** We're now ready for the combined merge pass — ARCHITECTURE + Bill of Rights + Catalog extractions all land in the audit in ONE pass. That's step 4 of today's agenda.

### Recommended PowerShell swap

```powershell
cd C:\dev\LUX_GEMINI; Move-Item docs\LUX_MASTER_IDEA_CATALOG.md docs\LUX_MASTER_IDEA_CATALOG.md.2026-04-19.GOLD; Move-Item $env:USERPROFILE\Downloads\MASTER_IDEA_CATALOG_NEW_2026-04-19.md docs\LUX_MASTER_IDEA_CATALOG.md; Move-Item $env:USERPROFILE\Downloads\MASTER_IDEA_CATALOG_EXTRACTIONS_2026-04-19.md docs\MASTER_IDEA_CATALOG_EXTRACTIONS_2026-04-19.md; git add docs\LUX_MASTER_IDEA_CATALOG.md docs\MASTER_IDEA_CATALOG_EXTRACTIONS_2026-04-19.md; git commit -m "docs: Master Idea Catalog v6.1 (2026-04-19) - parking lot sorted, inbound syncs from audit, obsolete refs updated"; git tag master-idea-catalog-rewrite-2026-04-19; git push; git push --tags
```

**Pre-flight check (do this before running):**

```powershell
Get-ChildItem -Path $env:USERPROFILE\Downloads -Filter "MASTER*" | Select-Object Name, LastWriteTime
```

Should show both files in Downloads. If not, click the download links in this conversation first.

---

No changes are live until you say go.
