param(
    [switch]$SkipRailway,
    [switch]$InitOnly,
    [string]$ProjectName = "ai-sales-os",
    [string]$Repo = "ClaspBitKiln/SAAS",
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

function Assert-ProjectRoot {
    if (!(Test-Path "apps/api/Dockerfile") -or !(Test-Path "apps/web/Dockerfile")) {
        Write-Host "ERROR: run from SAAS repo root." -ForegroundColor Red
        Write-Host '  cd "C:\Users\asus\Claude\Projects\SAAS"'
        exit 1
    }
}

function Invoke-Railway {
    param([string[]]$RailwayArgs)
    $railway = Get-Command railway -ErrorAction SilentlyContinue
    if ($railway) {
        & railway @RailwayArgs
        return $LASTEXITCODE
    }
    & npx -y @railway/cli @RailwayArgs
    return $LASTEXITCODE
}

function Get-RailwayJson {
    param([string[]]$RailwayArgs)
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $out = & railway @RailwayArgs 2>$null
    $ErrorActionPreference = $prev
    if ($LASTEXITCODE -ne 0) { return $null }
    try { return $out | ConvertFrom-Json } catch { return $null }
}

function Ensure-RailwayAuth {
    $who = (Invoke-Railway @("whoami") 2>&1 | Out-String)
    if ($who -match "Logged in") {
        Write-Host "Railway: logged in" -ForegroundColor Green
        return
    }
    Write-Host "Railway login required - browser will open (one click)." -ForegroundColor Yellow
    $null = Invoke-Railway @("login")
    $who = (Invoke-Railway @("whoami") 2>&1 | Out-String)
    if ($who -notmatch "Logged in") {
        Write-Host "ERROR: railway login failed." -ForegroundColor Red
        exit 1
    }
    Write-Host $who.Trim()
}

function New-JwtSecret {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

function Set-ServiceVariable {
    param(
        [string]$Service,
        [string]$Key,
        [string]$Value,
        [switch]$SkipDeploys
    )
    if ([string]::IsNullOrWhiteSpace($Value)) { return }
    $varArgs = @("variable", "set", ($Key + "=" + $Value), "--service", $Service)
    if ($SkipDeploys) { $varArgs += "--skip-deploys" }
    $code = Invoke-Railway $varArgs
    if ($code -ne 0) { throw "Failed to set $Key on $Service" }
}

function Service-Exists {
    param([string]$Name)
    $json = Get-RailwayJson @("service", "list", "--json")
    if (-not $json) { return $false }
    $services = @($json)
    if ($json.services) { $services = @($json.services) }
    foreach ($s in $services) {
        $n = $s.name
        if (-not $n) { $n = $s.serviceName }
        if ($n -eq $Name) { return $true }
    }
    return $false
}

function Ensure-LinkedProject {
    if (Test-Path ".railway") {
        Write-Host "Project already linked (.railway exists)" -ForegroundColor Green
        return
    }
    Write-Host "Creating Railway project: $ProjectName" -ForegroundColor Cyan
    $code = Invoke-Railway @("init", "-n", $ProjectName, "--json")
    if ($code -ne 0) { throw "railway init failed" }
}

function Ensure-Postgres {
    if (Service-Exists "Postgres") { Write-Host "Postgres service exists" -ForegroundColor Green; return }
    Write-Host "Adding PostgreSQL..." -ForegroundColor Cyan
    $code = Invoke-Railway @("add", "--database", "postgres", "--json")
    if ($code -ne 0) { throw "railway add postgres failed" }
}

function Ensure-GitHubService {
    param([string]$ServiceName)
    if (Service-Exists $ServiceName) {
        Write-Host "Service $ServiceName exists" -ForegroundColor Green
        return
    }
    Write-Host "Adding service $ServiceName from GitHub $Repo..." -ForegroundColor Cyan
    $code = Invoke-Railway @(
        "add", "--repo", $Repo, "--branch", $Branch, "--service", $ServiceName, "--json"
    )
    if ($code -ne 0) { throw "railway add service $ServiceName failed" }
}

function Configure-ApiService {
    param([string]$JwtSecret)
    Write-Host "Configuring API variables..." -ForegroundColor Cyan
    Invoke-Railway @("service", "link", "api") | Out-Null
    Set-ServiceVariable -Service "api" -Key "RAILWAY_DOCKERFILE_PATH" -Value "apps/api/Dockerfile" -SkipDeploys
    Set-ServiceVariable -Service "api" -Key "RAILWAY_CONFIG_FILE" -Value "apps/api/railway.json" -SkipDeploys
    Set-ServiceVariable -Service "api" -Key "NODE_ENV" -Value "production" -SkipDeploys
    Set-ServiceVariable -Service "api" -Key "EMETALL_ENABLED" -Value "false" -SkipDeploys
    Set-ServiceVariable -Service "api" -Key "JWT_SECRET" -Value $JwtSecret
    # Reference Postgres DATABASE_URL from plugin
    $dbRef = '${{Postgres.DATABASE_URL}}'
    Set-ServiceVariable -Service "api" -Key "DATABASE_URL" -Value $dbRef -SkipDeploys
}

function Configure-WebService {
    param([string]$ApiPublicUrl)
    Write-Host "Configuring Web variables..." -ForegroundColor Cyan
    if (-not $ApiPublicUrl) {
        Write-Host "  Skipping NEXT_PUBLIC_API_URL (set after API domain is known)" -ForegroundColor Yellow
        Set-ServiceVariable -Service "web" -Key "RAILWAY_DOCKERFILE_PATH" -Value "apps/web/Dockerfile" -SkipDeploys
        Set-ServiceVariable -Service "web" -Key "RAILWAY_CONFIG_FILE" -Value "apps/web/railway.json" -SkipDeploys
        return
    }
    Set-ServiceVariable -Service "web" -Key "RAILWAY_DOCKERFILE_PATH" -Value "apps/web/Dockerfile" -SkipDeploys
    Set-ServiceVariable -Service "web" -Key "RAILWAY_CONFIG_FILE" -Value "apps/web/railway.json" -SkipDeploys
    Set-ServiceVariable -Service "web" -Key "NEXT_PUBLIC_API_URL" -Value $ApiPublicUrl
}

function Get-ServiceDomain {
    param([string]$ServiceName)
    $json = Get-RailwayJson @("domain", "list", "--service", $ServiceName, "--json")
    if (-not $json) { return $null }
    $domains = @($json)
    if ($json.domains) { $domains = @($json.domains) }
    foreach ($d in $domains) {
        $domainHost = $d.domain
        if (-not $domainHost) { $domainHost = $d.hostname }
        if ($domainHost) { return "https://$domainHost" }
    }
    return $null
}

Assert-ProjectRoot

Write-Host "=== Sales OS Railway production setup (inn-bot style) ===" -ForegroundColor Cyan
Write-Host "Repo: $Repo branch $Branch"
Write-Host "Secrets stay in Railway Variables only - not in git or chat."
Write-Host ""

if ($SkipRailway) {
    Write-Host "SkipRailway set - local checklist only."
    exit 0
}

Ensure-RailwayAuth
Ensure-LinkedProject
Ensure-Postgres
Ensure-GitHubService -ServiceName "api"
Ensure-GitHubService -ServiceName "web"

$jwtSecret = New-JwtSecret
$jwtFile = Join-Path $env:TEMP "sales-os-jwt-secret.txt"
Set-Content -Path $jwtFile -Value $jwtSecret -NoNewline
Write-Host "JWT_SECRET backup (local only): $jwtFile" -ForegroundColor DarkGray

Configure-ApiService -JwtSecret $jwtSecret

Write-Host ""
Write-Host "Generating API public domain (if missing)..." -ForegroundColor Cyan
Invoke-Railway @("domain", "--service", "api") | Out-Null
$apiUrl = Get-ServiceDomain -ServiceName "api"
if ($apiUrl) {
    Write-Host "API URL: $apiUrl" -ForegroundColor Green
} else {
    Write-Host "API domain not ready yet - set in Railway UI after deploy" -ForegroundColor Yellow
}

Configure-WebService -ApiPublicUrl $apiUrl

Write-Host ""
Write-Host "Generating Web public domain..." -ForegroundColor Cyan
Invoke-Railway @("domain", "--service", "web") | Out-Null
$webUrl = Get-ServiceDomain -ServiceName "web"
if ($webUrl) {
    Write-Host "Web URL: $webUrl" -ForegroundColor Green
    Set-ServiceVariable -Service "api" -Key "CORS_ORIGIN" -Value $webUrl
} else {
    Write-Host "After web deploy: set CORS_ORIGIN on api service to web URL" -ForegroundColor Yellow
}

if (-not $InitOnly) {
    Write-Host ""
    Write-Host "Redeploying services..." -ForegroundColor Cyan
    Invoke-Railway @("service", "redeploy", "--service", "api") | Out-Null
    Invoke-Railway @("service", "redeploy", "--service", "web") | Out-Null
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "Dashboard: railway open"
Write-Host "Health:    curl $apiUrl/health"
Write-Host "App:       $webUrl/register"
Write-Host ""
Write-Host "If GitHub deploy did not trigger, run:"
Write-Host "  railway service source connect --repo $Repo --branch $Branch --service api"
Write-Host "  railway service source connect --repo $Repo --branch $Branch --service web"
