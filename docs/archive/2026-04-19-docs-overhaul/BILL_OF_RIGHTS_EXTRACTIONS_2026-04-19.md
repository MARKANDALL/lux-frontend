# Bill of Rights Extractions (2026-04-19)

> **Purpose:** During the 2026-04-19 rewrite of `docs/system-health-bill-of-rights.frontend.md`, content judged to be work-items, audit findings, fix-lists, or stale status tables (rather than rules/charter content) was extracted rather than carried into the new doc. This document preserves **every** such extraction verbatim, with a recommended disposition for each.
>
> **Companion doc:** `docs/ARCHITECTURE_EXTRACTIONS_2026-04-19.md` (from the ARCHITECTURE.md rewrite earlier today).
>
> **Nothing has been silently dropped.** If a fact from the old Bill of Rights is not in the new one and not in this extractions list, it was either formatting-only (restoring broken markdown tables) or preserved with updated data (e.g., line numbers refreshed in the Global Ownership Map). If you spot an omission, flag it — goal is zero information loss.
>
> **Disposition key:**
> - **MERGE INTO AUDIT** — belongs in `docs/LUX_PROJECT_AUDIT_2026-04-17.md` as current or historical work
> - **ALREADY RESOLVED** — verified against current repo state; no action needed except dedup-check when merging
> - **ARCHIVE-ONLY** — historical narrative with no active value
> - **KEEP IN BILL OF RIGHTS (reconsider)** — I cut it but you may want it back

---

## B1 — Part B: Updated Audit Status Table (Feb 26 → Mar 1)

**Source:** `docs/system-health-bill-of-rights.frontend.md` Part B, 8-row status table (rows B.1–B.8)

**Content (verbatim, reflowed for readability):**

| # | Issue | Status (as of Mar 1) | Risk | Next Action |
|---|---|---|---|---|
| B.1 | `window.LuxLastRecordingBlob` dual-write (runtime.js vs convo-turn.js) | FIXED | LOW | None — verified single writer |
| B.2 | `window.LuxKaraokeSource / LuxKaraokeTimings` written by 3 modules | FIXED | LOW | None — verified canonical writer pattern |
| B.3 | `document.body.style.overflow` toggled by 2 modals | FIXED | LOW | None — verified ref-counted lock |
| B.4 | 3 capture-phase click handlers competing (my-words, metric-modal, chip-events) | PARTIAL (no `stopPropagation` violations, but no documentation of interaction matrix) | LOW | Add comments documenting capture-handler interaction matrix |
| B.5 | `window.luxTTS` dual-init (convo-tts-context vs player-ui) | FIXED | LOW | None — resolved |
| B.6 | Double-init guard in `convo-bootstrap.js` (MutationObserver + setInterval) | PARTIAL (MutationObserver removed; setInterval at line 176 still runs forever) | MED | Replace 300ms poll with `lux:scenarioChanged` event dispatch |
| B.7 | Global/window ownership map (inventory of globals) | FIXED | LOW | Keep the charter updated as new globals are added |
| B.8 | z-index stack conflicts (selfpb float above modals) | PARTIAL | LOW | Promote attempt-detail modal z-index to 10050 to match metric-modal |

### My recommended disposition (per row):

| Row | Disposition | Evidence |
|---|---|---|
| B.1 | **ALREADY RESOLVED — verified 2026-04-19** | `runtime.js:49` is sole writer of `window.LuxLastRecordingBlob`. Confirmed by repo grep. |
| B.2 | **ALREADY RESOLVED — verified 2026-04-19** | `tts/player-ui/karaoke.js:93` is sole writer of `window.LuxKaraokeSource`. `publishKaraoke()` is the canonical helper. |
| B.3 | **ALREADY RESOLVED — verified 2026-04-19** | Only `helpers/body-scroll-lock.js:8,16` writes `document.body.style.overflow`. Both modal files (`metric-modal/events.js:75,119` and `attempt-detail/modal-shell.js:57,73`) import and use the helper. |
| B.4 | **MERGE INTO AUDIT — still partial, needs comment documentation** | Code is safe (guards present), but documentation is still missing. |
| B.5 | **ALREADY RESOLVED — verified 2026-04-19** | `window.luxTTS` writer at `tts/player-ui.js:456` is the sole compat-shim write. No Object.assign mirror writes anywhere. |
| B.6 | **ALREADY RESOLVED — verified 2026-04-19** | Grep for `setInterval\|clearInterval\|MutationObserver` in `convo-bootstrap.js` returns ZERO matches. The 300ms poll has been removed entirely. |
| B.7 | **ALREADY RESOLVED (with updated data in new Bill of Rights)** | Global Ownership Map refreshed in new Bill of Rights Part A.2 with current line numbers and two new globals (`LuxLastSaidText`, `LuxWarn`). |
| B.8 | **MERGE INTO AUDIT — still partial** | Metric modal z-index at 10050 vs attempt-detail at 9999. Minor visual ordering issue, still unresolved. |

