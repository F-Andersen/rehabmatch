# Статус реалізації RehabMatch MVP

Оновлено: **2026-10-17** (M1B).

| Етап | Статус | Примітки |
|---|---|---|
| M0 — Аудит | DONE | |
| M1A — Bootstrap | DONE | Monorepo, health API, UI shell |
| M1B — Prisma/seed | **PARTIAL** | Код готовий; Docker/PostgreSQL недоступні в CI-середовищі агента |
| M2 — Auth | NOT STARTED | |
| M3 — Каталог | NOT STARTED | |
| M4 — AHP/WSM | NOT STARTED | |
| M5 — Підбір | NOT STARTED | |
| M6 — Відгуки/заявки/admin | NOT STARTED | |
| M7 — QA/E2E | NOT STARTED | |

## M1B — що зроблено

- `server/prisma/schema.prisma` (з `DATABASE_URL`, без зміни моделей MVP)
- Початкова міграція `20251017143000_initial`
- Ідемпотентний `server/prisma/seed.ts` (CSV 48 спеціалістів, довідники, admin, 3 пацієнти)
- Prisma Client, `GET /api/v1/health/database`
- Скрипти `db:validate`, `db:generate`, `db:migrate`, `db:seed`, `db:studio`

## Відхилення від handoff-схеми

| Пункт | Рішення |
|---|---|
| `datasource url` | Додано `url = env("DATABASE_URL")` (вимога Prisma CLI) |
| Email case-insensitive | Нормалізація до lower-case у seed; CITEXT — post-MVP |
| Prisma seed config | `package.json#prisma.seed` (deprecated у Prisma 7, ок для 6.x) |

## Перевірки M1B (2026-10-17)

| Перевірка | Результат |
|---|---|
| `npm run db:validate` | OK |
| `npm run db:generate` | OK |
| `prisma migrate` / `db:seed` | **Не виконано** — Docker Engine не запущений, порт 5432 закритий |
| Повторний seed / підрахунок записів | **Не виконано** (немає БД) |
| `npm run typecheck` | OK |
| `npm test` | OK (3 тести) |
| `npm run build` | OK |
| `GET /api/v1/health` | OK (після запуску API) |
| `GET /api/v1/health/database` | **Не перевірено на живій БД** |
| Docker persistence restart | **Не перевірено** |

## Локальне завершення M1B (на машині розробника)

```bash
# Запустити Docker Desktop, потім:
npm run db:up
npm run db:migrate
npm run db:seed
npm run db:seed   # повторно — без дублікатів
npm run dev
curl http://localhost:3001/api/v1/health/database
```

Очікувані лічильники після seed: specialists **48**, cities **6**, districts **18**, specializations **5**, injury types **5**, formats **3**, criteria **5**, services **48**, users **52** (48 specialists + 3 patients + 1 admin).
