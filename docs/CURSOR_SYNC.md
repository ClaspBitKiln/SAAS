# SAAS Snapshot

Снимок для новой сессии. Контекст за ~30 сек. НЕ история, НЕ журнал, НЕ ADR.
Обновляется автоматически после каждого CI_GREEN.

## Product
Sales OS — Call-first B2B CRM (РФ/СНГ), MVP. Repo: github.com/ClaspBitKiln/SAAS

## Production
Web: https://web-production-e22e3.up.railway.app
API: https://api-production-7f43a.up.railway.app
Health: OK

## Completed
✅ Tenant  ✅ Organization  ✅ User  ✅ Membership  ✅ Auth/JWT
✅ Contact  ✅ Notes  ✅ Search  ✅ Company

## Current
См. docs/NEXT.md → первый живой пользователь + фидбек. STOP по коду. Git hygiene DONE 2026-07-03.

## Rules
- NEXT.md = единственный источник «что делать»
- Finish What You Start · CI_GREEN = DONE · One Slice = One Commit · STOP after GREEN
- Claude руководит, Cursor исполняет · tenant isolation не регрессировать · секреты только env

## После CI_GREEN обновлять ТОЛЬКО 4 файла
BUILD_STATUS.md · NEXT.md · CURSOR_SYNC.md · EVIDENCE/STEP_xxx.md

## Read next
1. CLAUDE.md   2. NEXT.md   3. DECISIONS.md
