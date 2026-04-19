# Audit Updates Ledger — Tranche 1 (2026-04-19)

> **Purpose:** Tracks every resolution marker, status update, and annotation added to `docs/LUX_PROJECT_AUDIT_2026-04-17.md` during the 2026-04-19 update pass. This is Tranche 1 of a planned 3-tranche pass on the audit.
>
> **Rules followed in this pass:**
> 1. **Zero content removed.** Original audit content preserved verbatim.
> 2. **Markers appended, not inline-edited.** Resolution notes added as blockquotes or labeled subsections immediately adjacent to the original item.
> 3. **Every marker carries grep evidence.** No "I think it's resolved" — every ✅ is backed by a verification against the current repomix.
> 4. **Source provenance noted.** Every resolution cites either a repomix file+line reference or a commit hash.
>
> **Companion docs:** the three extraction ledgers from earlier today in `docs/ARCHITECTURE_EXTRACTIONS_2026-04-19.md`, `docs/BILL_OF_RIGHTS_EXTRACTIONS_2026-04-19.md`, `docs/MASTER_IDEA_CATALOG_EXTRACTIONS_2026-04-19.md`.

---

## Tranche schedule

| Tranche | Scope | Status |
|---|---|---|
| **1** | Mark resolved items in place with evidence | **This document — DONE 2026-04-19** |
| 2 | Insert NEW items from the 3 extractions docs (MERGE INTO AUDIT) | Pending |
| 3 | Add current red/yellow zone file lists from Bill of Rights extractions B5/B6 | Pending |

---

## T1.1 — Bug 1A.1: `setString is not defined` in `modal-actions.js`

**Audit location:** `docs/LUX_PROJECT_AUDIT_2026-04-17.md` → Page 1: Practice Skills → §1A App Boot & Layout → Bugs / Console Errors

**Marker added:**

> ✅ RESOLVED 2026-04-19: `setString` is now properly imported at `features/harvard/modal-actions.js:8` from `app-core/lux-storage.js` (alongside `K_HARVARD_LAST` and `K_PASSAGES_LAST`). Call sites at lines 96 and 133 now work correctly. Resolution tied to the broader lux-storage `K_` constant migration. Verified against repomix 2026-04-19.

**Grep evidence:**

```
features/harvard/modal-actions.js:8: import { K_HARVARD_LAST, K_PASSAGES_LAST, setString } from '../../app-core/lux-storage.js';
features/harvard/modal-actions.js:96: setString(K_HARVARD_LAST, String(n));
features/harvard/modal-actions.js:133: setString(K_PASSAGES_LAST, String(key));
```

The original `ReferenceError: setString is not defined` would have occurred when `selectHarvardList` ran without the import in scope. Import now present, function resolved.

---

## T1.2 — Bug 1D.0: `mountVoiceMirrorButton is not defined` in `summary.js`

**Audit location:** §1D Results Display → Bugs / Console Errors → Bug 1D.0

**Marker added:**

> ✅ RESOLVED 2026-04-19: `mountVoiceMirrorButton` is now properly imported at `features/results/summary.js:14` from `../voice-mirror/voice-mirror.js`. Call site at line 182 works correctly. Also note: XSS hardening was applied at `summary.js:158` (handover Phase B) using `escapeHtml` on `err.word`, and `escapeHtml` is now imported at line 15 from `../../helpers/escape-html.js`. Verified against repomix 2026-04-19.

**Grep evidence:**

```
features/results/summary.js:14: import { mountVoiceMirrorButton } from "../voice-mirror/voice-mirror.js";
features/results/summary.js:15: import { escapeHtml } from "../../helpers/escape-html.js";
features/results/summary.js:182: mountVoiceMirrorButton($out, referenceText);
```

Covers two concerns: (a) the `mountVoiceMirrorButton` missing-import error is fixed; (b) a related XSS fix on `err.word` landed in the same file, which was tracked as audit item R3 in the Bill of Rights Part C findings.

---

## T1.3 — Part 10 B.1: `window.LuxLastRecordingBlob` dual-write

**Audit location:** Part 10 → B) Findings Table → B.1

**Marker added:**

> ✅ RESOLVED 2026-04-19: Verified against repomix. `window.LuxLastRecordingBlob` has exactly ONE writer: `app-core/runtime.js:49` (via `setLastRecording()`). `features/convo/convo-turn.js` no longer assigns to the window global directly — it calls `setLastRecording()`. The Bill of Rights Global Ownership Map (Part A.2) now tracks this as the canonical owner. Commit `c89c937`.

**Grep evidence:**

```
app-core/runtime.js:49: window.LuxLastRecordingBlob = blob;
app-core/runtime.js:50: window.LuxLastRecordingMeta = meta;
```

Zero other writers found in non-test JS files. `convo-turn.js` now calls `setLastRecording()` from runtime.

---

## T1.4 — Part 10 B.2: Karaoke globals written by 3 modules

**Audit location:** Part 10 → B.2

**Marker added:**