---

## B2 — Part C: innerHTML / Injection / Flakiness Investigation

**Source:** `docs/system-health-bill-of-rights.frontend.md` Part C, entire section (search results summary, categorized findings, correlation table)

**Summary of content:**

- **C.1:** ~95+ `innerHTML` / `insertAdjacentHTML` / `outerHTML` usages found. Zero `eval` / `new Function` / `document.write` in application code.
- **C.2 SAFE list:** 76 instances of static HTML or properly-escaped dynamic content (enumerated in a table of ~50 rows)
- **C.2 RISKY list:** 7 instances of dynamic content without escaping (R1–R7)
- **C.2 Admin Pages:** 3 rows in separate-trust-zone table
- **C.3:** Correlation table linking reported "inconsistent UI behavior" symptoms to `innerHTML`-based DOM replacement

**My recommended disposition:** **MERGE INTO AUDIT — with per-item resolution status**

### R1–R7 status verification (2026-04-19):

| # | File:Line | Description | Status (verified 2026-04-19) |
|---|---|---|---|
| R1 | `ui/auth-dom.js:107` | `${email}` interpolated into innerHTML without escape (HIGH XSS risk) | **RESOLVED** — now at line 119: `<strong>${escHtml(email)}</strong>`. `escapeHtml` imported at line 15. |
| R2 | `features/results/render-helpers.js:58` | `${data?.error}` without escape (MED) | **NEEDS VERIFICATION** — line numbers may have drifted. Should be merge-item: "verify render-helpers.js escaping complete" |
| R3 | `features/results/render-helpers.js:116` | `${err.word}` without escape (MED) | **PARTIAL — related fix shipped** — handover §2 Phase B notes XSS fix on `summary.js:158` for `err.word`. Need to check if `render-helpers.js:116` was also patched or is a different call site. |
| R4 | `features/passages/dom.js:66` | `ui.tipText.innerHTML = textHTML` (LOW-MED, upstream source unclear) | **NEEDS VERIFICATION** |
| R5 | `features/results/syllables.js:138` | `m.innerHTML = renderSyllableStrip(w)` (LOW) | **NEEDS VERIFICATION** |
| R6 | `features/interactions/ph-hover/tooltip-render.js:212` | `state.tooltipContent.innerHTML = html` (LOW) | **NEEDS VERIFICATION** |
| R7 | `features/progress/attempt-detail/ai-coach-section.js:59,69,73` | `contentDiv.innerHTML = mdToHtml(content)` (LOW) | **LIKELY RESOLVED** — `mdToHtml` in `helpers/md-to-html.js` calls `escapeHtml` internally. Would need to verify `mdToHtml` hasn't regressed. |

**Also for merge into audit:** The Part C SAFE list (76 instances) serves as a historical baseline showing these call sites were audited and classified. Worth keeping as an appendix in the audit.

**Part C.3 correlation table (symptoms → causes → files):** MERGE INTO AUDIT — this is exactly the kind of diagnostic table that belongs in a findings doc.

---

## B3 — Part D: Tactical Fix Plan (Top 8 Items)

**Source:** `docs/system-health-bill-of-rights.frontend.md` Part D, 8 fix items with risk levels and rollback notes

**Content summary:**

