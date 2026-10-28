# Повторный запуск локального пилота

Существующая установка: `/workspace/research/espo-runtime/compose.yml`, проект Compose `rea-espo`. Параметры локального тестового доступа находятся в `.env` рядом с compose, mode 600, вне Git. Не использовать эти тестовые данные для публичного сервиса.

```bash
cd /workspace/research/espo-runtime
docker compose -p rea-espo up -d
set -a
. ./.env
set +a
python3 verify-chain.py
python3 verify-capture.py
python3 prepare-scenario.py company-scenario.json /tmp/espo-company-scenario.json
REA_LOCAL_ESPO_PASSWORD="$ESPO_RESEARCH_PASSWORD" \
  PATH=/workspace/tools/node-v24.22.1-linux-x64/bin:$PATH \
  /workspace/tools/rea/node_modules/.bin/rea capture-browser-scenario \
  /tmp/espo-company-scenario.json --format json > company-evidence-new.json
```

Тест добавляет только синтетические записи. Генератор prepare-scenario.py автоматически задаёт уникальное имя компании и locator для каждого прогона. Примеры Evidence в этой директории относятся к уже выполненным прогонам.

Только локальные запросы для проверки; публичная preview-ссылка не создаётся. Фоновые процессы не сохраняются между средами — запуск Compose обязателен. Каждый cloud task изолирован, дополнительный worktree не требуется.

При переносе шаблона compose в чистую среду задайте собственные локальные пароли через `.env`/переменные, не коммитьте значения. При восстановлении существующих томов используйте прежние bindings: замена env не меняет автоматически пароль созданного пользователя в БД/CRM. Не применяйте `down -v` к существующим пользовательским данным.
