Set-Location "d:\wms1\wde"

$dirty = git status --porcelain
if ($dirty) {
  Write-Host "Working tree not clean. Commit/stash before promotion." -ForegroundColor Yellow
  exit 1
}

git fetch origin

git checkout main
git pull origin main
git merge --no-ff auto-sync -m "promote: auto-sync -> main"
git push origin main

Write-Host "Promotion complete: auto-sync -> main" -ForegroundColor Green
