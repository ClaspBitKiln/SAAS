# DECISIONS — strategy log

Фиксируем решения владельца. Исполнение — только через `docs/NEXT.md`.

---

## D-001 (2026-07-02): First live user before new aggregates

**Decision:** Следующий приоритет — **первый живой менеджер в prod + структурированный фидбек**.

**Backlog до фидбека:**
- Deal pipeline
- Contact→Company link
- AI summary / counterparty-check / RBAC / E-Metall live

**Rationale:** MVP CRM-ядро закрыто (Platform, Auth, Contact+Notes+Search, Call, Request scaffold, Company). Строить Deal или связку без реального пользователя = полировка «на всякий случай». Следующая ценность — обратная связь от живого менеджера, не ещё один агрегат.

**Evidence:** Company `fab5d9f` CI_GREEN [run #78](https://github.com/ClaspBitKiln/SAAS/actions/runs/28600344202); isolation review → `docs/EVIDENCE/STEP_2026-07-02_COMPANY_ISOLATION.md`.

**Owner:** Founder
