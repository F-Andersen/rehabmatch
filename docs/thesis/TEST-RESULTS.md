# Результати тестування M7

Фінальний прогін M7 (2026-10-17): **70** Vitest + **35** Playwright (у т.ч. visual на 3 viewport).

## Автоматизовані тести (server, Vitest)

- Unit: AHP, normalization, scoring, appointment state machine.
- Integration: auth, catalog, AHP API, recommendations, M6 reviews/requests, demo scenarios.
- Benchmark/sensitivity: `sensitivity-fixed-cohort.test.ts`.

## E2E (Playwright)

- `auth.spec.ts`, `catalog.spec.ts`, `matching.spec.ts`, `reviews-requests.spec.ts`
- `full-workflows.spec.ts` — admin approve, WSM, consultation, review moderation
- `security-workflows.spec.ts` — RBAC UI, logout/session
- `visual-qa.spec.ts` — скріншоти 375/768/1440 у `screenshots/`

## Security

- Integration: AUTH-08 logout, AUTH-09 expired session, RBAC на admin routes.
- Ручна перевірка: secure cookie у production (`env.isProduction`), rate limit на `/auth/*`, CSRF Origin на mutating requests.

## Обмеження

- E2E залежать від локальних серверів 5173/3001 та `.env` з `SEED_ADMIN_*`.
- ~95 тестових користувачів у локальній БД (див. `TEST-DATA-AUDIT.md`); seed-дані не видалялись.
