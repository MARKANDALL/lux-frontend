param(
  [string]$BackupDir = "$env:USERPROFILE\OneDrive\Desktop\PRONUNCIATION_TOOL_BACKUPS"
)

if (!(Test-Path $BackupDir)) { New-Item -ItemType Directory -Path $BackupDir | Out-Null }

$RepoRoot = git rev-parse --show-toplevel
Set-Location $RepoRoot

$sha = (git rev-parse --short HEAD).Trim()
$stamp = Get-Date -Format "yyyyMMdd-HHmm"
$zipName = "lux-$stamp-$sha.zip"
$zipPath = Join-Path $BackupDir $zipName

$items = Get-ChildItem -Path $RepoRoot -Force | Where-Object { $_.Name -ne ".git" }
Compress-Archive -Path $items.FullName -DestinationPath $zipPath -Force

Write-Host "Snapshot saved to $zipPath"
