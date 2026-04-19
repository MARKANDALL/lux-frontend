# ARCHITECTURE.md Extractions (2026-04-19)

> **Purpose:** During the 2026-04-19 rewrite of `docs/ARCHITECTURE.md`, content that was judged to be work-items, fix-lists, timestamped status narratives, or otherwise "audit-shaped" (rather than scaffolding-shaped) was extracted rather than carried into the new doc. This document preserves **every** such extraction verbatim, with a recommended disposition for each.
>
> **Nothing has been silently dropped.** If a fact from the old ARCHITECTURE.md is not in the new one and not in this extractions list, it was either verified as still-present in new-doc-appropriate form, or it's a formatting/layout artifact (e.g., restored markdown tables). If you spot an omission, ping back — my goal is zero information loss.
>
> **Disposition key:**
> - **MERGE INTO AUDIT** — belongs in `docs/LUX_PROJECT_AUDIT_2026-04-17.md` (active unresolved work or historical status worth preserving)
> - **ALREADY RESOLVED** — work has been done since the old ARCHITECTURE.md was written; I've verified against current repo state
> - **KEEP IN ARCHITECTURE (reconsider)** — I'm flagging this for your review; I cut it but you may want it back
> - **ARCHIVE-ONLY** — historical narrative with no active value; safe to drop from active docs but preserved here

---

## E1 — "Current Hardening Status (March 2026)" narrative

**Source:** `docs/ARCHITECTURE.md` lines 56–80

**Content (verbatim):**

> ## Current Hardening Status (March 2026)
>
> The frontend is in structured hardening mode, not rescue mode and not broad feature-refactor mode.
>
> Completed and verified in the current stabilization wave:
> - storage normalization pass
> - safe residue / dead-code cleanup
> - scene-atmo interval lifecycle cleanup
> - metric-modal safe cleanup
> - TTS / karaoke / SelfPB bridge cleanup
> - refresh-hook migration to bus-first patterns
> - small protection-ring expansion around shared runtime and learner-blob plumbing
>
> Important verification outcome:
> - the remaining meaningful `window.*` migration family was re-checked and verified as already done in:
>   - `features/features/selfpb/ui.js`
>   - `features/recorder/index.js`
>   - `features/convo/convo-turn.js`
>   - `features/features/tts/player-ui.js`
>
> Parked side issues remain parked unless they clearly reproduce or block core flow:
> - convo SelfPB learner karaoke words in AI Conversations
> - End Session / overlay contract issue
> - picker drawer carry-over bug appears improved / likely resolved, but is not an active hardening target

**My recommended disposition:** **MIXED**
- The "Completed and verified" list → **ARCHIVE-ONLY** (historical status narrative; the work is done, tagged, and tags are preserved in the new ARCHITECTURE.md git-tags section)
- The `window.*` migration verification note → **ARCHIVE-ONLY** (the current window-globals table in the new doc shows the end state; the verification process itself is historical)
- **Parked side issues (3 items) → MERGE INTO AUDIT** — these are active unresolved issues:
  1. "convo SelfPB learner karaoke words in AI Conversations"
  2. "End Session / overlay contract issue"
  3. "picker drawer carry-over bug appears improved / likely resolved, but is not an active hardening target"

**Reasoning:** Timestamped status narratives don't belong in scaffolding docs — they drift fast and readers can't tell what's current. But the three parked issues are real open bugs and should live with other open bugs in the audit (which already has a "Sign-off Checklist" and per-page bug sections that would absorb these).

**Cross-reference:** Audit §2 (AI Conversations page) already mentions "End Session doesn't show the report overlay" as a known bug. Item 2 above is a duplicate — can be marked ✅ ALREADY IN AUDIT when merging.

---

## E2 — "Known Issues" list at bottom

**Source:** `docs/ARCHITECTURE.md` lines 492–502 (the final section)

**Content (verbatim):**

> Known Issues
>
> End Session in AI Conversations doesn't show the report overlay (pre-existing, not from stabilization)
>
> Character encoding garbled symbols in some results displays
>
> Expanded tooltip video/audio desync
>
> 4 duplicate escHtml functions — should consolidate to helpers/dom.js
>
> 94 scattered localStorage accesses — no centralized storage layer yet RESOLVED: app-core/lux-storage.js provides K_ constants + typed helpers. 11 files migrated from bare key strings to constants (Phase D). Remaining bare strings are in identity.js (key owner) and public/lux-popover.js / admin HTML (classic scripts, cannot import).

**My recommended disposition:** **PER-ITEM**

