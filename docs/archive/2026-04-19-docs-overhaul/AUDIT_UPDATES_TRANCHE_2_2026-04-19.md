# Audit Updates Ledger — Tranche 2 (2026-04-19)

> **Purpose:** Appends to `docs/AUDIT_UPDATES_2026-04-19.md` (Tranche 1). Tracks every new audit entry added in Tranche 2 — items that were "MERGE INTO AUDIT" candidates from the three extractions docs written earlier today.
>
> **This doc supersedes** `AUDIT_UPDATES_2026-04-19.md` after swap — it incorporates Tranche 1 content and adds Tranche 2. Swap will replace the Tranche 1 file.

---

## Tranche schedule

| Tranche | Scope | Status |
|---|---|---|
| **1** | Mark resolved items in place with evidence | ✅ DONE (committed `1727aac`) |
| **2** | Insert NEW items from the 3 extractions docs (MERGE INTO AUDIT) | ✅ **This pass** |
| 3 | Add current red/yellow zone file lists from Bill of Rights extractions B5/B6 | Pending |

---

## Page-level additions (distributed)

### T2.1 — 🚨 1L.3: `/api/migrate` endpoint called but does not exist

**Audit location:** §1L Save Progress / Auth → Observations → new item after 1L.2

**Source:** `docs/ARCHITECTURE_EXTRACTIONS_2026-04-19.md` E8

**Severity:** 🚨 CRITICAL — affects guest → user history migration on every magic-link login

