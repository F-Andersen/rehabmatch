# Статус реалізації RehabMatch MVP

Оновлено: **2026-10-17** (M3).

| Етап | Статус | Примітки |
|---|---|---|
| M1A — Bootstrap | DONE | |
| M1B — Prisma/seed | DONE | |
| M2 — Auth & RBAC | DONE | |
| M3 — Каталог / профілі / модерація | **DONE** | API каталогу, кабінет спеціаліста, admin moderation UI |
| M4 — AHP/WSM | NOT STARTED | |
| M5 — Підбір | NOT STARTED | |
| M6 — Відгуки/заявки/admin | NOT STARTED | Частина admin лише для спеціалістів у M3 |
| M7 — QA/E2E | PARTIAL | Auth + catalog E2E |

## M3 — перевірки (2026-10-17)

| Перевірка | Результат |
|---|---|
| `npm run typecheck` | OK |
| `npm test` (server) | OK — 23 тести (health + auth + catalog integration) |
| `npm run build` | OK |
| `npm run e2e` | OK — auth + каталог (3 тести) |
| `GET /api/v1/health/database` | OK |
| Prisma migrate `20251017190000_specialist_city_optional` | Застосовано |

## Публічний API (M3)

- `GET /api/v1/catalog` — довідники фільтрів
- `GET /api/v1/specialists` — каталог (лише APPROVED + city)
- `GET /api/v1/specialists/:id` — публічний профіль
- `GET /api/v1/specialists/:id/reviews` — схвалені відгуки

## Specialist portal (M3)

- `GET /api/v1/specialist/me`
- `PUT /api/v1/specialist/me`
- `PUT /api/v1/specialist/me/services`

## Admin moderation (M3)

- `GET /api/v1/admin/specialists`
- `GET /api/v1/admin/specialists/:id`
- `PATCH /api/v1/admin/specialists/:id/verification`

## Auth API (M2, без змін контракту)

- `POST /api/v1/auth/register` — SPECIALIST без автоматичного міста
- `POST /api/v1/auth/login` / `logout` / `GET /auth/me`
- `PATCH /api/v1/me`, `GET /api/v1/admin/summary`, `GET /api/v1/patient/me`

## Frontend (M3)

- `/specialists` — каталог з фільтрами, сортуванням, URL query, пагінацією
- `/specialists/:id` — детальний профіль
- `/specialist/dashboard` — перегляд і редагування анкети
- `/admin/specialists` — модерація статусів
