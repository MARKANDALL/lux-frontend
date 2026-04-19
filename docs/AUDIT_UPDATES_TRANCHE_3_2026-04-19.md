# Audit Updates Ledger — Tranche 3 (2026-04-19)

> **Purpose:** Final tranche of the 2026-04-19 audit update pass. Adds Issue 19 (current red/yellow zone files) to the audit. Completes the 3-tranche pass.

---

## Tranche schedule (final status)

| Tranche | Scope | Status |
|---|---|---|
| 1 | Mark resolved items in place with evidence | ✅ DONE (committed `1727aac`) |
| 2 | Insert NEW items from 3 extractions docs (MERGE INTO AUDIT) | ✅ DONE (committed `7d324a2`) |
| **3** | Add current red/yellow zone file lists from Bill of Rights extractions B5/B6 | ✅ **This pass** |

---

## T3.1 — Issue 19: Current red/yellow zone files (module size budget violations)

**Audit location:** Cross-Cutting Findings (2026-04-19) → Issue 19 (appended after Issue 18)

**Source:** `docs/BILL_OF_RIGHTS_EXTRACTIONS_2026-04-19.md` B5 (red zone) and B6 (yellow zone)

**Content added:**

1. **Threshold reminder** — restates the Bill of Rights Right 10 thresholds (Green/Yellow/Red) and the exemption list (generated data, scenario configs, vendor files, admin pages).

2. **Red Zone table** — full list of 7 files currently over 400 lines:
   - `features/voice-mirror/voice-mirror.js` (480)
   - `features/voice-mirror/voice-onboarding.js` (459)
   - `features/features/tts/player-ui.js` (459)
   - `features/convo/convo-bootstrap.js` (427)
   - `features/recorder/audio-inspector.js` (422)
   - `features/convo/convo-report-ui.js` (405)
   - `features/convo/convo-layout.js` (405)

3. **Red Zone observations** — Voice Mirror is the biggest new cluster; Convo family has 3 of 7 red-zone files; none blocking launch but all subject to split-first-before-adding-functionality per Bill of Rights Part A.4.

4. **Yellow Zone table (top 10 of 43)** — listed by size descending:
   - `src/data/phonemes/details.js` (394)
   - `features/convo/scene-atmo.js` (394)
   - `features/results/syllables/cmu-stress.js` (393)
   - `features/features/selfpb/dom.js` (390)
   - `features/convo/picker-deck/cefr-hint-badge.js` (382)
   - `features/streaming/app.js` (382)
   - `src/main.js` (377)
   - `features/convo/characters-drawer.js` (373)
   - `features/interactions/ph-hover/tooltip-modal.js` (368)
   - `features/results/header.js` (356)

5. **Yellow Zone observations** — grew from ~10 at prior audit to 43 (expected given repo growth); top of yellow zone (394 in two files) is one refactor away from red; several pair with red-zone files.

6. **Rationale paragraph** — explicitly explains why this lives in the audit (current violators = audit data) and not in the Bill of Rights (which only defines thresholds). Prevents future drift.

**Scan methodology:** Python script on repomix; excluded `test`, `_agents-archive`, data files, content config, vendor. Verified 2026-04-19.

---

## T3.2 — Top-of-document revision banner updated to "all 3 tranches complete"

**Audit location:** Top-of-doc revision note

**Content change:** Banner updated from "Tranches 1–2 of 3 complete" to "all 3 tranches complete". Explicit mention added of the Issue 19 addition (red/yellow zone lists). Added pointer to companion ledger `AUDIT_UPDATES_TRANCHE_3_2026-04-19.md`.

---

## Summary of Tranche 3

| Addition Type | Count |
|---|---|
| New Issues added | 1 (Issue 19) |
| New tables | 2 (red zone full, yellow zone top-10) |
| Banner update | 1 (all-tranches-complete) |
| Lines added | ~66 |
| Total audit lines | 1,692 |

Original audit: 1,499 → T1: 1,527 → T2: 1,626 → **T3: 1,692**. Net +193 lines across all three tranches.

---

## Completeness of 2026-04-19 audit update pass

**Everything from the three extractions docs now accounted for in the audit:**

