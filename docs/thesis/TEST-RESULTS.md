# Результати тестування M7

Release stabilization (2026-10-17): **74** Vitest + **37** Playwright × **2** послідовні повні прогони (ізольована БД `rehabmatch_e2e`, порти 3011/5174).

## Автоматизовані тести (server, Vitest)

- Unit: AHP, normalization, scoring, appointment state machine.
- Integration: auth, catalog, AHP API, recommendations, M6 reviews/requests, demo scenarios.
- Benchmark/sensitivity: `sensitivity-fixed-cohort.test.ts`.

## E2E (Playwright)

- `auth.spec.ts`, `catalog.spec.ts`, `matching.spec.ts`, `reviews-requests.spec.ts`
- `full-workflows.spec.ts` — admin approve, WSM, consultation, review moderation
- `security-workflows.spec.ts` — RBAC UI, logout/session
- `visual-qa.spec.ts` — smoke-скріншоти → `e2e/artifacts/visual-qa/`
- `visual-app-screens.spec.ts` — дипломні кадри → `docs/thesis/screenshots/`
- Середовище: `docs/thesis/E2E-ENVIRONMENT.md`

## Security

- Integration: AUTH-08 logout, AUTH-09 expired session, RBAC на admin routes.
- Ручна перевірка: secure cookie у production (`env.isProduction`), rate limit на `/auth/*`, CSRF Origin на mutating requests.

## Обмеження

- E2E: `.env.e2e` + `rehabmatch_e2e`; demo БД `rehabmatch` не очищається.
- Vitest integration лишаються на локальній demo БД з `.env`.
