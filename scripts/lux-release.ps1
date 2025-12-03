param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$CommitMessage,

    [Parameter(Mandatory = $true, Position = 1)]
    [string]$Tag
)

Write-Host "Commit message: $CommitMessage"
Write-Host "Tag: $Tag"

Write-Host "Adding all changes..."
git add -A

Write-Host "Committing..."
git commit -m $CommitMessage

Write-Host "Tagging..."
git tag $Tag

Write-Host "Pushing commits..."
git push

Write-Host "Pushing tag..."
git push origin $Tag

Write-Host "Running snapshot..."
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& "$scriptDir\lux-snapshot.ps1"

Write-Host "Release complete."
