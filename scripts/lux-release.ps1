# --- CONFIGURATION ---
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$TargetFolder = Join-Path $DesktopPath "PRONUNCIATION_TOOL_BACKUPS"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$ZipName = "lux-release-$Timestamp.zip"
$FinalZipPath = Join-Path $TargetFolder $ZipName

# --- 1. SETUP & CHECKS ---
Write-Host ">>> Starting Lux Clean Release..." -ForegroundColor Cyan

# Ensure the desktop backup folder exists
if (!(Test-Path $TargetFolder)) {
    New-Item -ItemType Directory -Path $TargetFolder | Out-Null
    Write-Host ">>> Created new backup folder at: $TargetFolder" -ForegroundColor Yellow
}

# --- 2. GIT OPERATIONS ---
# Stage all changes
git add .

# Check if there is anything to commit
$status = git status --porcelain
if ($status) {
    Write-Host ">>> Committing changes..." -ForegroundColor Yellow
    git commit -m "Lux Release build $Timestamp"
} else {
    Write-Host ">>> No changes to commit, proceeding to zip..." -ForegroundColor DarkGray
}

# Create a Tag
$TagName = "build-$Timestamp"
git tag $TagName
Write-Host ">>> Tagged commit as $TagName" -ForegroundColor Green

# --- 3. THE MAGIC (GIT ARCHIVE) ---
Write-Host ">>> Archiving clean source code..." -ForegroundColor Yellow

try {
    git archive --format=zip --output "$FinalZipPath" HEAD
} catch {
    Write-Error "Failed to create git archive. Make sure git is in your PATH."
    exit 1
}

# --- 4. VERIFICATION ---
if (Test-Path $FinalZipPath) {
    $SizeKB = "{0:N2}" -f ((Get-Item $FinalZipPath).Length / 1KB)
    Write-Host ""
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "File saved to: $FinalZipPath" -ForegroundColor White
    Write-Host "Clean Size:    $SizeKB KB" -ForegroundColor Cyan
} else {
    Write-Error "Something went wrong. The zip file was not created."
}