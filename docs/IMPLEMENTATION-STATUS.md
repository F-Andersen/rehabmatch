# Статус реалізації RehabMatch MVP

Оновлено: **2026-10-17** (M2).

| Етап | Статус | Примітки |
|---|---|---|
| M1A — Bootstrap | DONE | |
| M1B — Prisma/seed | DONE | |
| M2 — Auth & RBAC | **DONE** | Сесії, API, UI login/register, кабінети |
| M3 — Каталог | NOT STARTED | |
| M4 — AHP/WSM | NOT STARTED | |
| M5 — Підбір | NOT STARTED | |
| M6 — Відгуки/заявки/admin | NOT STARTED | |
| M7 — QA/E2E | NOT STARTED | Базовий auth E2E додано в M2 |

## M2 — перевірки (2026-10-17)

| Перевірка | Результат |
|---|---|
| `npm test` (server) | OK — 16 тестів (unit + auth integration) |
| `npm run typecheck` | OK |
| `npm run build` | OK |
| `npm run e2e` | OK — реєстрація пацієнта → `/dashboard` |
| `GET /api/v1/health/database` | OK (при запущеному API + PostgreSQL) |

## Auth API

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `PATCH /api/v1/me`
- `GET /api/v1/admin/summary` (ADMIN)
- `GET /api/v1/patient/me` (PATIENT)

Prisma-міграцій у M2 не було (моделі Session/User вже існували).
