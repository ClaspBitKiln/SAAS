# Fixed local bridge for the first KomTender MVP.
$ErrorActionPreference = "Stop"
$MagicMetal = "C:\Users\asus\magic-metal-next"
if (-not (Test-Path $MagicMetal)) {
  $MagicMetal = @("C:\Users\asus\CascadeProjects\magic-metal-next","C:\Users\asus\Desktop\magic-metal-next") | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $MagicMetal) { throw "magic-metal-next local checkout was not found" }
Set-Location $MagicMetal
if (-not $env:KOMTENDER_API_KEY) { throw "KOMTENDER_API_KEY is not available in the local process" }
git fetch origin procurement-komtender-mvp 2>$null
git checkout procurement-komtender-mvp 2>$null
git pull --ff-only origin procurement-komtender-mvp
& python scripts\komtender_simple_runner.py --pages 1
if ($LASTEXITCODE -ne 0) { throw "KomTender simple runner failed: $LASTEXITCODE" }
$artifact = Join-Path $MagicMetal "artifacts\komtender_results.xls"
if (-not (Test-Path $artifact)) { throw "Expected artifact was not created" }
$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss K"
$size = (Get-Item $artifact).Length
$proof = @("KOMTENDER_LIVE=PASS","TIME=$stamp","ARTIFACT_BYTES=$size") -join [Environment]::NewLine
$saas = "C:\Users\asus\CascadeProjects\SAAS"
if (-not (Test-Path $saas)) { $saas = "C:\Users\asus\SAAS" }
if (Test-Path $saas) {
  Set-Content -Path (Join-Path $saas "komtender-live-test.txt") -Value $proof -Encoding utf8
  Set-Location $saas
  git add komtender-live-test.txt
  git commit -m "test: record live KomTender MVP result" 2>$null
  git push origin main
}
Write-Host "KOMTENDER_LIVE=PASS"
Write-Host "ARTIFACT=$artifact"