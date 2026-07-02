# NEXT

EXECUTION ONLY MODE

---

CURRENT
CONTINUE

STATUS
CI_GREEN (deploy scaffold e2ddee6)

GOAL
Railway production deploy — api + web + postgres LIVE

NEXT ACTION (владелец / UI)
1. `.\scripts\railway-setup.ps1` — JWT_SECRET в temp
2. railway.app → проект → Postgres → API → Web (см. `docs/deploy/railway.md`)
3. После smoke prod → сообщить URL → `docs:` BUILD_STATUS → STOP

EXIT
`https://<web>/register` работает в production

NEXT MODULE
E-Metall hardening · AI call summary

BLOCKERS
Railway login + Variables — только владелец (UI или `railway login`)
