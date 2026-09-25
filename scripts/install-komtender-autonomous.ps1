# Autonomous KomTender Windows runner
$ErrorActionPreference = "Stop"

$candidates = @(
  "C:\Users\asus\magic-metal-next",
  "C:\Users\asus\CascadeProjects\magic-metal-next",
  "C:\Users\asus\Desktop\magic-metal-next"
)
$Repo = $candidates | Where-Object { Test-Path (Join-Path $_ ".git") } | Select-Object -First 1
if (-not $Repo) { throw "magic-metal-next checkout not found" }

$Runner = Join-Path $Repo "scripts\run_komtender_local.ps1"
if (-not (Test-Path $Runner)) { throw "Local runner not found: $Runner" }

$Wrapper = Join-Path $Repo "scripts\run_komtender_scheduled.ps1"
$body = @'
$ErrorActionPreference = "Stop"
$repo = "__REPO__"
$runner = "__RUNNER__"
$log = Join-Path $repo "artifacts\komtender-scheduled.log"
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null
try {
  Set-Location $repo
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $runner *>> $log
  if ($LASTEXITCODE -ne 0) { throw "runner exit $LASTEXITCODE" }
  Add-Content $log ("PASS " + (Get-Date -Format o))
} catch {
  Add-Content $log ("FAIL " + (Get-Date -Format o) + " " + $_.Exception.Message)
}
'@
$body = $body.Replace("__REPO__",$Repo.Replace("'","''")).Replace("__RUNNER__",$Runner.Replace("'","''"))
Set-Content -Path $Wrapper -Value $body -Encoding UTF8

$TaskName = "MagicMetal-KomTender-Autonomous"
$arg = '-NoProfile -ExecutionPolicy Bypass -File "' + $Wrapper + '"'
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arg
$triggers = @(
  (New-ScheduledTaskTrigger -AtStartup),
  (New-ScheduledTaskTrigger -Daily -At 06:00)
)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $triggers -Settings $settings -Force | Out-Null
Write-Host "AUTONOMOUS_KOMTENDER_TASK=INSTALLED"
Write-Host "TASK=$TaskName"
Write-Host "REPO=$Repo"
