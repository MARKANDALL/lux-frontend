# ~\.kodama\supervisor.ps1
# Kodama supervisor — Week 2 patched, Week 3 hardened (Patch 8)
# Worker: Sonnet 4.6 default. Per-task model override supported.

param(
  [switch]$DryRun,
  [switch]$WriteMode
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# ─── HARD-CODED CONSTANTS (do not move to config) ───
$MODEL          = "claude-sonnet-4-6"
$DAILY_MAX      = 10
$WEEKLY_MAX     = 40
$RESERVE_FLOOR  = 75   # refuse launch if weekly_bar_pct >= this
$KODAMA_DIR     = "$env:USERPROFILE\.kodama"
$REPO_DIR       = "C:\dev\LUX_GEMINI"
$CANARIES = @(
  "lux-bus.js","lux-storage.js","runtime.js","api/util.js",
  "escape-html.js","src/main.js","helpers/core.js"
)

# ─── PATHS ───
$STOP_FILE   = Join-Path $KODAMA_DIR "STOP"
$BUDGET_FILE = Join-Path $KODAMA_DIR "budget.json"
$QUEUE_FILE  = Join-Path $KODAMA_DIR "tasks-queue.json"
$LOG_FILE    = Join-Path $KODAMA_DIR "run-log.jsonl"

function Write-Log($obj) {
  ($obj | ConvertTo-Json -Compress -Depth 10) | Add-Content -Path $LOG_FILE
}

function Abort($reason) {
  Write-Host "`n[KODAMA] ABORT: $reason" -ForegroundColor Red
  Write-Log @{ event="abort"; reason=$reason; ts=(Get-Date -Format o) }
  exit 1
}

# ─── 1. STOP file check (always first) ───
if (Test-Path $STOP_FILE) { Abort "STOP file present at $STOP_FILE" }

# ─── 2. Load budget ───
if (-not (Test-Path $BUDGET_FILE)) { Abort "budget.json missing" }
$budget = Get-Content $BUDGET_FILE -Raw | ConvertFrom-Json

# ─── 3. Reset daily counter if date changed ───
$today = Get-Date -Format "yyyy-MM-dd"
if ($budget.last_run_date -ne $today) {
  $budget.runs_today = 0
  $budget.last_run_date = $today
}

# ─── 4. Budget guards ───
if ($budget.weekly_bar_pct -ge $RESERVE_FLOOR) {
  Abort "Weekly bar at $($budget.weekly_bar_pct)% (floor $RESERVE_FLOOR%)"
}
if ($budget.runs_today -ge $DAILY_MAX) {
  Abort "Daily cap hit ($($budget.runs_today)/$DAILY_MAX)"
}
if ($budget.runs_this_week -ge $WEEKLY_MAX) {
  Abort "Weekly cap hit ($($budget.runs_this_week)/$WEEKLY_MAX)"
}

# ─── 5. Load queue ───
if (-not (Test-Path $QUEUE_FILE)) { Abort "tasks-queue.json missing" }
$queueObj = Get-Content $QUEUE_FILE -Raw | ConvertFrom-Json
if ($queueObj.tasks.Count -eq 0) { Abort "Queue empty" }
$task = $queueObj.tasks[0]

# ─── 5b. Canary hard-abort: scan task prompt for canary filenames ───
$promptCanaryHit = $CANARIES | Where-Object { $task.prompt -match [regex]::Escape($_) }
if ($promptCanaryHit) {
  Write-Log @{ event="canary_abort"; task_id=$task.id; canary_hits=@($promptCanaryHit); ts=(Get-Date -Format o) }
  Abort "Canary file(s) in task prompt: $($promptCanaryHit -join ', ')"
}

# Per-task model override (falls back to default $MODEL if absent)
$taskModel = if ($task.PSObject.Properties.Name -contains "model" -and $task.model) { $task.model } else { $MODEL }

# ─── 6. Present task and ask for GO ───
Write-Host "`n─── KODAMA RUN ───" -ForegroundColor Green
Write-Host "Task ID     : $($task.id)"
Write-Host "Mode        : $(if ($WriteMode) { 'WRITE-MODE' } else { 'READ-ONLY' })"
Write-Host "Model       : $taskModel$(if ($taskModel -ne $MODEL) { ' (per-task override)' })"
Write-Host "Prompt      : $($task.prompt)"
Write-Host "Budget      : $($budget.runs_today)/$DAILY_MAX today, $($budget.runs_this_week)/$WEEKLY_MAX week, bar $($budget.weekly_bar_pct)%"
Write-Host ""

if ($DryRun) {
  Write-Host "[DRY-RUN] Would launch. Exiting without call." -ForegroundColor Yellow
  exit 0
}

$approval = Read-Host "Type GO to launch, anything else to skip"
if ($approval -ne "GO") { Abort "User skipped (input: $approval)" }

# ─── 7. Git checkpoint tag (pre) ───
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$tagPre  = "kodama/pre-$ts"
$tagPost = "kodama/post-$ts"
try {
  git -C $REPO_DIR tag $tagPre 2>&1 | Out-Null
} catch {
  Abort "git pre-tag failed: $_"
}

# ─── 8. Call Claude (headless) ───
$bar_before = $budget.weekly_bar_pct
$t0 = Get-Date
$claudeOutput = $null
$claudeError  = $null
try {
  if ($WriteMode) {
    $claudeOutput = claude -p $task.prompt --model $taskModel --permission-mode acceptEdits 2>&1
  } else {
    $claudeOutput = claude -p $task.prompt --model $taskModel 2>&1
  }
} catch {
  $claudeError = "$_"
}
$wallclock_ms = [int]((Get-Date) - $t0).TotalMilliseconds

# ─── 9. Rate-limit detection ───
if ($claudeOutput -match "rate.?limit|quota") {
  Write-Host "[KODAMA] Rate limit detected. Sleeping 1 hour." -ForegroundColor Yellow
  Write-Log @{ event="ratelimit"; output=("$claudeOutput"); ts=(Get-Date -Format o) }
  Start-Sleep -Seconds 3600
  exit 2
}

# ─── 10. Canary check on output (informational; section 5b is the real guard) ───
$canaryHit = $CANARIES | Where-Object { "$claudeOutput" -match [regex]::Escape($_) }
if ($canaryHit) {
  Write-Host "[KODAMA] Canary mention in output: $($canaryHit -join ', ')" -ForegroundColor Yellow
  Write-Host "         (informational — input was already canary-clean per section 5b)"
}

# ─── 11. Git checkpoint tag (post) ───
try {
  git -C $REPO_DIR tag $tagPost 2>&1 | Out-Null
} catch {
  Write-Host "[KODAMA] WARN: git post-tag failed: $_" -ForegroundColor Yellow
}

# ─── 12. Print run-complete banner ───
Write-Host "`n─── RUN COMPLETE ───" -ForegroundColor Green
Write-Host "Wall-clock  : $wallclock_ms ms"
Write-Host "Output len  : $("$claudeOutput".Length) chars"
Write-Host ""
Write-Host "--- CLAUDE OUTPUT ---"
Write-Host $claudeOutput
Write-Host "--- END OUTPUT ---`n"

# ─── 13. Update budget (BEFORE bar prompt — Patch 8: critical state must be saved first) ───
$budget.runs_today       += 1
$budget.runs_this_week   += 1
$budget.last_run_ts       = (Get-Date -Format o)
$budget | ConvertTo-Json -Depth 5 | Set-Content $BUDGET_FILE

# ─── 14. Pop task from queue (BEFORE bar prompt) ───
$queueObj.tasks = @($queueObj.tasks | Select-Object -Skip 1)
$queueObj.completed += 1
$queueObj | ConvertTo-Json -Depth 5 | Set-Content $QUEUE_FILE

# ─── 15. Log run (BEFORE bar prompt — bar value defaults to bar_before) ───
Write-Log @{
  event         = "run"
  ts            = (Get-Date -Format o)
  task_id       = $task.id
  model         = $taskModel
  write_mode    = [bool]$WriteMode
  prompt        = $task.prompt
  wallclock_ms  = $wallclock_ms
  output_chars  = "$claudeOutput".Length
  bar_before    = $bar_before
  bar_after     = [int]$bar_before
  tag_pre       = $tagPre
  tag_post      = $tagPost
  canary_hits   = @($canaryHit)
  error         = $claudeError
}

Write-Host "[KODAMA] Run logged. Tag: $tagPost" -ForegroundColor Green

# ─── 16. Bar % prompt (LAST, defensive — Patch 8 hardening) ───
# Cosmetic step — all critical state above is already saved.
# Wrapped in TryParse: any non-integer input warns and skips. A crash here is harmless.
$bar_after_input = Read-Host "Enter current weekly bar % (from separate /status check, or press Enter to skip)"
if ([string]::IsNullOrWhiteSpace($bar_after_input)) {
  $bar_after_input = $bar_before
}
$bar_after_int = $null
if ([int]::TryParse([string]$bar_after_input, [ref]$bar_after_int)) {
  $budget.weekly_bar_pct = $bar_after_int
  $budget | ConvertTo-Json -Depth 5 | Set-Content $BUDGET_FILE
} else {
  Write-Host "[KODAMA] WARN: bar % input not a number ($bar_after_input). Keeping previous value $bar_before." -ForegroundColor Yellow
}

Write-Host "[KODAMA] Done. 🌳`n"
