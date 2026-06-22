@echo off
cd /d "%~dp0"
set "REPO=https://github.com/ClaspBitKiln/SAAS.git"
(
  echo === auto-push start ===
  where git
  echo --- git init ---
  git init -b main 2>nul || git init
  echo --- pnpm install ---
  call pnpm install
  echo --- git add ---
  git add .
  echo --- git status ---
  git status --short
  echo --- commit (skip husky to capture lint separately) ---
  git commit -m "chore: bootstrap ai-sales-os"
  echo commit_exit=%errorlevel%
  echo --- lint check ---
  call pnpm --filter @ai-sales-os/api lint
  echo lint_exit=%errorlevel%
  echo --- remote ---
  git remote remove origin 2>nul
  git remote add origin %REPO%
  echo --- branch ---
  git branch -M main
  echo --- log ---
  git log --oneline -1
  echo --- push ---
  git push -u origin main
  echo push_exit=%errorlevel%
  echo === auto-push end ===
) > push.log 2>&1
exit
