# RehabMatch MVP

**RehabMatch** — демонстраційна веб-система інтелектуального підбору спеціалістів з реабілітації на основі **гібриду AHP + WSM** (парні порівняння або прямі ваги). Це **не** медична інформаційна система та **не** підтверджений запис до лікаря.

**Стек:** React (Vite) + TypeScript · Express + TypeScript · PostgreSQL · Prisma.

Прогрес етапів: `docs/IMPLEMENTATION-STATUS.md` · API: `docs/api/openapi.yaml` · Магістерські матеріали: `docs/thesis/`.

## Вимоги

- Node.js **20+**, npm **10+**
- Docker Desktop (PostgreSQL)
- Windows: PowerShell; для ланцюжків команд використовуйте `;` замість `&&`

## Встановлення (чистий checkout)

```bash
npm install
cp .env.example .env
```

У `.env` задайте (не комітьте файл):

- `POSTGRES_PASSWORD`, `DATABASE_URL`
- `SESSION_SECRET` (довгий випадковий рядок)
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (локальний admin для seed)

```bash
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

| Сервіс | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3001 |
| Health | http://localhost:3001/api/v1/health |
| DB health | http://localhost:3001/api/v1/health/database |

## Команди

| Команда | Опис |
|---------|------|
| `npm run dev` | Client + server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm test` | Vitest (server) |
| `npm run e2e` | Playwright (ізольована БД `rehabmatch_e2e`, піднімає API+client) |
| `npm run e2e:prepare` | Міграції + seed на E2E БД (див. `.env.e2e.example`) |
| `npm run e2e:visual` | Smoke-скріншоти → `e2e/artifacts/visual-qa/` |
| `npm run bench:recommendation` | Benchmark алгоритму (синтетика) |
| `npm run openapi:lint` | Валідація OpenAPI |
| `npm run db:validate` | `prisma validate` |
| `npm run audit:test-data -w server` | Звіт тестових користувачів у БД |

## Demo accounts

- **Admin** створюється seed (`SEED_ADMIN_EMAIL` у `.env`). Пароль **не** зберігайте в репозиторії та не вставляйте в README.
- **PATIENT / SPECIALIST** — реєстрація через UI (`/register`).
- Демо-спеціалісти з seed — вигадані профілі з позначкою demo.

## Тестування

1. `npm test` — Vitest (локальна demo БД з `.env`).
2. E2E: `cp .env.e2e.example .env.e2e`, налаштуйте `E2E_DATABASE_URL` → **`rehabmatch_e2e`** (не `rehabmatch`).
3. `npm run e2e` — global setup створить БД (за потреби), migrate, seed; API з `REHABMATCH_E2E=1` (auth quota для тестів; production ліміт не змінюється).
4. Демо вручну: `npm run dev` + БД **`rehabmatch`** — E2E її не очищає.
5. Деталі: `docs/thesis/E2E-ENVIRONMENT.md`, audit: `docs/thesis/DEPENDENCY-AUDIT.md`.

## Типові проблеми (Windows)

- **Prisma EPERM on generate** — зупиніть `npm run dev`, повторіть `npm run db:generate`.
- **E2E 404 на API** — переконайтесь, що API слухає `3001`, client `5173`.
- **Docker** — перевірте `docker ps`, порт 5432 вільний.

## Обмеження MVP

Немає OAuth, платежів, eHealth, LLM, повноцінного календаря, email/SMS. Заявка на консультацію — лише статусний workflow. Рекомендації не перераховуються задним числом при зміні рейтингу.

## Документація

- `docs/01-PRODUCT-REQUIREMENTS.md` — вимоги
- `docs/06-API-CONTRACT.md` — контракт REST
- `docs/api/openapi.yaml` — OpenAPI 3.0.3
- `AGENTS.md` — правила розробки та Git author
