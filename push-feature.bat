@echo off
setlocal
cd /d "%~dp0"
echo ============================================================
echo  Push current changes (feature commit) - Sales OS
echo ============================================================
echo.

git status --short
echo.

echo [1/3] git add -A ...
git add -A

echo [2/3] commit ...
git commit -m "test(companies): align inn spec with country-aware validation"
if errorlevel 1 (
  echo [!] Commit failed or nothing to commit. See message above.
  pause
  exit /b 1
)

echo [3/3] push ...
git push
if errorlevel 1 (
  echo [!] Push failed. Check internet / GitHub access.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  DONE. Open GitHub - Actions - workflow "api".
echo  Wait for green check, then tell Claude the result.
echo ============================================================
pause