| # | Issue | Disposition | Evidence |
|---|---|---|---|
| 1 | End Session in AI Conversations doesn't show the report overlay | **MERGE INTO AUDIT — duplicate of existing item** | Audit §2 already flags this in Sign-off Checklist: "Life, AI Convo (the report 404 specifically)" |
| 2 | Character encoding garbled symbols in some results displays | **MERGE INTO AUDIT — new item, not currently in audit** | Should be added to audit §1D (Results Display) |
| 3 | Expanded tooltip video/audio desync | **MERGE INTO AUDIT — new item** | Should be added to audit §1E (Phoneme Hover) or §1H (Self-Playback) |
| 4 | 4 duplicate escHtml functions — should consolidate to helpers/dom.js | **PARTIAL RESOLVED — needs verification** | `helpers/escape-html.js` now exists as a canonical location. Consolidation may or may not be complete across all 4 call sites. Flag for audit as "verify consolidation status." |
| 5 | 94 scattered localStorage accesses | **ALREADY RESOLVED (marked inline)** | Already marked RESOLVED in the source text. The new ARCHITECTURE.md documents `lux-storage.js` and `K_` constants as the canonical system. No action needed. |

---

## E3 — Stale directory structure (api/ vs _api/)

**Source:** `docs/ARCHITECTURE.md` lines 86–156 (Directory Structure section)

**Content (drift-only — not verbatim reproduction):**

The old directory structure block listed `api/` as the frontend API adapter folder. The actual folder is `_api/`.

**My recommended disposition:** **ALREADY RESOLVED — correction applied in new ARCHITECTURE.md**

**Evidence:**
- Current repo has `_api/` folder with: `ai.js`, `alt-meaning.js`, `assess.js`, `attempts.js`, `attempts.test.js`, `convo-report.js`, `convo.js`, `identity.js`, `identity.test.js`, `index.js`, `util.js`, `util.test.js`, `voice-mirror.js`
- The rename happened to work around Vercel Hobby's 12-function limit (the `_` prefix tells Vite not to treat the folder as deployable)
- No `api/` folder exists in current repo
- URL paths on the backend (`/api/assess`, `/api/convo-turn`, etc.) are unaffected — only the frontend adapter folder name changed

**Reasoning:** Pure factual correction. Not a work item, not an extraction. Noted here so there's a paper trail of the drift.

---

## E4 — Missing directories in old structure

**Source:** `docs/ARCHITECTURE.md` lines 86–156

**Content:** The old doc's directory tree was missing several directories that exist in the current repo:

- `core/` — `core/prosody/index.js`, `core/scoring/index.js`
- `prosody/` — dual-home with `core/prosody/` (flagged in routines backlog as ongoing debt; see `docs/routines/LUX_ROUTINES_FROM_CATALOG.md` "Prosody Dual-Home Drift Watcher")
- `_parts/` — 10 CSS partials for convo picker
- `_agents-archive/` — archived Simoishi, OpenClaw, Kodama systems
- `kodama-reports/` — archived Kodama run findings
- `tests/` — top-level cross-cutting Vitest suites (separate from colocated `*.test.js`)
- `tools/` — dev tooling (e.g., `dev-realtime-proxy.mjs`)
- `ui/components/` subfolder — unified card component system (score-ring, metric-tiles, trouble-chips, lux-card)
- `ui/ui-ai-ai-logic/` subfolder — AI Coach logic (attempt-policy, deep-mode, lifecycle, quick-mode)

**Features missing from old directory tree:**
- `features/voice-mirror/` — Voice Mirror feature (2 files)
- `features/practice-highlight/` — Practice-session phoneme highlighting

**My recommended disposition:** **ALREADY RESOLVED — all added to new ARCHITECTURE.md**

**Reasoning:** Pure completeness. The old doc wasn't wrong, just incomplete because it was written before these directories existed (or was never updated to include them).

---

## E5 — Bus channels drift

**Source:** `docs/ARCHITECTURE.md` lines 199–221 (Bus channels table)

**Content:** The old doc listed 20 bus channels. An audit of actual `luxBus.set/get/on/update` usage in the current repo (2026-04-19) found 23 real channels. New channels not in old doc:

1. `selfpbApi:core` — canonical SelfPB core API (per Bill of Rights, this replaces `selfpbApi` as the canonical key; both are still in use during migration)
2. `selfpb:mounted` — self-playback mount-ready signal
3. `myWordsApi` — My Words public API (the `window.LuxMyWords` → bus migration means this is the new canonical reader path)

**My recommended disposition:** **ALREADY RESOLVED — new table in new ARCHITECTURE.md reflects actual usage**

