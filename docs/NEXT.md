# NEXT

EXECUTION ONLY MODE

---

CURRENT
CONTINUE

STATUS
LOCAL_GREEN (Request MVP — push pending)

GOAL
Request MVP + E-Metall scaffold → CI_GREEN

NEXT ACTION (см. docs/CURSOR_TASK_MVP.md)
1. `git push origin main` → дождаться CI_GREEN (api + web-build) → BUILD_STATUS
2. STEP 1 (P0 SECURITY): tenant isolation — @CurrentUser + org-scope в репозиториях (Request/Contact/Call) + e2e-регрессия → CI_GREEN → STOP

EXIT
Cross-tenant доступ закрыт: e2e доказывает, что тенант A не видит данные тенанта B

NEXT MODULE (после P0 green)
E-Metall platform hardening (config/retry/logging/HMAC) при live-ключах · Deploy · AI call summary

BLOCKERS
Local e2e: dirty DB (MagicMet) + requests table not migrated — CI fresh DB OK
