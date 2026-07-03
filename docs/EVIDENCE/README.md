# EVIDENCE — факты по завершённым шагам

Один файл на завершённый шаг: `STEP_<YYYY-MM-DD>_<NAME>.md`. Только факты, без диалогов.

Шаблон:
```
# STEP: <название>
Commit:      <hash>
CI:          <run URL> (GREEN)
Production:  <URL или n/a>
DoD:         <что считается сделанным>
Known issues:<или "нет">
```

Полный журнал прогонов — `docs/BUILD_STATUS.md`. Здесь — срез «что доказано» по каждому шагу.
