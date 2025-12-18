param(
  [string]$Message = ""  # Optional: manual commit summary override
)

# --- CONFIGURATION ---
$DesktopPath  = [Environment]::GetFolderPath("Desktop")
$TargetFolder = Join-Path $DesktopPath "PRONUNCIATION_TOOL_BACKUPS"
$Timestamp    = Get-Date -Format "yyyyMMdd-HHmm"
$ZipName      = "lux-release-$Timestamp.zip"
$FinalZipPath = Join-Path $TargetFolder $ZipName

Write-Host ">>> Starting Lux Release..." -ForegroundColor Cyan

# Ensure the desktop backup folder exists
if (!(Test-Path $TargetFolder)) {
  New-Item -ItemType Directory -Path $TargetFolder | Out-Null
  Write-Host ">>> Created new backup folder at: $TargetFolder" -ForegroundColor Yellow
}

# --- 1) STAGE ---
git add -A | Out-Null

# --- 2) BUILD AUTO COMMIT MESSAGE (from STAGED changes) ---
$stagedStatus = (git diff --cached --name-status) 2>$null
$stagedFiles  = (git diff --cached --name-only) 2>$null

function Get-Category([string]$path) {
  if ($path -match '^features/interactions/') { return 'interactions' }
  if ($path -match '^features/results/')      { return 'results' }
  if ($path -match '^features/passages/')     { return 'passages' }
  if ($path -match '^features/features/')     { return 'features' }
  if ($path -match '^ui/')                    { return 'ui' }
  if ($path -match '^src/')                   { return 'src' }
  if ($path -match '^styles?/')               { return 'styles' }
  if ($path -match '^index\.html$')           { return 'index.html' }
  return 'misc'
}

function New-AutoMessage([string[]]$files, [string[]]$statusLines, [string]$stamp) {
  $cats = @()
  foreach ($f in $files) { if ($f) { $cats += (Get-Category $f) } }

  $catSummary = ($cats | Sort-Object -Unique) -join ", "
  if ([string]::IsNullOrWhiteSpace($catSummary)) { $catSummary = "misc" }

  $count = ($files | Where-Object { $_ } | Measure-Object).Count

  # IMPORTANT: use ${} because PowerShell treats "$var:" specially
  $summary = "Lux release ${stamp}: ${catSummary} (${count} files)"

  $bodyLines = @(
    "Changed files:",
    ""
  ) + ($statusLines | Where-Object { $_ } | ForEach-Object { " - $_" })

  return @{
    Summary = $summary
    Body    = ($bodyLines -join "`n")
  }
}

# --- 3) COMMIT (only if there are staged changes) ---
if ($stagedStatus -and $stagedStatus.Trim().Length -gt 0) {
  Write-Host ">>> Changes detected. Committing..." -ForegroundColor Yellow

  if ([string]::IsNullOrWhiteSpace($Message)) {
    $auto = New-AutoMessage -files $stagedFiles -statusLines $stagedStatus -stamp $Timestamp
    $commitSummary = $auto.Summary
    $commitBody    = $auto.Body
  } else {
    $commitSummary = "Lux release ${Timestamp}: ${Message}"
    $commitBody    = "Changed files:`n" + (($stagedStatus | ForEach-Object { " - $_" }) -join "`n")
  }

  git commit -m $commitSummary -m $commitBody | Out-Null
  Write-Host ">>> Commit: $commitSummary" -ForegroundColor Green
} else {
  Write-Host ">>> No staged changes to commit. Proceeding to tag + zip..." -ForegroundColor DarkGray
}

# --- 4) TAG (annotated; avoid collisions) ---
$baseTag = "build-$Timestamp"
$TagName = $baseTag
$i = 1

while (git rev-parse -q --verify "refs/tags/$TagName" 2>$null) {
  $TagName = "${baseTag}-$i"
  $i++
}

git tag -a $TagName -m "Lux Release $Timestamp" | Out-Null
Write-Host ">>> Tagged HEAD as $TagName" -ForegroundColor Green

# --- 5) ARCHIVE (clean source zip from HEAD) ---
Write-Host ">>> Archiving clean source code..." -ForegroundColor Yellow

try {
  git archive --format=zip --output "$FinalZipPath" HEAD
} catch {
  Write-Error "Failed to create git archive. Make sure git is in your PATH."
  exit 1
}

# --- 6) VERIFICATION ---
if (Test-Path $FinalZipPath) {
  $SizeKB = "{0:N2}" -f ((Get-Item $FinalZipPath).Length / 1KB)
  Write-Host ""
  Write-Host "SUCCESS!" -ForegroundColor Green
  Write-Host "File saved to: $FinalZipPath" -ForegroundColor White
  Write-Host "Clean Size:    $SizeKB KB" -ForegroundColor Cyan
} else {
  Write-Error "Something went wrong. The zip file was not created."
}
