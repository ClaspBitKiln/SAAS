# DECISIONS — strategy log

Фиксируем решения владельца. Исполнение — только через `docs/NEXT.md`. Память → `docs/MEMORY.md`.

---

## D-001 (2026-07-02): First live user before new aggregates

**Decision:** Следующий приоритет — **первый живой менеджер в prod + структурированный фидбек**.

**Назначен:** **Илья Юртаев** (MagicMet). Prod self-register. Фидбек → `docs/EVIDENCE/FEEDBACK_2026-07-02_magicmet-yurtaev.md`.

**Backlog до фидбека:**
- Deal pipeline
- Contact→Company link
- AI summary / counterparty-check / RBAC / E-Metall live

**Rationale:** MVP CRM-ядро закрыто. Строить Deal или связку без реального пользователя = полировка «на всякий случай».

**Evidence:** Company `fab5d9f` CI_GREEN [run #78](https://github.com/ClaspBitKiln/SAAS/actions/runs/28600344202); isolation PASS → `docs/EVIDENCE/STEP_2026-07-02_COMPANY_ISOLATION.md`.

**Код:** не менять до записи фидбека.

**Owner:** Founder

---

## D-002 (2026-07-02): Single local project folder

**Decision:** Один проект SAAS = **одна** локальная папка `C:\Users\asus\Claude\Projects\SAAS` + GitHub `ClaspBitKiln/SAAS`.

**Reject:** параллельные клоны (`SAAS-copy`, второй path). Cursor Cloud — не «второй проект», только git-клон.

**Obsidian** (`Documents/inn-bot/Memory/`) — память, не дубль кода.

**Owner:** Founder