> ✅ RESOLVED 2026-04-19: Verified against repomix. `publishKaraoke()` at `features/features/tts/player-ui/karaoke.js:93-96` is now the sole writer of `window.LuxKaraokeSource`, `window.LuxKaraokeTimings`, and `window.LuxTTSWordTimings`. SelfPB modules (`selfpb/controls.js`, `selfpb/karaoke.js`) no longer assign to these globals directly — they call `publishKaraoke()`. Commit `aaa3832`.

**Grep evidence:**

```
features/features/tts/player-ui/karaoke.js:93: window.LuxKaraokeSource = source;
features/features/tts/player-ui/karaoke.js:94: window.LuxKaraokeTimings = timings;
features/features/tts/player-ui/karaoke.js:96: window.LuxTTSWordTimings = ttsTimings;
```

Zero other writers in non-test JS files. The 3-writer conflict described in the original finding is fully resolved.

---

## T1.5 — Part 10 B.3: `document.body.style.overflow` toggled by 2 modals

**Audit location:** Part 10 → B.3

**Marker added:**

> ✅ RESOLVED 2026-04-19: Verified against repomix. `helpers/body-scroll-lock.js` exists and is the sole writer of `document.body.style.overflow` (lines 8, 16). Both modal files now import and use the helper: `features/interactions/metric-modal/events.js:6` imports `lockBodyScroll`/`unlockBodyScroll`, calls at lines 75 and 119; `features/progress/attempt-detail/modal-shell.js:5` imports them, calls at lines 57 and 73. Ref-counted lock prevents the race described below. Commit `2f3292b`.

**Grep evidence:**

```
helpers/body-scroll-lock.js:8: try { document.body.style.overflow = "hidden"; }
helpers/body-scroll-lock.js:16: try { document.body.style.overflow = ""; }
features/interactions/metric-modal/events.js:6: import { lockBodyScroll, unlockBodyScroll } from "../../../helpers/body-scroll-lock.js";
features/interactions/metric-modal/events.js:75: unlockBodyScroll();
features/interactions/metric-modal/events.js:119: lockBodyScroll();
features/progress/attempt-detail/modal-shell.js:5: import { lockBodyScroll, unlockBodyScroll } from "../../../helpers/body-scroll-lock.js";
features/progress/attempt-detail/modal-shell.js:57: unlockBodyScroll();
features/progress/attempt-detail/modal-shell.js:73: lockBodyScroll();
```

Zero direct `body.style.overflow` writes outside the helper. Race condition cannot occur.

---

## T1.6 — Part 10 B.4: 3 capture-phase document click handlers

**Audit location:** Part 10 → B.4

**Marker added (⚠️ PARTIAL, not ✅ RESOLVED):**

> ⚠️ PARTIAL 2026-04-19: Code is safe — verified the guard pattern (`if (!chip) return` before `stopPropagation()`) is correctly in place in `chip-events.js`, `metric-modal/events.js`, and `panel-events.js`. No unsafe capture handlers remain. However, **documentation of the interaction matrix between these 3 handlers still has not been added** (Fix 4 from Bill of Rights Part D is outstanding). Low priority polish item.

**Reasoning:** Partial resolution. Code-level correctness is verified, but the documentation Fix 4 called for (comment blocks at the top of each handler explaining the interaction matrix) hasn't landed. Tracked as a still-open minor item.

---

## T1.7 — Part 10 B.12: Double-init guard (MutationObserver + setInterval)

**Audit location:** Part 10 → B.12

**Marker added:**

> ✅ RESOLVED 2026-04-19: Verified against repomix. `features/convo/convo-bootstrap.js` contains ZERO `setInterval`, `clearInterval`, or `MutationObserver` references. The forever-poll AND the dead MutationObserver have both been removed entirely. Commit `6285941` removed the MutationObserver; the setInterval was removed in subsequent work.

**Grep evidence:**

```
(zero matches for setInterval|clearInterval|MutationObserver in features/convo/convo-bootstrap.js)
```

The entire concern — CPU-consuming forever-poll plus dead observer — is gone.

---

## T1.8 — Part D Fix #1: `convo-turn.js` → use `setLastRecording()`

**Audit location:** Part 10 → D) Quick Verification Checklist → Fix #1

**Marker added:**

> ✅ RESOLVED 2026-04-19: Fix has shipped. `window.LuxLastRecordingBlob` has a single writer at `app-core/runtime.js:49` via `setLastRecording()`. `convo-turn.js` no longer assigns directly. See Part 10 B.1 for full verification.

**Reasoning:** Cross-reference to B.1 (which already has its own detailed grep evidence). Fix #1 is the "how to verify" checklist for the B.1 problem; since B.1 is resolved, Fix #1 is also resolved.

---

## T1.9 — Part D Fix #4: Body scroll lock utility

**Audit location:** Part 10 → D) Quick Verification Checklist → Fix #4

**Marker added:**

> ✅ RESOLVED 2026-04-19: `helpers/body-scroll-lock.js` exists with ref-counted `lockBodyScroll()` / `unlockBodyScroll()`. Both modal files import and use the helper. See Part 10 B.3 for full verification.

**Reasoning:** Cross-reference to B.3 (detailed evidence there).

---

## T1.10 — Part D Fix #6: Karaoke globals centralization

