# KNOWN FAILURES (журнал отказов)

Цель Sprint 1 — «First Contact With Reality»: получить первый `CI_RED` и системно его
разбирать. Первый красный CI ценнее ещё одного документа.

Формат записи:
```
# F-00X
Problem:           <что упало>
Evidence:          <ссылка на CI run / лог / artifact>   (ADR-023)
Root cause:        <корневая причина>
Fix:               <минимальный фикс>
Preventive action: <что сделать, чтобы класс отказов не повторялся>
Status:            PREDICTED | CONFIRMED | RESOLVED
```
Статусы: `PREDICTED` (ожидаем, ещё не было), `CONFIRMED` (подтверждён реальным CI-run),
`RESOLVED` (есть новый зелёный прогон — ADR-019/021).

## Рабочее правило: One Failure At A Time
Если CI упал на шаге `lint` — чиним ТОЛЬКО lint, не смотрим build/tests/e2e (они ещё
`unknown`, не доказаны). Минимальный фикс → следующий CI → следующий отказ. Без
рефакторингов/переписываний — только Minimal Fix (ADR-018: analyze → fix → retest).

Ниже — **предсказанные** отказы (status: PREDICTED), пока не подтверждены реальным CI-run.

---

# F-001
Problem:   ERR_PNPM_LOCKFILE_MISSING / нет pnpm-lock.yaml
Evidence:  —
Root cause: lockfile ещё не сгенерирован (нужен `pnpm install`)
Fix:       `pnpm install` → закоммитить `pnpm-lock.yaml`. (CI пока с `--no-frozen-lockfile`.)
Status:    PREDICTED

# F-002
Problem:   Cannot find module (shared/* , database/*)
Evidence:  —
Root cause: рассинхрон путей/алиасов. В коде используются относительные импорты (алиасов нет) — риск низкий, но проверить tsconfig baseUrl.
Fix:       держать относительные импорты или настроить tsconfig-paths + vite tsconfigPaths.
Status:    PREDICTED

# F-003
Problem:   Reflect.defineMetadata is not a function
Evidence:  —
Root cause: не загружен `reflect-metadata` до декораторов.
Fix:       импорт в `src/bootstrap/test-setup.ts` (vitest setupFiles) и `main.ts` — уже есть.
Status:    PREDICTED

# F-004
Problem:   Prisma Client not generated / типы @prisma/client отсутствуют при build
Evidence:  —
Root cause: `prisma generate` не выполнен до `tsc`/тестов.
Fix:       в CI шаг `prisma:generate` идёт до `build` и интеграционных тестов — уже так.
Status:    PREDICTED

# F-005
Problem:   describe/expect is not defined
Evidence:  —
Root cause: vitest globals.
Fix:       `globals: true` в `vitest.config.ts` — уже есть (+ явные импорты в спеках).
Status:    PREDICTED

# F-006
Problem:   SyntaxError: Cannot use import statement outside module (ESM/CJS)
Evidence:  —
Root cause: несоответствие module-системы при прогоне TS.
Fix:       vitest исполняет TS через esbuild; tsconfig module=commonjs для tsc-сборки. Проверить на первом run.
Status:    PREDICTED

# F-011
Problem:           CI `api` падает за ~35с на шаге настройки pnpm (все прогоны, main + dependabot)
Evidence:          GitHub Actions run 27943801590, annotation: "Multiple versions of pnpm specified:
                   version 9 in action config + pnpm@9.0.0 in package.json (packageManager)"
Root cause:        pnpm/action-setup@v4 конфликтует, когда версия задана и в `with: version` и в `packageManager`
Fix:               убрал `with: version: 9` из .github/workflows/api.yml (источник версии — packageManager)
Preventive action: задавать версию pnpm только в одном месте (packageManager в package.json)
Status:            RESOLVED (commit af7ef57, run #12: lint/prisma/build/unit/integration passed)

# F-010
Problem:           push упал: 'src refspec main does not match any' (нет коммита)
Evidence:          вывод push.bat 2026-06-22: husky pre-commit -> eslint -> 5 errors -> commit не создан
Root cause:        1) три `e as any` (no-explicit-any) в tenant.command-handlers.ts;
                   2) no-restricted-imports блокировал импорт prisma.service в platform.module.ts и в integration-тесте
Fix:               убрал `as any` (publish(e)); eslint override расширен на **/*.module.ts и **/tests/**
Preventive action: eslint-исключения для module/tests; не использовать any
Status:            RESOLVED (по review; подтвердит повторный запуск)

# F-009
Problem:           vitest не находит тесты / e2e не запускаются
Evidence:          статическая вычитка (shell-среда недоступна для прогона)
Root cause:        1) include ловил только *.spec.ts, а e2e-файл назван *.e2e-spec.ts;
                   2) test-скрипты использовали неваличный фильтр `src/**/tests/unit`
Fix:               include += 'src/**/*-spec.ts'; скрипты -> `vitest run unit|integration|e2e`
Preventive action: единый нейминг *.spec.ts; фильтры vitest как substring пути
Status:            RESOLVED (по review; подтвердить первым CI-прогоном)

# F-008
Problem:           push.bat: 'и' is not recognized as an internal or external command
Evidence:          локальный запуск push.bat (вывод пользователя, 2026-06-22)
Root cause:        кириллица в .bat ломает парсер cmd.exe (OEM codepage vs UTF-8) — фрагмент текста исполняется как команда
Fix:               push.bat переписан только на ASCII (англ. сообщения), логика та же
Preventive action: .bat/.cmd писать только ASCII; для не-ASCII — PowerShell с UTF-8
Status:            RESOLVED

# F-007
Problem:   eslint: cannot find module '@typescript-eslint/parser' (шаг Lint)
Evidence:  —
Root cause: eslint и плагины не были в devDependencies apps/api.
Fix:       добавлены eslint + @typescript-eslint/* + eslint-plugin-import в apps/api/package.json.
Status:    PREDICTED

# F-012
Problem:           E2E: POST /tenants returns 500 (expected 201/400); integration tests pass
Evidence:          GitHub Actions run 28282816006, step "E2E tests"
Root cause:        Vitest default esbuild transform does not emit decoratorMetadata; NestJS DI
                   (CommandBus/EventBus) and class-validator metadata fail at runtime in e2e only
Fix:               vitest.config.ts: unplugin-swc with legacyDecorator + decoratorMetadata
Preventive action: all NestJS/e2e tests must use SWC transform, not plain esbuild
Status:            RESOLVED (commit 0e24f73, run 28534981949: e2e passed, CI_GREEN)

# F-013
Problem:           Broken access control — CRM read/write without tenant scope (IDOR / OWASP A01)
Evidence:          Code review 2026-07-02: controllers trust client `organizationId`; repositories `findById` without org filter
Root cause:        JWT payload carries tenant/org but not wired into CQRS queries/commands or Prisma `where`
Fix:               `@CurrentUser()` + `requireOrganizationId`; scoped `findById(id, organizationId)` on Contact/Call/Request repos; tenant-isolation e2e
Preventive action: all CRM repository read methods must accept organizationId (or tenantId) scope — no unscoped findById
Status:            RESOLVED (pending CI_GREEN)
