# Статус реалізації RehabMatch MVP

Оновлено: **2026-10-17** (M4).

| Етап | Статус | Примітки |
|---|---|---|
| M1A — Bootstrap | DONE | |
| M1B — Prisma/seed | DONE | |
| M2 — Auth & RBAC | DONE | |
| M3 — Каталог / профілі / модерація | DONE | |
| M4 — AHP / WSM engine | **DONE** | Pure math + `POST /ahp/calculate` preview |
| M5 — Підбір (persist) | NOT STARTED | |
| M6 — Відгуки/заявки/admin | NOT STARTED | |
| M7 — QA/E2E | PARTIAL | Auth + catalog E2E; AHP wizard — M5 |

## M4 — перевірки (2026-10-17)

| Перевірка | Результат |
|---|---|
| `npm run typecheck` | OK |
| `npm test` (server) | OK — 51 тестів (алгоритми + M1–M3 regression) |
| `npm run build` | OK |
| `GET /api/v1/health/database` | OK (при запущеному API) |

## Алгоритм

- Версія: `ahp-gm-wsm-fixed-v1`
- Режими: `AHP_PAIRWISE`, `DIRECT_WSM`
- Модулі: `server/src/algorithms/` (ahp, normalization, scoring, ranking, explanation)
- Збереження рекомендацій / search-requests — **M5**

## API (M4)

- `POST /api/v1/ahp/calculate` (PATIENT) — preview ваг, CI/CR без persistence

## Публічний API (M3)

- `GET /api/v1/catalog`, `GET /api/v1/specialists`, …
- `GET/PUT /api/v1/specialist/me`, admin moderation
