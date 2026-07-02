# Turnkey — первый живой пользователь (prod)

> Решение D-001 · Prod LIVE с 2026-07-02 · Обновлять при смене URL или scope.

## Prod URLs

| Сервис | URL |
|--------|-----|
| Web (регистрация) | https://web-production-e22e3.up.railway.app |
| API health | https://api-production-7f43a.up.railway.app/health |

Проверка перед онбордингом:
```bash
curl -s https://api-production-7f43a.up.railway.app/health
# → {"status":"ok","database":"up"}
```

---

## Что умеет продукт сегодня (happy path)

1. **Register** — `/register` → workspace + admin
2. **Login** → Dashboard (счётчики контактов/звонков)
3. **Contacts** — CRUD, поиск `?q=`, заметки к контакту
4. **Companies** — CRUD юрлиц, ИНН (уникален внутри org), поиск по name/inn/email
5. **Calls** — лог исходящего/входящего звонка к контакту
6. **Requests** — parse + create (E-Metall scaffold, live API выключен)
7. **Team** — invite коллеги (membership + accept link)

## Чего нет (сказать заранее)

- Сделки / воронка (Deal)
- Связь контакт ↔ компания
- AI summary звонков
- Проверка контрагента по ИНН (inn-bot)
- Телефония / Inbox
- Роли кроме «все в одной org»

---

## Сценарий для владельца (15 мин до звонка менеджеру)

### 1. Smoke (сам)

1. Открыть `/register` в инкогнито
2. Создать тестовый workspace → Dashboard
3. Contacts → +1 контакт с телефоном
4. Companies → +1 юрлицо с ИНН (например реальный ИНН клиента)
5. Calls → залогировать звонок к контакту
6. Contacts → открыть контакт → добавить заметку после «звонка»

Если всё ок — prod готов к живому пользователю.

### 2. Онбординг менеджера

**Вариант A — саморегистрация (рекомендуется):**
1. Отправить ссылку: `https://web-production-e22e3.up.railway.app/register`
2. Попросить: название компании, имя, рабочий email, пароль (≥8 символов)
3. После входа — 10-минутный созвон: пройти пункты happy path вместе

**Вариант B — invite второго менеджера:**
1. Admin: Dashboard → Team → invite email + имя
2. Отправить invite link из UI
3. Коллега: set password → login

### 3. Скрипт для менеджера (5 задач)

Попроси выполнить и проговорить вслух:

| # | Задача | Зачем |
|---|--------|-------|
| 1 | Добавить 3 реальных контакта (имя + телефон) | Базовый CRM |
| 2 | Добавить 1–2 юрлица с ИНН клиентов | B2B контекст |
| 3 | Залогировать 2 звонка (до/после разговора) | Call-first wedge |
| 4 | Написать заметку к контакту после звонка | Notes |
| 5 | Найти контакт через поиск | Search |

---

## Сбор фидбека

Шаблон: [`FEEDBACK_TEMPLATE.md`](FEEDBACK_TEMPLATE.md)

После сессии сохранить ответы в:
`docs/EVIDENCE/FEEDBACK_<YYYY-MM-DD>_<org-slug>.md`

Ключевые вопросы:
- Что сделали за 10 минут без подсказок?
- Что искали и не нашли?
- Готовы ли вернуться завтра? Почему да/нет?
- Deal или связка контакт–компания — что болит сильнее?

---

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| Network error на login | Проверить `NEXT_PUBLIC_API_URL` у web + CORS на API |
| 401 после login | Перелогиниться; rate limit 5/min на login |
| ИНН «already exists» | Дубликат внутри org — другой ИНН или удалить старую запись |
| Не видит Companies | Меню слева → Companies (не на Dashboard-карточках) |

---

## После фидбека

Founder решает следующий срез → обновить `docs/NEXT.md`. Cursor не выбирает приоритет сам.
