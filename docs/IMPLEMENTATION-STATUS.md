# Статус реалізації RehabMatch MVP

Оновлено: **2026-10-17** (M1A завершено).

| Етап | Статус | Примітки |
|---|---|---|
| M0 — Аудит | DONE | План M0–M7 затверджено |
| M1A — Bootstrap | **DONE** | Monorepo, health API, UI shell, Docker Compose файл |
| M1B — Prisma/seed | NOT STARTED | Міграції, seed, `db:migrate`, `db:seed` |
| M2 — Auth | NOT STARTED | |
| M3 — Каталог | NOT STARTED | |
| M4 — AHP/WSM | NOT STARTED | |
| M5 — Підбір | NOT STARTED | |
| M6 — Відгуки/заявки/admin | NOT STARTED | |
| M7 — QA/E2E | NOT STARTED | |

## Команди

| Команда | Призначення |
|---|---|
| `npm install` | Залежності workspaces |
| `npm run db:up` | PostgreSQL (потрібен запущений Docker Desktop) |
| `npm run dev` | Client :5173 + API :3001 |
| `npm run typecheck` | TypeScript client + server |
| `npm run build` | Production build |
| `npm test` | Vitest: `GET /api/v1/health` |

## Перевірки M1A (2026-10-17)

| Перевірка | Результат |
|---|---|
| `npm install` | OK |
| `npm run typecheck` | OK |
| `npm run build` | OK |
| `npm test` | OK (1 тест) |
| `GET /api/v1/health` | OK (`{"data":{"status":"ok"}}`) |
| `docker compose up -d` | **Не виконано** — Docker daemon не запущений (Docker Desktop) |
