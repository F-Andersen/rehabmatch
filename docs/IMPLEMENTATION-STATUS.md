# Статус реалізації RehabMatch MVP

Оновлено: **2026-10-17** (M5).

| Етап | Статус | Примітки |
|---|---|---|
| M1A — Bootstrap | DONE | |
| M1B — Prisma/seed | DONE | |
| M2 — Auth & RBAC | DONE | |
| M3 — Каталог / модерація | DONE | |
| M4 — AHP / WSM engine | DONE | |
| M5 — Персоналізований підбір | **DONE** | SearchRequest, збереження Recommendation, UI wizard |
| M6 — Відгуки/заявки | NOT STARTED | |

## M5 — перевірки (2026-10-17)

| Перевірка | Результат |
|---|---|
| `npm run typecheck` | OK |
| `npm test` | OK — 57 тестів (включно demo-scenarios) |
| `npm run build` | OK |
| `npm run e2e` | OK — 4 тести (auth, catalog, matching) |

## API (M5)

- `POST /api/v1/search-requests` — створення пошукового запиту (PATIENT)
- `GET /api/v1/search-requests/:id` — власний запит + пріоритети/порівняння
- `POST /api/v1/recommendations` — розрахунок + збереження (AHP/WSM)
- `GET /api/v1/recommendations/:id` — збережений результат
- `GET /api/v1/recommendations` — історія (paged)
- `POST /api/v1/ahp/calculate` — preview (M4)

## Frontend (M5)

- `/matching/new` — параметри пошуку
- `/matching/:id/criteria` — AHP wizard / DIRECT_WSM
- `/recommendations/:id` — результати A.5
- `/recommendations` — історія
- `/dashboard` — швидкий доступ до підбору