**Audit location:** Part 10 → D) Quick Verification Checklist → Fix #6

**Marker added:**

> ✅ RESOLVED 2026-04-19: `publishKaraoke()` at `features/features/tts/player-ui/karaoke.js:93-96` is the sole writer of karaoke window globals. See Part 10 B.2 for full verification.

**Reasoning:** Cross-reference to B.2.

---

## T1.11 — Top-of-document revision banner

**Audit location:** Top of audit, immediately after the "Strategic context (read this first)" quote block

**Content added:** A new quote block labeled "2026-04-19 update pass (this is Tranche 1 of 3)" explaining:
- What was done in this tranche (resolution markers with grep evidence)
- What Tranches 2 and 3 will do
- Pointer to this ledger for full change log

---

## What I intentionally did NOT mark in Tranche 1

1. **Part 10 B.5** (window.luxTTS dual-init) — already had `✅ RESOLVED` marker in the original 2026-04-17 audit. No change needed.

2. **Part 10 B.6–B.11, B.13** (Postgres pool, admin-label-user dead copy, numOrNull/safeNum, normToken, CORS, clampInt, hardcoded credentials) — these are **backend** issues in the `luxury-language-api` repo. I only audited the frontend repomix today, so I can't mark these resolved/unresolved with evidence. They require a backend repomix audit, which is out of scope for today's pass.

3. **Part D Fix #2** (Extract `lib/pool.js`) — same reason: backend.

4. **Part D Fix #3** (Delete `admin/admin-label-user.js`) — same reason: backend.

5. **Part D Fix #5** (Remove route-level `cors()` overrides) — same reason: backend.

6. **Page 1–6 observations and polish notes** that don't have direct code evidence — e.g., "1A.3 Troubled Sounds labeling unclear" is a UX observation, not a bug with code-verifiable status. Tranche 2 will handle any of these that got fixed as side effects of other work.

7. **Checklist items with ⚠️ marks** (e.g., "Practice history persists across sessions when logged in — think it works but not 100% certain") — these are user-testing-confirmations, not grep-confirmations. Needs Mark to run the smoke test.

---

## Summary of Tranche 1

| Marker Type | Count |
|---|---|
| ✅ RESOLVED added | 9 |
| ⚠️ PARTIAL added | 1 |
| Top-of-doc revision banner | 1 |
| **Total additions** | **11** |
| Lines added to audit | 28 |
| Lines removed from audit | 0 |

Original audit was 1,499 lines. After Tranche 1: 1,527 lines.

---

## Tranche 2 preview (what's next)

Per today's plan:

- From `ARCHITECTURE_EXTRACTIONS_2026-04-19.md`: 3 parked side-issues (E1), 2 new Known-Issues items (character encoding, tooltip desync), /api/migrate bug (E8)
- From `BILL_OF_RIGHTS_EXTRACTIONS_2026-04-19.md`: Fix 4 documentation still open, Fix 7 z-index alignment, R2–R7 innerHTML verification items
- From `MASTER_IDEA_CATALOG_EXTRACTIONS_2026-04-19.md`: zero items (confirmed)

Estimated ~8–12 new audit entries, each placed in the most natural existing section or in a new "Cross-Cutting Findings (2026-04-19)" section if no good home exists.

## Tranche 3 preview

Add current red/yellow zone file lists from Bill of Rights extractions B5/B6 as a new audit subsection or appendix. Current counts: 7 red zone files, 43 yellow zone files.

---

## Suggested next-step workflow

1. **Review the updated audit** (`AUDIT_NEW_2026-04-19_TRANCHE1.md`) — scan for the 10 markers to confirm they read correctly alongside the original content.
2. **Review this ledger** — confirm the grep evidence is sufficient.
3. **Swap in the Tranche 1 audit.** Swap command below.
4. **Then send "continue"** for Tranche 2.

### Recommended PowerShell swap

```powershell
cd C:\dev\LUX_GEMINI; Move-Item docs\LUX_PROJECT_AUDIT_2026-04-17.md docs\LUX_PROJECT_AUDIT_2026-04-17.md.2026-04-19.GOLD; Move-Item $env:USERPROFILE\Downloads\AUDIT_NEW_2026-04-19_TRANCHE1.md docs\LUX_PROJECT_AUDIT_2026-04-17.md; Move-Item $env:USERPROFILE\Downloads\AUDIT_UPDATES_2026-04-19.md docs\AUDIT_UPDATES_2026-04-19.md; git add docs\LUX_PROJECT_AUDIT_2026-04-17.md docs\AUDIT_UPDATES_2026-04-19.md; git commit -m "docs: audit Tranche 1 - 10 resolution markers with grep evidence"; git tag audit-tranche-1-2026-04-19; git push; git push --tags
```

**Pre-flight check:**

```powershell
Get-ChildItem -Path $env:USERPROFILE\Downloads -Filter "AUDIT*" | Select-Object Name, LastWriteTime
```

You should see both `AUDIT_NEW_2026-04-19_TRANCHE1.md` and `AUDIT_UPDATES_2026-04-19.md`.

No changes are live until you run the swap.
