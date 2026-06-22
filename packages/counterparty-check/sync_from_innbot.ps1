# sync_from_innbot.ps1
# Делает ТОЧНУЮ копию кода и базы знаний inn-bot в блок counterparty-check.
# Запускать локально (на машине владельца) из папки блока:
#   powershell -ExecutionPolicy Bypass -File sync_from_innbot.ps1
#
# Источники (production, НЕ изменяются — только чтение):
#   код/git : C:\Users\asus\CascadeProjects\inn-bot
#   память  : C:\Users\asus\Documents\inn-bot

$ErrorActionPreference = "Stop"

$Code   = "C:\Users\asus\CascadeProjects\inn-bot"
$Memory = "C:\Users\asus\Documents\inn-bot"
$Block  = $PSScriptRoot
$Ref    = Join-Path (Split-Path (Split-Path $Block -Parent) -Parent) "docs\reference\inn-bot"

Write-Host "== Копирую продуктовый код из $Code ==" -ForegroundColor Cyan

# Продуктовые .py-файлы (без .bat/.ps1/setup/marketing-мусора)
$codeFiles = @(
  "simple_app.py","risk_scoring.py","storage.py","checko_client.py",
  "moex_client.py","pdf_dossier.py","source_catalog.py","automation.py",
  "requirements.txt","Procfile","railway.json","runtime.txt","README.md"
)
foreach ($f in $codeFiles) {
  $srcPath = Join-Path $Code $f
  if (Test-Path $srcPath) { Copy-Item $srcPath -Destination $Block -Force; Write-Host "  + $f" }
}

# Тесты
$testsDst = Join-Path $Block "tests"
New-Item -ItemType Directory -Force -Path $testsDst | Out-Null
Get-ChildItem $Code -Filter "test_*.py" -File | ForEach-Object { Copy-Item $_.FullName $testsDst -Force; Write-Host "  + tests/$($_.Name)" }
if (Test-Path (Join-Path $Code "tests")) {
  Copy-Item (Join-Path $Code "tests\*") $testsDst -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "== Копирую базу знаний (Memory + CLAUDE_MEMORY) в $Ref ==" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path (Join-Path $Ref "memory") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Ref "strategy") | Out-Null

if (Test-Path (Join-Path $Memory "Memory")) {
  Copy-Item (Join-Path $Memory "Memory\*.md") (Join-Path $Ref "memory") -Force -ErrorAction SilentlyContinue
}
# не копировать секреты
Remove-Item (Join-Path $Ref "memory\Учётные_данные.md") -ErrorAction SilentlyContinue
Remove-Item (Join-Path $Ref "memory\*Учётные*") -ErrorAction SilentlyContinue

if (Test-Path (Join-Path $Code "CLAUDE_MEMORY")) {
  Copy-Item (Join-Path $Code "CLAUDE_MEMORY\*.md") (Join-Path $Ref "strategy") -Force -ErrorAction SilentlyContinue
}
# полезные корневые стратегические доки
foreach ($f in @("RELEASE_PLAN.md","PROJECT_CONTEXT.md","SIGNAL_ENGINE_ARCHITECTURE.md","RESILIENT_ARCHITECTURE.md","API_AUDIT.md")) {
  $p = Join-Path $Code $f
  if (Test-Path $p) { Copy-Item $p (Join-Path $Ref "strategy") -Force }
}
$gptDoc = Join-Path $Memory "ПРОЕКТ_ДЛЯ_АНАЛИЗА_GPT.md"
if (Test-Path $gptDoc) { Copy-Item $gptDoc (Join-Path $Ref "memory") -Force }

Write-Host "Готово. НИКОГДА не коммить секреты (.env, Учётные_данные.md)." -ForegroundColor Green
