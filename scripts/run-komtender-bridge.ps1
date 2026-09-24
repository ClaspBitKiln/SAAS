# Fixed local bridge for KomTender.
# The KomTender secret stays on the Windows machine and is never committed.
$ErrorActionPreference = "Stop"
$MagicMetal = "C:\Users\asus\magic-metal-next"
if (-not (Test-Path $MagicMetal)) {
  $candidates = @(
    "C:\Users\asus\CascadeProjects\magic-metal-next",
    "C:\Users\asus\Desktop\magic-metal-next"
  )
  $MagicMetal = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $MagicMetal) { throw "magic-metal-next local checkout was not found" }
Set-Location $MagicMetal
if (-not $env:KOMTENDER_API_KEY) { throw "KOMTENDER_API_KEY is not available in the local process" }
$env:PYTHONUNBUFFERED = "1"
& powershell -NoProfile -ExecutionPolicy Bypass -File "$MagicMetal\scripts\run_komtender_local.ps1"
if ($LASTEXITCODE -ne 0) { throw "KomTender local runner failed: $LASTEXITCODE" }
if (-not (Test-Path "$MagicMetal\artifacts\chzsi_komtender_material_tenders.xlsx")) {
  throw "Expected KomTender artifact was not created"
}
Write-Host "KOMTENDER_BRIDGE=PASS"
Write-Host "ARTIFACT=$MagicMetal\artifacts\chzsi_komtender_material_tenders.xlsx"
