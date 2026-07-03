# NEXT — единственный источник истины

Читают: Cursor (исполнение) + Claude (руководство). Доказательства → `docs/EVIDENCE/`. Стратегия → `docs/DECISIONS.md`.

---

CURRENT
**Первый живой пользователь + фидбек** (решение зафиксировано в DECISIONS 2026-07-02). НЕ код.

STATUS
STOP по коду (MVP-freeze). Активный шаг — за Founder: пригласить одного реального менеджера и собрать фидбек.

INPUT
MVP CRM-ядро закрыто и изолировано (Claude review PASS): Contact + Company + Notes + Search + Call + Request scaffold, prod LIVE.

OUTPUT
Один реальный B2B-менеджер прошёл в prod Register→Login→Contact→Note→Search→Company без помощи; фидбек записан.

DONE WHEN
Activation достигнута (signup→login→≥1 contact) + 3 ответа фидбека записаны в Obsidian `Memory/SAAS/`.

OUT OF SCOPE (до фидбека)
Deal pipeline · Contact→Company link · AI · Activity timeline · counterparty-check · RBAC · UX-полировка (debounce/phone/company-search/FTS)

---

## MVP прогресс (всё DONE, prod)
Platform+Auth · Contact+Notes+Search · Company CRUD+search (`fab5d9f`, run #78) · Call+Request scaffold. Изоляция: org-scoped repos + e2e cross-org — проверено Claude.

## Turnkey: первый пользователь (шаги Founder)
1. **Pre-flight (сам, 5 мин)** на web-URL: Register→Login→создать контакт→заметку→найти поиском→создать компанию с ИНN→найти. Убедиться, что путь не сломан.
2. **Выбрать человека:** один реальный менеджер, кто каждый день звонит/ведёт контакты (напр. MagicMet: Кирилл m2 / Артём m5). Не founder, не разработчик.
3. **Дать ссылку** web-URL + задача: «зарегистрируйся, добавь 3 своих реальных контакта, после звонка добавь заметку, найди контакт поиском».
4. **Смотреть 15 мин** (живой watch-session или скринкаст), молча отмечать, где спотыкается.
5. **3 вопроса:** (1) что было непонятно? (2) нашёл быстрее, чем в Excel/телефоне? (3) пользовался бы каждый день — почему нет?
6. **Записать** ответы в Obsidian `Memory/SAAS/` → Claude обновит DECISIONS/приоритет по фидбеку.

## Prod
web https://web-production-e22e3.up.railway.app · api https://api-production-7f43a.up.railway.app · `/health` ok

BLOCKERS
Founder: имя первого пользователя + запуск watch-session. Кода не трогаем до фидбека.

## Примечание (док↔код) — RESOLVED 2026-07-03
Claude подтвердил: связка Contact→Company частично внедрена (schema+migration+e2e+UI), но не закоммичена и не проверена CI → статус UNPROVEN. Решение: изолировать в ветку (см. chore выше), не расширять до фидбека.