**Content summary:**
- `ui/auth-dom.js:192` calls `apiFetch("/_api/migrate", ...)`
- Backend has no `/api/migrate` route
- Frontend path is also malformed (`_api/` is a folder prefix for adapters, not a URL path)
- Silent failure — guest history is orphaned on login, no user-visible indicator
- Root cause for checklist item "⚠️ Practice history persists across sessions when logged in"
- Fix requires backend JWT migration work (tracked as handover Tier 3 #31)

---

### T2.2 — 🐛 1D.9: Character encoding garbled symbols in results displays

**Audit location:** §1D Results Display → new "New audit items added 2026-04-19" subsection after Syllable Stress View

**Source:** `docs/ARCHITECTURE_EXTRACTIONS_2026-04-19.md` E2 item 2

**Severity:** 🐛 medium — unclear rep steps, visually jarring

**Content summary:**
- Certain results displays render garbled characters (mojibake / replacement glyphs / unexpected punctuation)
- Pattern not yet characterized
- Likely source: encoding mismatch somewhere between Azure → API → frontend, or IPA font fallback
- Needs repro characterization pass

---

### T2.3 — 🐛 1H.new: Expanded tooltip video/audio desync

**Audit location:** §1H Self-Playback Drawer → new "New audit items added 2026-04-19" subsection

**Source:** `docs/ARCHITECTURE_EXTRACTIONS_2026-04-19.md` E2 item 3

**Severity:** 🐛 medium — desync observed but exact tooltip and repro not pinned down

**Content summary:**
- Expanded tooltip (phoneme detail / syllable detail / attempt-detail modal) has audio/video desync
- Unclear which tooltip modal specifically
- May overlap with 1E phoneme-hover observations

**Note on placement:** I put this in §1H (Self-Playback) but it may belong better in §1E (Phoneme Hover) depending on which tooltip is actually affected. Low-confidence placement — can be moved after the repro is pinned down.

---

## Cross-Cutting additions (new section at end of Project-Wide Issues Log)

### T2.4 — Issue 15 (15a, 15b, 15c): Parked convo issues

**Audit location:** new "Cross-Cutting Findings (2026-04-19)" section

**Source:** `docs/ARCHITECTURE_EXTRACTIONS_2026-04-19.md` E1 (the 3 parked side-issues from old ARCHITECTURE.md Current Hardening Status narrative)

**Content summary:**
- **15a:** Convo SelfPB learner karaoke words in AI Conversations — unconfirmed whether same root cause as resolved Part 10 B.2
- **15b:** End Session / overlay contract — likely dedup with Sign-off Checklist "AI Convo report 404"
- **15c:** Picker drawer carry-over — likely resolved, needs final confirmation

**Dedup notes:**
- 15b is almost certainly the same issue as the Sign-off Checklist's "AI Convo (the report 404 specifically)". When investigating, treat them as one.
- 15a may be the same root cause as B.2 (now resolved) — if convo has its own karaoke wiring separate from publishKaraoke(), that's the real issue to fix.

---

### T2.5 — Issue 16: Project-wide z-index audit (SCOPE UPGRADED)

**Audit location:** new Cross-Cutting Findings section

**Source:** `docs/BILL_OF_RIGHTS_EXTRACTIONS_2026-04-19.md` Fix 7 (single-modal scope), **upgraded** per user instruction during Tranche 2 scoping.

**Original scope:** Align attempt-detail modal (z-index 9999) with metric-modal (10050).

**Upgraded scope:** Project-wide z-index audit against the Bill of Rights Right 8 budget.

**Findings from my scan (29 distinct z-index values):**

Critical:
- Two writers at `999999` (warp.css + audio-inspector.js) — Right 1 violation, need to decide which genuinely needs topmost
- Undocumented `12000` / `12001` tier — "Treaty Compliant" comment but rationale lost
- Two writers at `99999` — possible race if both simultaneous
- `9999` has 18 occurrences — tier is flooded; original Fix 7 concern is one instance of a bigger pattern
- Odd values: `999`, `9998` — probably off-by-one errors

**Grep evidence:** see audit Issue 16 table for the full scan output.

---

### T2.6 — Issue 17: Capture-handler docs outstanding

**Audit location:** new Cross-Cutting Findings section

**Source:** `docs/BILL_OF_RIGHTS_EXTRACTIONS_2026-04-19.md` Fix 4 + Part 10 B.4 ⚠️ PARTIAL marker

**Content summary:**
- Code-level correctness verified: guards in place before `stopPropagation()`
- Documentation comment block (per Fix 4) still not added
- Low-risk zero-risk polish item

---

### T2.7 — Issue 18: R2–R7 innerHTML verification pass

**Audit location:** new Cross-Cutting Findings section

**Source:** `docs/BILL_OF_RIGHTS_EXTRACTIONS_2026-04-19.md` B2

**Content summary:**
- R1 (auth-dom.js email XSS) fully resolved — verified at `auth-dom.js:119` using `${escHtml(email)}`
- R2–R7 need re-verification — line numbers have drifted, some may be fixed as side effects
- Specifically R3 (err.word in render-helpers.js:116) may be related to the XSS fix on summary.js:158 that landed in handover Phase B — need to confirm whether render-helpers has its own call site
- Estimated 30–60 min for full verification pass

---

## Summary of Tranche 2

| Addition Type | Count | Location |
|---|---|---|
| Page-level new items | 3 | §1L.3 (critical), §1D.9 (medium), §1H.new (medium) |
| Cross-cutting new section | 1 | new "Cross-Cutting Findings (2026-04-19)" section |
| Cross-cutting items inside new section | 4 | Issue 15 (subsumes 3 parked items), Issue 16 (z-index), Issue 17 (capture docs), Issue 18 (innerHTML verification) |
| Banner update | 1 | top-of-doc revision note updated to reflect Tranches 1+2 done |
| **Total additions** | **9** | |
| Lines added in Tranche 2 | 99 | |
| Total lines now | 1,626 | (was 1,527 after Tranche 1, 1,499 original) |

---

## Completeness check

**All MERGE INTO AUDIT items from the 3 extractions docs now accounted for:**

From `ARCHITECTURE_EXTRACTIONS_2026-04-19.md`:
- ✅ E1 parked side-issues → Issue 15 (a/b/c)
- ✅ E2 Known Issues new items → §1D.9 (encoding), §1H.new (tooltip desync)
- ✅ E8 `/api/migrate` bug → §1L.3

From `BILL_OF_RIGHTS_EXTRACTIONS_2026-04-19.md`:
- ✅ Fix 4 (capture handlers docs) → Issue 17
- ✅ Fix 7 (z-index) → Issue 16 (upgraded scope)
- ✅ R2–R7 innerHTML items → Issue 18

From `MASTER_IDEA_CATALOG_EXTRACTIONS_2026-04-19.md`:
- ✅ Zero MERGE INTO AUDIT items (by design — catalog pass only produced inbound syncs to catalog, not outbound audit items)

**Everything lands.** No MERGE INTO AUDIT items got lost in translation.

---

## Tranche 3 preview

Add current red/yellow zone file lists from Bill of Rights extractions B5/B6 to the audit. Current counts:
- Red zone (>400 lines, non-data, non-test): 7 files
- Yellow zone (250–400 lines, non-data, non-test): 43 files

Likely placement: new appendix at the end of the audit, or new cross-cutting Issue 19.

---

## Suggested swap

Pre-flight:

```powershell
Get-ChildItem -Path $env:USERPROFILE\Downloads -Filter "AUDIT*" | Select-Object Name, LastWriteTime
```

Should show `AUDIT_NEW_2026-04-19_TRANCHE2.md` and `AUDIT_UPDATES_TRANCHE_2_2026-04-19.md`.

Swap (overwrites Tranche 1 audit with Tranche 2; appends Tranche 2 ledger as separate file for paper trail):

```powershell
cd C:\dev\LUX_GEMINI; Copy-Item docs\LUX_PROJECT_AUDIT_2026-04-17.md docs\LUX_PROJECT_AUDIT_2026-04-17.md.tranche1.2026-04-19.GOLD; Move-Item $env:USERPROFILE\Downloads\AUDIT_NEW_2026-04-19_TRANCHE2.md docs\LUX_PROJECT_AUDIT_2026-04-17.md -Force; Move-Item $env:USERPROFILE\Downloads\AUDIT_UPDATES_TRANCHE_2_2026-04-19.md docs\AUDIT_UPDATES_TRANCHE_2_2026-04-19.md; git add docs\LUX_PROJECT_AUDIT_2026-04-17.md docs\AUDIT_UPDATES_TRANCHE_2_2026-04-19.md; git commit -m "docs: audit Tranche 2 - 9 new entries from extractions docs, z-index scoped up to project-wide"; git tag audit-tranche-2-2026-04-19; git push; git push --tags
```

Note: `.GOLD` backup this time uses a tranche1-qualifier since we already have a top-level `.GOLD` from before Tranche 1. Also uses `-Force` on the Move-Item because the target already exists (Tranche 1 content).

No changes are live until you run the swap.
