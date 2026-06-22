@echo off
REM Запускает PowerShell-синхронизацию кода и знаний inn-bot в блок.
powershell -ExecutionPolicy Bypass -File "%~dp0sync_from_innbot.ps1"
pause
