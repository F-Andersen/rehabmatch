# Статус реалізації RehabMatch MVP

Оновлено: **2026-10-17** (M1B завершено).

| Етап | Статус | Примітки |
|---|---|---|
| M0 — Аудит | DONE | |
| M1A — Bootstrap | DONE | Monorepo, health API, UI shell |
| M1B — Prisma/seed | **DONE** | Міграція, seed, health/database, persistence |
| M2 — Auth | NOT STARTED | |
| M3 — Каталог | NOT STARTED | |
| M4 — AHP/WSM | NOT STARTED | |
| M5 — Підбір | NOT STARTED | |
| M6 — Відгуки/заявки/admin | NOT STARTED | |
| M7 — QA/E2E | NOT STARTED | |

## Перевірки M1B (2026-10-17)

| Перевірка | Результат |
|---|---|
| Docker Engine + `docker compose up` | OK (після запуску Docker Desktop / WSL `docker-desktop`) |
| `DATABASE_URL` ↔ `POSTGRES_*` | OK (localhost:5432, user/db узгоджені) |
| `npm run db:validate` / `db:generate` | OK |
| `prisma migrate deploy` | OK (`20251017143000_initial`) |
| `npm run db:seed` (×2) | OK, лічильники стабільні |
| `docker compose restart postgres` | OK, дані збережені |
| `GET /api/v1/health` | OK |
| `GET /api/v1/health/database` | OK (`database: connected`) |
| Frontend → API (proxy) | OK («Підключено» на головній) |
| `npm run typecheck` / `test` / `build` | OK (3 тести) |

## Лічильники після seed (очікувані = фактичні)

| Сутність | Кількість |
|---|---|
| Specialists | 48 |
| Cities | 6 |
| Districts | 18 |
| Specializations | 5 |
| Injury types | 5 |
| Formats | 3 |
| Criteria | 5 |
| Services | 48 |
| Users | 52 |
| Specialist APPROVED / PENDING | 40 / 8 |
| Admin | `admin@example.test`, role ADMIN |

## Локальний запуск БД

```bash
npm run db:up
npm run db:migrate:deploy -w server   # або npm run db:migrate після першого dev
npm run db:seed
```

Якщо `docker info` падає: увімкніть **Docker Desktop** і переконайтесь, що WSL-дистрибутив `docker-desktop` у стані Running (`wsl -l -v`).