| Source extraction doc | MERGE INTO AUDIT items | All landed? |
|---|---|---|
| `ARCHITECTURE_EXTRACTIONS_2026-04-19.md` | 6 (3 parked, 2 new issues, /api/migrate) | ✅ Yes (T2: Issue 15 + §1D.9 + §1H.new + §1L.3) |
| `BILL_OF_RIGHTS_EXTRACTIONS_2026-04-19.md` | Fix 4, Fix 7, R2–R7, red/yellow zone | ✅ Yes (T2: Issue 17 + Issue 16 + Issue 18; T3: Issue 19) |
| `MASTER_IDEA_CATALOG_EXTRACTIONS_2026-04-19.md` | 0 (by design — catalog pass was inbound-only) | N/A |

**Nothing lost. Nothing duplicated. Source provenance preserved on every item.**

---

## What the audit update pass accomplished today

1. **Resolution markers** on 10 items (Tranche 1) — tells future readers what's genuinely done and what's still open, with grep evidence per item.
2. **9 new items merged in** (Tranche 2) from the three scaffolding-doc rewrites — so the audit is the authoritative list of open work across the whole project.
3. **Current red/yellow zone snapshot** (Tranche 3) — so module-size-budget enforcement has a living reference.
4. **Three ledger docs** — full paper trail of what changed and why.
5. **Zero content lost** — every word of the original 2026-04-17 audit is still there. All additions are annotative.

The audit is now the canonical single source of truth for "what's open across Lux." The three scaffolding docs (ARCHITECTURE, Bill of Rights, Master Idea Catalog) stay clean and focused. Work items don't drift between them anymore.

---

## What comes next in today's agenda

Per the master plan:

- ✅ Pillar #1: ARCHITECTURE.md rewrite
- ✅ Pillar #2: Bill of Rights rewrite
- ✅ Pillar #3: Master Idea Catalog pass
- ✅ Pillar #4: Audit (Tranches 1+2+3) — **DONE after this swap**
- ⏳ **Next: `docs/README.md` pillars guide** — single short doc defining the role of each pillar, to prevent future drift
- ⏳ Then: Tier 2 routine-adjacent items (#14 mdToHtml consolidation, #15 vitest migration, #16 gpt-tokenizer removal)
- ⏳ Then: Routines review (check the 15 routines are in a good place, consider Opus→Sonnet downgrades)

---

## Suggested swap (Tranche 3)

Pre-flight:

```powershell
Get-ChildItem -Path $env:USERPROFILE\Downloads -Filter "AUDIT*" | Select-Object Name, LastWriteTime
```

Should show `AUDIT_NEW_2026-04-19_TRANCHE3.md` and `AUDIT_UPDATES_TRANCHE_3_2026-04-19.md`.

Swap (same pattern as Tranche 2 — uses `-Force` because the target has Tranche 2 content; creates a `.tranche2.2026-04-19.GOLD` backup before overwriting):

```powershell
cd C:\dev\LUX_GEMINI; Copy-Item docs\LUX_PROJECT_AUDIT_2026-04-17.md docs\LUX_PROJECT_AUDIT_2026-04-17.md.tranche2.2026-04-19.GOLD; Move-Item $env:USERPROFILE\Downloads\AUDIT_NEW_2026-04-19_TRANCHE3.md docs\LUX_PROJECT_AUDIT_2026-04-17.md -Force; Move-Item $env:USERPROFILE\Downloads\AUDIT_UPDATES_TRANCHE_3_2026-04-19.md docs\AUDIT_UPDATES_TRANCHE_3_2026-04-19.md; git add docs\LUX_PROJECT_AUDIT_2026-04-17.md docs\AUDIT_UPDATES_TRANCHE_3_2026-04-19.md; git commit -m "docs: audit Tranche 3 - Issue 19 red/yellow zone file lists; all 4 pillars complete"; git tag audit-tranche-3-2026-04-19; git tag docs-overhaul-complete-2026-04-19; git push; git push --tags
```

Note: added a second tag `docs-overhaul-complete-2026-04-19` to mark the milestone — all four pillars cleaned up in one day.

No changes are live until you run the swap.
