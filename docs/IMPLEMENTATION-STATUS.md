# Статус реалізації RehabMatch MVP

Оновлено: **2026-10-17** (M7).

| Етап | Статус | Примітки |
|---|---|---|
| M1A — Bootstrap | DONE | |
| M1B — Prisma/seed | DONE | |
| M2 — Auth & RBAC | DONE | |
| M3 — Каталог / модерація | DONE | |
| M4 — AHP / WSM engine | DONE | |
| M5 — Персоналізований підбір | DONE | |
| M6 — Відгуки / заявки / admin | DONE | |
| M7 — QA, docs, thesis demo | **DONE** | E2E, benchmark, OpenAPI, `docs/thesis/` |

## M7 — перевірки (2026-10-17)

| Перевірка | Результат |
|---|---|
| `npm run typecheck` | OK |
| `npm test` | OK — 70 тестів (Vitest) |
| `npm run build` | OK |
| `npm run e2e` | OK — Playwright (workflows + security + visual) |
| `npm run openapi:lint` | OK (`redocly.yaml`) |
| `npm run db:validate` | OK |
| `prisma migrate status` | OK (схема актуальна) |
| `npm run bench:recommendation` | OK → `docs/thesis/benchmark-results.*` |

## Документація M7

- `README.md` — запуск з нуля
- `docs/api/openapi.yaml` — повна специфікація API
- `docs/thesis/*` — архітектура, AHP, експерименти, тести, demo guide
- `docs/M7-CHECKLIST.md`

## Відомі обмеження

- Локальна БД може містити ~95 тестових користувачів (`docs/thesis/TEST-DATA-AUDIT.md`); авто-видалення не виконувалось.
- `npm audit`: transitive `deepmerge-ts` / `vitest` — без `--force` оновлень у межах MVP.
