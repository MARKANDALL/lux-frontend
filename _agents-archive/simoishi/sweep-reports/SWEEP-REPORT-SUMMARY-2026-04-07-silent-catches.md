# Sweep Report (SUMMARY) — silent-catches

**Date:** 2026-04-07 22:40 EDT  
**Repo:** `C:\dev\LUX_GEMINI`  
**Sweep type:** `silent-catches`

## Headline counts

- **Findings:** 🔴 19 / 🟡 0 / 🔵 0
- **Red-zone exclusions:** 1
- **Rejection-log entries:** 24
- **Files scanned:** 317
- **Pattern hits reviewed:** 382

## Findings by file

| # | Severity | File | Line(s) | One-liner |
|---|----------|------|---------|-----------|
| 1 | 🔴 | `app-core/state.js` | 141 | Empty promise catch silently swallows service-worker unregister failures. |
| 2 | 🔴 | `features/features/tts/player-core.js` | 41 | Silent fallback to `{}` in `getVoiceCaps()`. |
| 3 | 🔴 | `features/features/tts/player-core.js` | 59 | Silent fallback to empty Blob in `b64ToBlob()`. |
| 4 | 🔴 | `features/features/tts/boot-tts.js` | 157 | Silent catch resets `_playerBooted` with no warning. |
| 5 | 🔴 | `features/streaming/app.js` | 46 | Silent fallback to `false` in debug-flag read. |
| 6 | 🔴 | `features/streaming/transport/realtime-webrtc/mic-meter.js` | 53 | Mic-meter startup failure is fully silent. |
| 7 | 🔴 | `features/life/app.js` | 11 | Crypto RNG fallback path is silent. |
| 8 | 🔴 | `features/next-activity/next-activity.js` | 19 | Next-activity consume failure is silent before cleanup. |
| 9 | 🔴 | `features/next-activity/next-practice.js` | 97 | Passage label lookup fallback is silent. |
| 10 | 🔴 | `features/harvard/index.js` | 22 | `safeParseJson()` silently swallows parse errors. |
| 11 | 🔴 | `features/harvard/index.js` | 44 | `readRandomBag()` silently falls back to `[]`. |
| 12 | 🔴 | `features/harvard/modal-favs.js` | 14 | Harvard favorites parse/load failure is silent. |
| 13 | 🔴 | `features/harvard/modal-favs.js` | 24 | Passage favorites parse/load failure is silent. |
| 14 | 🔴 | `features/my-words/service.js` | 12 | Auth user lookup silently returns `null`. |
| 15 | 🔴 | `features/progress/wordcloud/side-drawers.js` | 11 | Drawer-state parse fallback is silent. |
| 16 | 🔴 | `features/interactions/ph-hover/tooltip-modal.js` | 75 | Primary video play failure is silent before muted fallback. |
| 17 | 🔴 | `features/interactions/ph-hover/tooltip-video.js` | 106 | Same silent primary play failure in tooltip variant. |
| 18 | 🔴 | `ui/components/trouble-chips.js` | 168 | Comment-only catch swallows scroll failures silently. |
| 19 | 🔴 | `features/recorder/audio-mode.js`; `features/recorder/audio-mode-core.js` | 52; 51; 64 | Three recorder audio-mode fallbacks are silent. |

## Rejection log rollup

### Looked like a violation but isn't
- 11 entries
- All 11 are from the explicit approved wrapper-exclusion set:
  - `app-core/lux-storage.js`
  - `app-core/lux-bus.js`
  - `ui/lux-warn.js`

### Red-zone file (Rule S12)
- 1 entry
- `_api/util.js:25` — **🛑 RED-ZONE — MANUAL REVIEW ONLY**

### Ambiguous or judgment call
- 6 entries
- Files:
  - `ui/warp-nav.js`
  - `ui/ui-ai-ai-logic/attempt-policy.js`
  - `features/convo/picker-deck/cefr-hint-badge.js`
  - `features/life/storage.js`
  - `features/streaming/transport/realtime-webrtc/message-handler.js`
  - `features/results/header.js`

### Out of scope per manifest
- 6 entries
- Files:
  - `public/lux-popover.js`
  - `public/vendor/wavesurfer-7.8.11.min.js`
  - `src/data/index.js`

## Recommended attack order

Reasoning used:
- silent-catches is **ungraduated** in the Trust Ledger
- Rule S1 means **single-file only** for each proposed stage
- Rule S10 means only silent-catch fixes in a stage
- Rule S13 caps proposals at **5 stages max this session**

Suggested cleanup order:
1. `app-core/state.js` — isolated one-line promise catch; low blast radius.
2. `features/features/tts/boot-tts.js` — single silent catch, very localized.
3. `features/streaming/app.js` — one localized fallback catch in debug read path.
4. `features/life/app.js` — one localized fallback catch in RNG helper.
5. `features/my-words/service.js` — one localized auth fallback catch.

## Stages this sweep would generate

Per Rule S1, every stage below is **exactly one file**.

- **Stage 1 candidate:** `app-core/state.js` — single file only
- **Stage 2 candidate:** `features/features/tts/boot-tts.js` — single file only
- **Stage 3 candidate:** `features/streaming/app.js` — single file only
- **Stage 4 candidate:** `features/life/app.js` — single file only
- **Stage 5 candidate:** `features/my-words/service.js` — single file only

Additional findings exist, but they are **not staged here** because Rule S13 limits this session to at most 5 stages.

## Report files

- `C:\dev\LUX_GEMINI\SWEEP-REPORT-FULL-2026-04-07-silent-catches.md`
- `C:\dev\LUX_GEMINI\SWEEP-REPORT-SUMMARY-2026-04-07-silent-catches.md`
