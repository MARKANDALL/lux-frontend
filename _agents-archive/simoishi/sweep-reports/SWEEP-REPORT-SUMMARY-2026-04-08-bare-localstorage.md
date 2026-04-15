# Sweep Report (SUMMARY) — bare-localstorage

**Date:** 2026-04-08 16:40 EDT  
**Repo:** `C:\dev\LUX_GEMINI`  
**Sweep type:** `bare-localstorage`

## Headline counts

- **Findings:** 🔴 5 / 🟡 0 / 🔵 0
- **Red-zone exclusions:** 12
- **Rejection-log entries:** 19
- **Mechanical storage hits reviewed:** 28

## Findings by file

| # | Severity | File | Line(s) | One-liner |
|---|----------|------|---------|-----------|
| 1 | 🔴 | `ui/ui-ai-ai-logic/attempt-policy.js` | 15, 24, 63, 64 | Raw `sessionStorage` plus local bare-string session keys bypass the canonical wrapper. |
| 2 | 🔴 | `ui/warp-core.js` | 51, 58, 59 | Raw `sessionStorage` used even though canonical key + helpers already exist. |
| 3 | 🔴 | `features/streaming/transport/session-bootstrap.js` | 13, 20, 21 | Duplicate raw admin-token storage path bypasses centralized helper logic. |
| 4 | 🔴 | `features/harvard/modal-favs.js` | 9, 19, 33, 36 | Canonical keys are used, but raw `localStorage` still bypasses helpers. |
| 5 | 🔴 | `features/results/header.js` | 312, 318 | Raw `sessionStorage` used for nudge flags with ad-hoc helper closures. |

## Rejection log rollup

### Looked like a violation but isn't
- 4 entries
- Canonical wrapper internals plus one comment/example-only hit

### Red-zone file (Rule S12)
- 12 entries
- Files:
  - `_api/util.js`
  - `_api/identity.js`

### Ambiguous or judgment call
- 2 entries
- Files:
  - `ui/ui-ai-ai-logic/attempt-policy.js`
  - `features/results/header.js`

### Out of scope per manifest
- 1 entry
- File:
  - `public/lux-popover.js`

## Notes

- This sweep distinguishes **raw storage access** from **approved wrapper/helper use**.
- The biggest non-red-zone cleanup clusters are:
  - `attempt-policy.js`
  - `warp-core.js`
  - `modal-favs.js`
  - `results/header.js`
- Admin-token raw storage is present, but those hits are red-zone and were logged only.

## Stage note

Stages will be proposed in the morning after Mark reviews this report.

## Report files

- `C:\dev\LUX_GEMINI\SWEEP-REPORT-FULL-2026-04-08-bare-localstorage.md`
- `C:\dev\LUX_GEMINI\SWEEP-REPORT-SUMMARY-2026-04-08-bare-localstorage.md`
