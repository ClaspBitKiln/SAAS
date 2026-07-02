# STEP: Contact Notes (CRM Lite slice 1)

Commit:      `b946126`
CI:          [run #73](https://github.com/ClaspBitKiln/SAAS/actions/runs/28592344724) (GREEN)
Production:  api + web Railway SUCCESS (auto-deploy after push)
DoD:         POST/GET `/contacts/:id/notes` org-scoped; UI Notes panel; e2e 404 cross-org on GET
Known issues: GET notes for foreign contactId may return 404 (handler checks contact) — Claude nit: empty list vs 404 on list path N/A since handler 404s first
Isolation review: Claude PASS (2026-07-02) — findById before create/list, tenantId from contact
