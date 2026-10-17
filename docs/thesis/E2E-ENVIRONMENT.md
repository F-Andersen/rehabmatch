# Ізольоване середовище Playwright E2E

## Причини попередньої нестабільності

| Симптом | Причина |
|---------|---------|
| HTTP 429 на `/auth/register` | In-memory rate limit **30 req / 15 хв** на IP; паралельні E2E реєстрації вичерпували ліміт на спільному dev API. |
| Помилки запису PNG | Паралельні `visual-qa` проєкти писали в один шлях `docs/thesis/screenshots/` (конкуренція за файл на Windows). |
| Flaky matching | Тимчасові 429 / навантаження на API, не відсутність preview. |

## Рішення

1. **Окрема БД** `rehabmatch_e2e` (`E2E_DATABASE_URL`) — demo `rehabmatch` не використовується Playwright.
2. **`REHABMATCH_E2E=1`** на API-процесі, який піднімає Playwright (`webServer`): збільшена квота auth **лише якщо `NODE_ENV !== production`**.
3. **Production** (`NODE_ENV=production`): `e2eMode` завжди **false**, ліміт **30** без змін.
4. Скріншоти smoke `visual-qa` → `e2e/artifacts/visual-qa/` (gitignored). Дипломні кадри — `visual-app-screens.spec.ts` → `docs/thesis/screenshots/`.
5. `globalSetup` / `globalTeardown`: migrate + seed на E2E БД; cleanup ephemeral `@example.test` (seed admin/demo зберігаються).

## Налаштування

```bash
cp .env.e2e.example .env.e2e
# Відредагуйте пароль та SEED_ADMIN_PASSWORD (як у .env)
npm run e2e:prepare   # опційно; globalSetup виконає те саме
npm run e2e
```

`E2E_POSTGRES_ADMIN_URL` — підключення до БД `postgres` для `CREATE DATABASE` (локальний Docker).

## Захист demo БД

Скрипти `e2e-db-prepare.ts` / `e2e-db-cleanup.ts` викликають `assertSafeE2eDatabase()` — дозволено **тільки** ім’я `rehabmatch_e2e`. База `rehabmatch` відхиляється.
