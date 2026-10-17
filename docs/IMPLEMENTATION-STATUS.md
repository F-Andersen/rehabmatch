# Статус реалізації RehabMatch MVP

Оновлено: **2026-10-17** (M6).

| Етап | Статус | Примітки |
|---|---|---|
| M1A — Bootstrap | DONE | |
| M1B — Prisma/seed | DONE | |
| M2 — Auth & RBAC | DONE | |
| M3 — Каталог / модерація | DONE | |
| M4 — AHP / WSM engine | DONE | |
| M5 — Персоналізований підбір | DONE | |
| M6 — Відгуки / заявки / admin | **DONE** | Reviews, AppointmentRequest, розширена `/admin` |
| M7 | NOT STARTED | |

## M6 — перевірки (2026-10-17)

| Перевірка | Результат |
|---|---|
| `npm run typecheck` | OK |
| `npm test` | OK — 69 тестів (включно `m6.integration.test.ts`) |
| `npm run build` | OK |
| `npm run e2e` | OK — 6 тестів |
| `prisma migrate status` | OK — схема актуальна, нових міграцій M6 не потрібно |

## API (M6)

- `POST /api/v1/specialists/:id/reviews` — відгук пацієнта (PENDING)
- `GET /api/v1/specialists/:id/reviews/mine` — власний відгук (PATIENT)
- `GET /api/v1/specialists/:id/reviews` — публічні APPROVED (M3)
- `POST /api/v1/appointment-requests` — заявка REQUESTED
- `GET /api/v1/me/appointment-requests` — список пацієнта
- `PATCH /api/v1/me/appointment-requests/:id/cancel` — CANCELLED
- `GET /api/v1/specialist/appointment-requests` — вхідні заявки
- `PATCH /api/v1/specialist/appointment-requests/:id/status` — ACCEPTED / DECLINED
- `GET /api/v1/admin/users`, `PATCH .../status`
- `GET /api/v1/admin/reviews`, `PATCH .../status` (+ перерахунок рейтингу)
- `GET /api/v1/admin/appointment-requests`
- `GET/POST/PATCH /api/v1/admin/catalog/:type`, `GET/PATCH /api/v1/admin/criteria/:id`
- `GET /api/v1/admin/summary` — + `pendingReviews`

## Frontend (M6)

- Профіль спеціаліста A.6 — рейтинг, відгуки, форма відгуку, запит на консультацію
- `/my-requests` — заявки пацієнта
- `/specialist/requests` — обробка заявок спеціалістом
- `/admin/*` — користувачі, відгуки, заявки, довідники, критерії (модерація спеціалістів збережена)

## OpenAPI

- `docs/api/openapi.yaml` — скелет шляхів M6 (доповнювати разом із наступними етапами)