**Methodology note:** The audit regex-counted real calls (`luxBus.set\(['"](.*?)['"]`, similar for get/on/update) across all non-test JS files in the repomix. Test-only channels (`_test_`, `err_test`, `keyA`, `keyB`, `testKey`, etc.) were filtered out.

---

## E6 — warnSwallow counts drift

**Source:** `docs/ARCHITECTURE.md` lines 288–292 (warnSwallow modes section)

**Content (verbatim):**

> Modes (set via `LuxWarn.set("on" | "off" | "important")` in DevTools):
>
> "on" — show all 235 swallowed errors
>
> "important" — show only the 166 critical/medium catches (persistence, API, recording, state)
>
> "off" — silence everything

**My recommended disposition:** **ALREADY RESOLVED — new numbers in new ARCHITECTURE.md**

**Evidence (counted 2026-04-19):**
- Total `warnSwallow(` call sites: **242** (old: 235)
- With explicit `"important"` level: **154** (old: 166)

**Reasoning:** Counts drift over time as new catches are added/removed and levels are retuned. New doc uses current counts with the audit date noted, so future readers can tell when they drift again. No action needed.

---

## E7 — API endpoints table corrections

**Source:** `docs/ARCHITECTURE.md` lines 262–272 (Backend Endpoints table)

**Corrections made in new doc:**

