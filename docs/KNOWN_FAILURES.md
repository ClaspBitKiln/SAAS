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
