# Railway setup helper (Windows) — quick JWT + checklist
# Full deploy (inn-bot style): .\scripts\setup_railway_prod.ps1
# Usage: .\scripts\railway-setup.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

Write-Host "=== Sales OS Railway setup ===" -ForegroundColor Cyan
Write-Host "Repo: $root"
Write-Host "Guide: docs/deploy/railway.md"
Write-Host ""

# JWT for Railway Variables (copy once into Railway UI — do not commit)
$jwtBytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($jwtBytes)
$jwtSecret = [Convert]::ToBase64String($jwtBytes)
$jwtFile = Join-Path $env:TEMP "sales-os-jwt-secret.txt"
Set-Content -Path $jwtFile -Value $jwtSecret -NoNewline
Write-Host "[1] JWT_SECRET generated -> $jwtFile"
Write-Host "    Paste into Railway API service Variables as JWT_SECRET"
Write-Host ""

# CLI optional
$railway = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railway) {
  Write-Host "[2] Railway CLI not installed. Install:" -ForegroundColor Yellow
  Write-Host "    npm i -g @railway/cli"
  Write-Host "    railway login"
  Write-Host "    cd $root"
  Write-Host "    railway init"
} else {
  Write-Host "[2] Railway CLI: $($railway.Source)" -ForegroundColor Green
}

Write-Host "Full auto-setup (after railway login):"
Write-Host "  .\scripts\setup_railway_prod.ps1"
Write-Host ""
Write-Host "  1. New Project -> Deploy from GitHub -> ClaspBitKiln/SAAS"
Write-Host "  2. + PostgreSQL database"
Write-Host "  3. Service API: Dockerfile apps/api/Dockerfile, config apps/api/railway.json"
Write-Host "     Variables: DATABASE_URL (ref Postgres), JWT_SECRET, NODE_ENV=production, EMETALL_ENABLED=false"
Write-Host "  4. Service WEB: Dockerfile apps/web/Dockerfile, config apps/web/railway.json"
Write-Host "     Build arg: NEXT_PUBLIC_API_URL=https://<api-public-url>"
Write-Host "  5. API CORS_ORIGIN=https://<web-public-url> -> redeploy API"
Write-Host "  6. Smoke: curl https://<api>/health"
Write-Host "         open https://<web>/register"
Write-Host ""
