# M7 Checklist (фактичний стан на 2026-10-17)

| # | Завдання | Статус |
|---|----------|--------|
| 1 | Функціональний аудит SC-01…SC-10 / workflows | Виконано (код + інтеграційні/E2E) |
| 2 | Розширення Playwright E2E | `e2e/full-workflows.spec.ts`, `security-workflows.spec.ts` |
| 3 | Аудит AHP/WSM (unit + fixed cohort) | `algorithms/*.test.ts`, `sensitivity-fixed-cohort.test.ts` |
| 4 | Benchmark 50/100/250/500 | `npm run bench:recommendation` → `docs/thesis/benchmark-results.*` |
| 5 | Security audit | Перевірено cookie/RBAC/Zod/CSRF; `npm audit` у звіті |
| 6 | Responsive visual QA | `npm run e2e:visual` → `docs/thesis/screenshots/` |
| 7 | OpenAPI 3.x повна специфікація | `docs/api/openapi.yaml` + `npm run openapi:lint` |
| 8 | README / запуск з нуля | Оновлено `README.md` |
| 9 | Матеріали `docs/thesis/` | ARCHITECTURE, AHP-METHODOLOGY, EXPERIMENTS, TEST-RESULTS, DEMO-GUIDE |
| 10 | Аудит тестових даних БД | `npm run audit:test-data -w server` (без авто-видалення) |
| 11 | Фінальні команди typecheck/test/build/e2e | Запускаються після змін |
| 12 | Git commits F-Andersen | Після блоків |
