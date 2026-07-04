# STEP: EGRUL autofill by INN (DaData) — self-filling principle #11

Date:        2026-07-04
Executor:    Claude (code) + Founder (push + DADATA_API_KEY in Railway) — role exception per DECISIONS 2026-07-04
Commit:      `6b62169` feat(companies): egrul autofill by inn via dadata lookup (13 files, +330)
CI:          workflow `api` — GREEN (подтверждено внешне: endpoint виден в prod OpenAPI)
Prod check:  `/companies/inn-lookup/{inn}` + `InnLookupResponseDto` присутствуют в https://api-production-7f43a.up.railway.app/docs-json (Claude, web_fetch)

## Scope
- `InnLookupService` (DaData findById/party, node:https, timeout 8s, ключ только в env `DADATA_API_KEY`)
- `GET /companies/inn-lookup/:inn` — JWT, ИНН-формат → 400, network fail → 502, без ключа → `{configured:false}` (CI без сети)
- Pure mapper `mapDaDataParty` + unit spec; e2e: configured:false · 400 · 401
- Web: кнопка «Заполнить по ИНН» в форме компании → name автозаполняется, инфо ОГРН/статус/адрес
- `.env.example`: DADATA_API_KEY

## Limitation
Только РФ (ЕГРЮЛ/ЕГРИП). Контрагенты Узбекистана (СТИР) не покрываются — см. AI_CONTEXT §11 вопрос 8.

## Owner DoD — **CONFIRMED 2026-07-04**
Founder: DADATA_API_KEY добавлен в Railway, redeploy выполнен, кнопка «Заполнить по ИНН» проверена в prod UI на реальном ИНН — «работает». Graceful-режим без ключа также проверен визуально (скрин 08:26).
