# Kodama — Week 1 PARKED (2026-04-13)

Claude Code headless supervisor. Week 1 calibration completed at 6 of 10 runs.
**Status: parked. Not in progress. Resume with Run #7 (`cal-07-architecture-channels`) whenever ready.**

See `WEEK-1-FINDINGS.md` for full findings ledger and close-out rationale.

## Resume Week 1 (pick up where we left off)
```powershell
~\.kodama\supervisor.ps1
```
Will auto-load `cal-07-architecture-channels`. Daily/weekly counters reset on new date.

## Run-to-completion: 4 runs remaining in queue
- `cal-07-architecture-channels`
- `cal-08-helpers-inventory`
- `cal-09-build-config-report`
- `cal-10-extension-census`

## Dry run (no Claude call)
```powershell
~\.kodama\supervisor.ps1 -DryRun
```

## Kill switch
```powershell
New-Item ~\.kodama\STOP -ItemType File
```

## Rollback any run
```powershell
git -C C:\dev\LUX_GEMINI reset --hard kodama/pre-<timestamp>
```
Week 1 was read-only, so rollback is only meaningful once Week 2 write-mode is enabled.

## Hard-coded limits (edit supervisor.ps1 constants only, per Refactor Constitution v2)
- Worker model: `claude-sonnet-4-6` (Opus never called by Kodama)
- Daily max: 3 runs
- Weekly max: 10 runs
- Reserve floor: refuses launch at combined weekly bar >= 75%

## Canary denylist
`lux-bus.js`, `lux-storage.js`, `runtime.js`, `api/util.js`, `escape-html.js`, `src/main.js`, `helpers/core.js`

In Week 1 (read-only): informational warnings only, no abort.
In Week 2+ (write-mode): hard abort if any canary would be touched.

## Backup state snapshots
- `tasks-queue.json.GOLD` — pre-queue-extension state (2026-04-11)
- `tasks-queue.json.WEEK1-PAUSE.GOLD` — Week 1 close-out (2026-04-13)
- `budget.json.WEEK1-PAUSE.GOLD` — Week 1 close-out budget state
- `supervisor.ps1.WEEK1-PAUSE.GOLD` — pre-Week-2-patch script state

## Fallback
OpenClaw/Simoishi at `~\.openclaw\` is untouched. Still works. Do not delete.

## Week 2 patch scope (not yet written)
See `WEEK-1-FINDINGS.md` "Parked for Week 2 patch" section for full list.

🌳
