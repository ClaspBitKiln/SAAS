$ErrorActionPreference = "Stop"
$MagicMetal = "C:\Users\asus\magic-metal-next"
if (-not (Test-Path $MagicMetal)) {
  $MagicMetal = @("C:\Users\asus\CascadeProjects\magic-metal-next","C:\Users\asus\Desktop\magic-metal-next") | Where-Object { Test-Path $_ } | Select-Object -First 1
}
if (-not $MagicMetal) { throw "magic-metal-next local checkout was not found" }
$Saas = "C:\Users\asus\CascadeProjects\SAAS"
if (-not (Test-Path $Saas)) { $Saas = "C:\Users\asus\SAAS" }
if (-not (Test-Path $Saas)) { throw "SAAS checkout not found" }
Set-Location $Saas
git pull --ff-only origin main 2>$null
$Installer = Join-Path $Saas "scripts\install-komtender-autonomous.ps1"
if (-not (Test-Path $Installer)) { throw "Autonomous installer not found" }
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File $Installer
if ($LASTEXITCODE -ne 0) { throw "Installer failed: $LASTEXITCODE" }
$Task = Get-ScheduledTask -TaskName "MagicMetal-KomTender-Autonomous" -ErrorAction Stop
Start-ScheduledTask -TaskName $Task.TaskName
Start-Sleep -Seconds 2
$state = (Get-ScheduledTask -TaskName $Task.TaskName).State
Write-Host "AUTONOMOUS_KOMTENDER_TASK=INSTALLED"
Write-Host "TASK_STATE=$state"
Write-Host "REPO=$MagicMetal"
$proof = @("AUTONOMOUS_INSTALL=PASS","TIME="+(Get-Date -Format o),"TASK_STATE="+$state) -join [Environment]::NewLine
Set-Content -Path (Join-Path $Saas "komtender-autonomous-status.txt") -Value $proof -Encoding utf8
git add komtender-autonomous-status.txt
git commit -m "test: record autonomous KomTender install" 2>$null
git push origin main 2>$null
