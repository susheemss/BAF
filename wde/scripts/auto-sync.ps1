Set-Location "d:\wms1\wde"

$branch = "auto-sync"
$intervalSec = 120

$remote = git remote 2>$null
if (-not $remote) {
  Write-Host "No git remote configured. Add origin first:" -ForegroundColor Yellow
  Write-Host "git remote add origin https://github.com/<user>/<repo>.git" -ForegroundColor Yellow
  exit 1
}

$hasMain = (git rev-parse --verify main 2>$null)
if (-not $hasMain) {
  git checkout -b main | Out-Null
}

$hasAuto = (git rev-parse --verify $branch 2>$null)
if (-not $hasAuto) {
  git checkout -b $branch | Out-Null
} else {
  git checkout $branch | Out-Null
}

Write-Host "Auto-sync started on branch '$branch'. Interval: ${intervalSec}s" -ForegroundColor Cyan

while ($true) {
  $changes = git status --porcelain
  if ($changes) {
    git add -A
    git commit -m "auto-sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
      git push origin $branch
      Write-Host "Synced at $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
    }
  }
  Start-Sleep -Seconds $intervalSec
}
