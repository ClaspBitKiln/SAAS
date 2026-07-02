# NEXT

EXECUTION ONLY MODE

---

CURRENT
CONTINUE

STATUS
CI_GREEN — deploy scaffold ready to commit

GOAL
STEP 3 — Railway deploy (api + web + postgres)

NEXT ACTION
1. Commit + push deploy scaffold → CI_GREEN
2. Railway: postgres + api + web по `docs/deploy/railway.md`
3. Smoke prod → BUILD_STATUS → STOP

EXIT
MVP на публичном URL

NEXT MODULE
E-Metall hardening · AI call summary

BLOCKERS
JWT_SECRET / DATABASE_URL — только Railway Variables
