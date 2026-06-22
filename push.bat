@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo  AI Sales OS - first push (free, no API keys needed)
echo ============================================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo [!] Git not found. Install https://git-scm.com/download/win and run again.
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 call corepack enable >nul 2>nul

set "REPO=https://github.com/ClaspBitKiln/SAAS.git"
echo Repo: %REPO%
echo.

echo [1/6] git init...
git init -b main 2>nul
if errorlevel 1 git init

echo [2/6] pnpm install (creates lockfile, enables husky)...
call pnpm install
if errorlevel 1 (
  echo [!] pnpm install failed. Check internet / Node version.
  pause
  exit /b 1
)

echo [3/6] git add...
git add .

echo [4/6] commit...
git commit -m "chore: bootstrap ai-sales-os"

echo [5/6] remote...
git remote remove origin 2>nul
git remote add origin %REPO%

echo [6/6] push...
git branch -M main
git push -u origin main
if errorlevel 1 (
  echo [!] push failed. Check repo URL and GitHub access.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  DONE. Open the repo on GitHub - tab "Actions".
echo  Job "api" runs automatically. First CI_RED is expected and OK:
echo  workflow "autofix" will try to fix it for free (GitHub Models).
echo  No keys / no payment required.
echo ============================================================
pause