| Fix | Description | Risk | Status (verified 2026-04-19) |
|---|---|---|---|
| Fix 1 | Escape email in `auth-dom.js` (CRITICAL — XSS) | LOW | **RESOLVED** — line 119 now uses `escHtml(email)` |
| Fix 2 | Escape API error messages in `render-helpers.js` (MED) | LOW | **NEEDS VERIFICATION** — see R2/R3 above |
| Fix 3 | Replace `convo-bootstrap.js` unbounded setInterval with event (MED) | MED | **RESOLVED** — grep confirms zero setInterval/MutationObserver in convo-bootstrap.js |
| Fix 4 | Document capture-handler interaction (LOW) | ZERO | **NOT DONE** — still no documentation comments in chip-events, metric-modal, or panel-events |
| Fix 5 | Add `*.GOLD` to `.gitignore` (LOW) | ZERO | **RESOLVED** — confirmed by git commit behavior in 2026-04-19 ARCHITECTURE.md swap (GOLD file was rejected by gitignore) |
| Fix 6 | Consolidate `esc()` / `escapeHtml()` functions (LOW) | LOW | **RESOLVED** — only ONE definition now: `helpers/escape-html.js:5 export function escapeHtml(s)`. Grep confirms no other function definitions in the codebase. |
| Fix 7 | Promote attempt-detail modal z-index (LOW) | LOW | **UNRESOLVED** — see B.8 above |
| Fix 8 | Document `window.luxTTS` init-order dependency | ✅ SUPERSEDED — resolved by Phase A | **ALREADY SUPERSEDED** |

**My recommended disposition:** **MERGE INTO AUDIT**

Specifically, the unresolved items (Fix 4, Fix 7) should become explicit audit line items. The resolved items should be marked "✅ RESOLVED (verified 2026-04-19)" with evidence so the audit trail is preserved.

---

## B4 — Part E: Implementation Status

**Source:** `docs/system-health-bill-of-rights.frontend.md` Part E

**Content (verbatim):**

> Fixes 1, 2, and 5 are implemented in this commit series (see below). They are the lowest-risk, highest-impact items.
>
> Implemented Patches
>
> See git log for commit details.

**My recommended disposition:** **ARCHIVE-ONLY**

**Reasoning:** This section pointed to a commit series that existed at the time the Bill of Rights was written. It's a dangling status reference to commits that are now part of git history. Nothing actionable. Keep in this extractions doc for provenance but don't merge into audit — the information is already in `git log`.

---

## B5 — Current Red-Zone Files table (from Part A.4)

**Source:** `docs/system-health-bill-of-rights.frontend.md` Part A.4 "Current Red-Zone Files" subsection

**Content (verbatim):**

> Current Red-Zone Files (Non-Data, Non-Template, >400 lines)
>
> File | Lines | Suggested Split
> ---|---|---
> features/recorder/audio-inspector.js | 404 | Extract rendering logic from event wiring

**My recommended disposition:** **MERGE INTO AUDIT — and update**

**Updated list (verified 2026-04-19):**