1. All `Frontend File` paths corrected from `api/...` to `_api/...`
2. Added `_api/voice-mirror.js` row (new endpoint adapter, wasn't in old doc)
3. Added missing endpoints: `/api/update-attempt`, `/api/user-recent` (both served by `_api/attempts.js`)
4. Added Voice Mirror router routes: `/api/router?route=voice-clone`, `/api/router?route=voice-mirror`
5. Kept `ui/auth-dom.js` → `/api/migrate` row but see E8 below

**My recommended disposition:** **ALREADY RESOLVED**

---

## E8 — `/api/migrate` endpoint is called but does not exist

**Source:** `docs/ARCHITECTURE.md` line 272 references `ui/auth-dom.js → /api/migrate`. Current repo: `ui/auth-dom.js:192` calls `apiFetch("/_api/migrate", ...)` (note: also slightly wrong — uses `_api/` in URL path which is client-path, not backend-path).

**Actual bug:** The backend has no `migrate` endpoint. The `_api/` folder on the frontend has no `migrate.js` adapter. This call fails in production, which is a critical bug tracked in the session handover as "Tier 3 #31 — requires backend JWT migration work."

**My recommended disposition:** **MERGE INTO AUDIT — critical unresolved bug, not scaffolding**

**Reasoning:** The new ARCHITECTURE.md's Backend Endpoints table still lists `/api/migrate` as a supposed endpoint, but it would be actively misleading to say "this works." Options:
- **Option A (chosen for new doc):** Leave the row in the new ARCHITECTURE.md endpoints table as-is since documenting what the code *tries* to call is useful scaffolding information, and add the bug to the audit as an unresolved issue.
- **Option B (rejected):** Remove the row entirely, but then someone reading `auth-dom.js` and trying to trace where it goes has no reference.

**Action when merging into audit:** Add as "Critical — `/api/migrate` endpoint missing, called from `ui/auth-dom.js:192`, breaks guest → user history migration on login." Should go in audit §1L (Save Progress / Auth) or a new Cross-Cutting Critical Bugs section.

---

## E9 — Inline-defined Pages and Entry Points section lost its table formatting

**Source:** `docs/ARCHITECTURE.md` lines 158–173

**Content:** The old doc had a well-formed Pages and Entry Points table at the top of the "Pages and Entry Points" heading, but markdown table formatting broke around line 162 — the table rows render as plain text ("HTML Page Entry Script What It Does" etc.) rather than as a rendered table.

**My recommended disposition:** **ALREADY RESOLVED — markdown restored in new ARCHITECTURE.md**

**Reasoning:** Formatting-only fix. Content is preserved verbatim (same 10 pages, same entry scripts, same descriptions). Flagging here in case you want to verify nothing was lost in the reformat.

---

## E10 — Several major sections had broken markdown formatting

**Source:** `docs/ARCHITECTURE.md` lines 158–502

**Content:** Multiple sections lost table/code-block formatting around line 158 and never recovered: "Bus channels," "apiFetch code examples," "Backend Endpoints table," "Window Globals Still Present," "localStorage Keys," "Git Tags," "Architecture Rules," "Known Issues." All were rendered as flowing text rather than structured markdown.

**My recommended disposition:** **ALREADY RESOLVED — full markdown restoration in new ARCHITECTURE.md**

**Reasoning:** Formatting-only. Content preserved verbatim per the instruction to make no creative edits. Tables are tables again, code blocks are code blocks, headings are headings. This was the single biggest visible change in the rewrite — it makes the doc actually readable again.

---

## E11 — Missing coverage in old doc that was added in new doc

**Source:** New additions to ARCHITECTURE.md (not extracted *from* old doc, but additive):

1. **Voice Mirror section** — dedicated section describing the feature, its files (`features/voice-mirror/voice-mirror.js`, `voice-onboarding.js`, `_api/voice-mirror.js`), backend integration, and the Supabase `voice_profiles` table
2. **`lux-storage.js` proper documentation** — old doc only mentioned it in the "RESOLVED" note on Known Issues
3. **Claude Code Routines section** — new system that post-dates the old ARCHITECTURE.md
4. **`helpers/` subdir contents** — old doc said `helpers/` existed but didn't enumerate files; new doc lists body-scroll-lock, escape-html, md-to-html, etc.
5. **`ui/components/` subfolder** — the unified card component system (score-ring, metric-tiles, trouble-chips, lux-card) wasn't documented at all
6. **`ui/ui-ai-ai-logic/` subfolder** — the AI Coach logic subsystem split (attempt-policy, deep-mode, lifecycle, quick-mode)
7. **Test strategy** — the new colocated-tests + top-level-`tests/` pattern wasn't mentioned
8. **Recent non-stabilization tags** — `deep-review-fixes-2026-04-17` / `-04-18` noted for reference
9. **Repo scale metrics** — 326 JS / 62 CSS / 439 total file counts (updated from old doc's ~424)
10. **"Related Documentation" section at the bottom** — cross-links to audit, bill of rights, catalog, competitive, routines

**My recommended disposition:** **ADDITIVE — no extraction needed, flagged for your review**

**Reasoning:** These are things the old doc omitted or under-documented. I added them because they're current repo reality and scaffolding readers need them. Flag for your review in case any were out of scope for a "clean rewrite from existing content only."

---

## E12 — What I intentionally did NOT add to the new doc

These were candidates to add, but I held back because they're either (a) work-shaped rather than scaffolding-shaped, or (b) would require information outside the frontend repomix:

1. **Backend architecture** — the `luxury-language-api` repo has its own scaffolding story. A backend ARCHITECTURE.md would need its own repomix.
2. **CSS architecture deep-dive** — 62 CSS files with `lux-` prefix convention is mentioned, but no file-by-file breakdown. That's a separate doc if we want it.
3. **Scenarios design doctrine** — the four-axis neutrality system, CEFR alignment, tone/length/perspective audit methodology — this is content design, not scaffolding. Belongs in its own doc or the idea catalog, not here.
4. **Voice Mirror end-to-end flow diagram** — one exists as an idea in `LUX_ROUTINES_FROM_CATALOG.md` ("Voice Mirror Pipeline Trace" routine). Not built yet.
5. **Protection-ring test inventory** — listed that they exist but didn't enumerate which tests cover what. Tests live at colocation points and in `tests/`; individual coverage map is out of scope for a scaffolding doc.
6. **Deploy / Vercel configuration** — `vercel.json` exists; the new doc mentions the Vercel Hobby 12-function limit as context for `_api/` naming, but deploy-specific config is its own concern.

---

## Summary: Disposition Totals

| Disposition | Count |
|---|---|
| MERGE INTO AUDIT | 6 items (parked side-issues ×3 from E1, Known Issues new items ×2 from E2, /api/migrate bug from E8) |
| ALREADY RESOLVED (verified) | 6 items (api→_api correction, missing dirs, bus channels, warnSwallow counts, endpoints corrections, markdown restoration) |
| ARCHIVE-ONLY | Historical hardening narrative from E1 |
| PARTIAL RESOLVED (needs verification) | 1 item (escHtml consolidation status from E2) |
| NEW ADDITIONS TO NEW DOC | 10 items from E11 |
| INTENTIONALLY NOT ADDED | 6 items from E12 |

---

## Suggested next-step workflow

1. **Review new ARCHITECTURE.md** side-by-side with old one.
2. **Review this extractions doc.** For each MERGE INTO AUDIT item, decide if you want me to actually add it to the audit now or hold until the Bill of Rights pass is also done.
3. **Swap in the new doc** (I recommend: rename old `docs/ARCHITECTURE.md` → `docs/ARCHITECTURE.md.GOLD-2026-04-19` per Refactor Constitution; rename new file to `docs/ARCHITECTURE.md`).
4. **Commit** as a single atomic commit with both the rename and the new content.
5. **Do NOT delete this extractions doc** until we've finished the Bill of Rights pass and merged all extractions into the audit — then it gets archived.

No changes are live until you say go.
