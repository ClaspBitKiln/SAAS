# STEP: Production deploy + auth hardening
Commit:      9e27991 (deploy/openssl) · 4d1083d (rate limit + Pino)
CI:          https://github.com/ClaspBitKiln/SAAS/actions/runs/28589153902 (GREEN)
Production:  web https://web-production-e22e3.up.railway.app · api https://api-production-7f43a.up.railway.app
DoD:         Prod LIVE; /health = {status:ok,database:up}; Register→Login→Dashboard→Contact подтверждён в UI (Contacts=1); rate limit 5/min/IP на /auth/login + /auth/set-password (e2e 429); Pino + x-request-id, redact password/JWT.
Known issues: onboarding-эндпоинты (/tenants, /users) без throttle — follow-up (TECH_DEBT); prisma db push on start (TD-006).