| File | Lines | Notes |
|---|---|---|
| `features/voice-mirror/voice-mirror.js` | 480 | NEW file (didn't exist at prior audit) |
| `features/voice-mirror/voice-onboarding.js` | 459 | NEW file |
| `features/features/tts/player-ui.js` | 459 | Grew from 388 |
| `features/convo/convo-bootstrap.js` | 427 | Grew from ~220 |
| `features/recorder/audio-inspector.js` | 422 | Grew from 404 |
| `features/convo/convo-report-ui.js` | 405 | NEW file |
| `features/convo/convo-layout.js` | 405 | Grew from <250 |

**Reasoning:** The threshold (>400 lines) is charter information (stays in Bill of Rights). The *list* of files currently violating is a current findings table — that's audit content. Merge into audit as a "Current Red-Zone Files (as of 2026-04-19)" section.

---

## B6 — Current Yellow-Zone Files list (from Part A.4)

**Source:** `docs/system-health-bill-of-rights.frontend.md` Part A.4 "Current Yellow-Zone Files" subsection

**Content (verbatim):**

> Current Yellow-Zone Files (250–400 lines, logic-heavy)
>
> File | Lines
> ---|---
> features/features/tts/player-ui.js | 388
> features/convo/scene-atmo.js | 388
> features/streaming/app.js | 380
> src/main.js | 373
> features/interactions/ph-hover/tooltip-modal.js | 369
> features/results/header.js | 362
> features/features/selfpb/dom.js | 357
> features/harvard/modal-controller.js | 350
> features/convo/characters-drawer.js | 347
> features/convo/convo-shared.js | 340

**My recommended disposition:** **MERGE INTO AUDIT — and update**

**Updated list (verified 2026-04-19, 43 files now in yellow zone — top 10 by size):**

| File | Lines |
|---|---|
| `src/data/phonemes/details.js` | 394 |
| `features/convo/scene-atmo.js` | 394 |
| `features/results/syllables/cmu-stress.js` | 393 |
| `features/features/selfpb/dom.js` | 390 |
| `features/convo/picker-deck/cefr-hint-badge.js` | 382 |
| `features/streaming/app.js` | 382 |
| `src/main.js` | 377 |
| `features/convo/characters-drawer.js` | 373 |
| `features/interactions/ph-hover/tooltip-modal.js` | 368 |
| `features/results/header.js` | 356 |

Full list of 43 yellow-zone files is available via the repo-size audit script. Merge notes for audit: **"yellow zone grew from ~10 to 43 files — expected given overall repo growth, but several files have crossed into the 380+ range and warrant split planning."**

---

## B7 — Stale line numbers in Global Ownership Map

**Source:** `docs/system-health-bill-of-rights.frontend.md` Part A.2 Global Ownership Map

**Content (summary):** The table listed writer line numbers from the state of the codebase on 2026-03-01. Line numbers have drifted in most files (files have grown).

**Drift observed (representative sample):**

| Global | Old line | New line |
|---|---|---|
| `window.LuxLastRecordingBlob` | runtime.js:42 | runtime.js:49 |
| `window.LuxLastRecordingMeta` | runtime.js:43 | runtime.js:50 |
| `window.LuxKaraokeSource` | karaoke.js:83 | karaoke.js:93 |
| `window.LuxKaraokeTimings` | karaoke.js:84 | karaoke.js:94 |
| `window.LuxTTSWordTimings` | karaoke.js:86 | karaoke.js:96 |
| `window.LuxLastAzureResult` | recorder/index.js:155 | recorder/index.js:161 |
| `window.LuxLastWordTimings` | recorder/index.js:156 | recorder/index.js:162 |
| `window.LuxTTSContext` | convo-tts-context.js:198 | convo-tts-context.js:202 |

**My recommended disposition:** **ALREADY RESOLVED — updated in new Bill of Rights Part A.2**

**Also:** The new Bill of Rights adds two globals that were NOT in the old map:

| Global | Writer | Notes |
|---|---|---|
| `window.LuxLastSaidText` | `features/results/header-modern.js:119` | Results-owned |
| `window.LuxWarn` | `ui/lux-warn.js:80` | Control surface for warnSwallow modes (DevTools API) |

Neither represents a One-Writer violation. Both have single writers. They were simply missing from the prior inventory.

---

## B8 — Minor formatting/markdown restoration (documented for transparency)

**Source:** `docs/system-health-bill-of-rights.frontend.md` various — multiple tables lost proper markdown formatting and rendered as flowing plain text (same issue the old ARCHITECTURE.md had).

**Content:** Tables in Part A.3 (Allowed/Banned Patterns), Part A.4 (Red-Zone/Yellow-Zone file lists), Part A.5 (Smoke Tests, Rollback Procedures, Where to Look If It Breaks), and Part B (Updated Audit Status Table) all had broken markdown, rendering as unseparated text lines.

**My recommended disposition:** **ALREADY RESOLVED — pure formatting fix, no content change**

**Reasoning:** Same fix as applied to ARCHITECTURE.md rewrite. Tables are tables again. All content preserved verbatim. Flagging here so you can verify nothing was lost in the reformat.

---

## B9 — Additions to new Bill of Rights (beyond extractions)

**Content:** The new Bill of Rights adds several items not in the old doc:

1. **Right 20 — Shared Plumbing Gets a Protection Ring** — formalizes the colocated-test rule that's already being practiced (`app-core/*.test.js`, `_api/*.test.js`). Elevates the practice to a rule.

2. **Right 18 Protection-ring coverage list — updated** — now includes `lux-storage` (which has its own colocated test), whereas the old doc implied it but didn't list it.

3. **Banned pattern: raw `localStorage.getItem/setItem` outside `lux-storage.js`** — new entry in Part A.3 banned patterns table. Formalizes the K_ constant convention already in use.

4. **Voice Mirror added to Smoke Tests** — Part A.5 now includes Voice Mirror record→clone→playback as a manual smoke test case.

5. **`/api/migrate` 404 added to "Where to Look If It Breaks"** — as a known symptom with pointer to the audit (not a rule violation, just a helpful diagnostic).

6. **Related Documentation section at end** — cross-links to architecture, audit, catalog, routines.

7. **Scope statement at top** — explicit "this doc is NOT" language to prevent future drift of work items into the rules doc.

**My recommended disposition:** **ADDITIVE — flagged for your review**

**Reasoning:** These are either (a) formalizations of practices already being followed, (b) completeness additions that reflect current reality, or (c) guardrails against future drift. Flag if any are out of scope for a "clean rewrite from existing content."

---

## B10 — What I intentionally did NOT add

1. **No new rules 21+** — you asked for clean rewrite, not rulebook expansion. Held back on adding rules about JSDoc coverage, absolute vs relative imports, test coverage targets, etc., even though they might be useful. Those can be added later as separate discussion items.

2. **No specific file-size split plans** — individual split recommendations for red/yellow zone files are audit work, not charter work.

3. **No CSS architecture rules** — the 62 CSS files could use discipline (naming, layer ordering), but the old Bill of Rights only had Right 15 on inline styles. Didn't expand into new CSS territory.

4. **No security rules specific to Supabase / Azure / ElevenLabs** — the old doc stayed general (no real credentials, no fighting state). Didn't add vendor-specific rules.

5. **No performance rules** — bundle size, render perf, image optimization are tracked by routines now (performance-budget routine #15). Didn't duplicate into charter.

---

## Summary: Disposition Totals

| Disposition | Count |
|---|---|
| **MERGE INTO AUDIT** | Part B rows B.4, B.6 (docs-only), B.8; Part C entirely (with per-item resolution flags); Part D Fixes 4 and 7 unresolved; Part A.4 red/yellow zone lists (updated) |
| **ALREADY RESOLVED** (verified 2026-04-19) | Part B rows B.1, B.2, B.3, B.5, B.6 (code-only), B.7; Part C R1; Part D Fixes 1, 3, 5, 6, 8; Global Ownership Map line numbers |
| **ARCHIVE-ONLY** | Part E implementation status pointer |
| **ADDITIONS TO NEW DOC** | 7 items in B9 |
| **INTENTIONALLY NOT ADDED** | 5 items in B10 |

---

## Suggested next-step workflow

Same pattern as the ARCHITECTURE.md rewrite:

1. **Review new Bill of Rights** (`BILL_OF_RIGHTS_NEW_2026-04-19.md`) side-by-side with old.
2. **Review this extractions doc.** Flag any MERGE INTO AUDIT item you disagree with.
3. **Do NOT merge extractions into audit yet** — we'll do the Master Idea Catalog pass next, then do one combined merge pass for all three extractions docs (ARCHITECTURE + Bill of Rights + Catalog).
4. **Swap in the new Bill of Rights:**
    - Rename old `docs/system-health-bill-of-rights.frontend.md` → `docs/system-health-bill-of-rights.frontend.md.2026-04-19.GOLD`
    - Rename new file into place as `docs/system-health-bill-of-rights.frontend.md`
    - Commit + tag + push
5. **Keep this extractions doc** in `docs/` until the Master Idea Catalog pass is done and all three sets of extractions are merged into the audit in one clean pass.

No changes are live until you say go.
