# AUTONOMOUS_CI — тестирование и починка без человека

Цель: проект сам прогоняет тесты и сам чинит падения. Источник истины — CI (ADR-021).

## Как это работает у нас
1. `.github/workflows/api.yml` — прогон: lint → prisma → build → unit → integration → e2e,
   с Postgres/Redis service containers (мировой best-practice для Prisma в CI).
2. `.github/workflows/autofix.yml` — self-healing: при `conclusion == failure` агент
   (`anthropics/claude-code-action`) читает лог, находит root cause, коммитит минимальный
   фикс кода (не тестов), пишет запись в `KNOWN_FAILURES.md`. Новый прогон CI проверяет.
3. Цикл повторяется: Push → CI_RED → auto-repair → CI → … → CI_GREEN.

## Что нужно один раз настроить
**Бесплатный путь (как в inn-bot — по умолчанию):**
- Завести ключ на **openrouter.ai** (бесплатно) и положить секрет **OPENROUTER_API_KEY**.
- `autofix.yml` уже настроен: `ANTHROPIC_BASE_URL=https://openrouter.ai/api`,
  модель `deepseek/deepseek-r1:free`. Тесты (`api.yml`) на GitHub Actions и так бесплатны.
- Минусы free-моделей: жёсткие лимиты (~50–200 запросов/день) и ниже надёжность на
  многошаговых фиксах. Для сложных падений можно временно переключиться на платную модель.

**Платный путь (точнее):** секрет **ANTHROPIC_API_KEY** + модель `claude-sonnet-4-6`
(см. закомментированный блок в `autofix.yml`). Anthropic API требует кредитов и
недоступен напрямую в РФ — поэтому дефолт у нас OpenRouter.

Общее:
- Тег экшена **>= v1.0.94** (исправленные уязвимости).
- Branch protection: merge только при зелёном `api` (ADR-025 Release Gate).

## Безопасность (важно, по реальным инцидентам 2026)
- НЕ использовать `pull_request_target` для PR из форков (риск утечки секретов и
  выполнения недоверенного кода с доступом к ANTHROPIC_API_KEY).
- Least-privilege `permissions` в workflow (у нас: contents/pull-requests write).
- Для форков секреты недоступны — autofix работает на ветках своего репозитория.

## Альтернативы / мировой опыт (если захочешь усилить)
- **GitHub Agentic Workflows (gh-aw)** — natural-language workflows (markdown+YAML),
  встроенный паттерн «failure = trigger для repair-agent».
- **OpenHands** — автономный агент с песочницей, headless для CI (большой open-source).
- **Aider** (`--auto`) — diff-based фиксы с git-интеграцией, дёшево и предсказуемо.
- **Composio AO / Hermes** — агенты в изолированных worktree, сами ведут PR и чинят CI.
- **LLM-as-a-Judge** — вторичная модель оценивает результат вместо хардкода строк.

## Модель/стоимость
Claude Sonnet 4.6 — разумный дефолт для рутинных CI-фиксов (≈на 60% дешевле Opus;
для ~50 PR/мес обычно < $5). Opus — для сложных регрессий.
