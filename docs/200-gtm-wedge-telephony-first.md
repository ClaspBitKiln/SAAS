# 200 — GTM Wedge: Telephony-First (стратегия захвата рынка)

Это продуктово-маркетинговое решение, не архитектурное. Архитектурный порядок сборки
(ADR-002) НЕ меняется. См. раздел «Согласование» ниже.

## Позиционирование
Не CRM, не inbox, не телефония по отдельности, а **AI Revenue Execution OS**:
звонок/сообщение → AI → CRM создаётся сам → задача → сделка → аналитика.
Парадигма: «AI генерирует CRM из реальных событий», а не «AI внутри CRM».

## Конкурентная карта (слои)
- L1 CRM (данные): Salesforce, HubSpot, **Bitrix24** (прямой враг в РФ).
- L2 CRM+Automation: Zoho, Pipedrive, HubSpot Workflows.
- L3 Communication OS: Intercom, Front, Twilio Flex (самый недооценённый слой, ближе всего к нашему ядру).
- L4 AI Revenue OS (новый рынок): Relaticle, AI-CRM-стартапы, Gong/Salesloft.
**Прямые конкуренты:** Bitrix24, Intercom, Twilio Flex, emerging AI-CRM.
**White space:** CRM+Inbox+Telephony+AI-agents как единое event-driven ядро, «execution-first», AI как actor, monolith «под кодогенерацию».

## Клин (wedge) — Telephony-First + AI CRM Core
Вход через одну боль с ROI за 1–3 дня:
```
Call → AI → CRM auto-creation → Inbox → Task → Deal
```
Почему телефония: Bitrix-телефония дорогая/неудобная; B2B-продажи = голос; после первого
звонка CRM заполняется сама — это «магия». KPI MVP: **время от звонка до заполненной CRM < 30 сек**.

## Первая ниша
B2B-команды с большим объёмом звонков: IT-интеграторы, агентства, сервисные/коллориентированные
компании (часто на Bitrix, который не любят).

## Фазы
- Phase 1 (0–100): дешёвая телефония + AI-summary.
- Phase 2 (100–1000): CRM auto-fill + inbox.
- Phase 3 (1000+): automation + AI-агенты → full Sales OS.

## Телефония в РФ (реальность)
Технически WebRTC+SIP+FreeSWITCH работает. НО мы **не оператор**: звоним через
лицензированных SIP-провайдеров (Zadarma / Mango / UIS / Sipuni). Учитываем 152-ФЗ и
ФЗ «О связи»: БД и записи звонков — в РФ; PII под контролем (ADR-003 §7).
- Phase 1: интеграция с SIP-API провайдера (1–2 недели, без лицензий).
- Phase 2: multi-provider + LCR (least cost routing).
- Phase 3: своя SIP-инфраструктура (Kamailio+FreeSWITCH). Не строить телеком-компанию.

## Pricing (с первого месяца)
- Free trial: 50–100 звонков.
- База: $19–29 / пользователь (calls + AI summary + CRM auto-fill).
- Телефония: usage-based $0.01–0.03/мин.
- Upsell: AI-аналитика, call coaching, automation, интеграции.

## MVP 90 дней (срез)
Stage 1 Telephony core (WebRTC, SIP, запись, история) → Stage 2 AI (STT/summary/sentiment/
next action/lead extraction) → Stage 3 Auto-CRM (Contact/Company/Deal/Task) → Stage 4 Inbox
(склейка call+telegram+email).

## ⚠️ Согласование с ADR-002 (важно, честно)
ADR-002 = **порядок сборки кода** (фундамент → CRM → Communication → Telephony).
Этот документ = **порядок ценности для клиента** (первый платный срез — телефония→AI→CRM).
Конфликта нет: фундамент (platform/auth/users/rbac) строится первым в любом случае; затем
первый вертикальный срез, который показываем рынку, — call→AI→CRM. Если телефония нужна
раньше CRM-полноты — допустимо реализовать **минимальный CRM** (Contact/Company/Deal) внутри
того же среза, не нарушая зависимостей. Любое изменение порядка фиксировать новым ADR.
