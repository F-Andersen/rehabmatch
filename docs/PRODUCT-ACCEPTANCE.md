# Product Acceptance — RehabMatch

Статус документа: **PARTIAL** (очікує browser QA Phase 6).

| Область | Критерій DONE | Статус | Доказ |
|---------|---------------|--------|-------|
| Auth RBAC | E2E security + login | COMPLETE | `npm run e2e` |
| Patient cabinet | Усі розділи з меню | PARTIAL | `/profile`, `/my-reviews` додано 2026-10-22 |
| Specialist portal | Профіль + заявки + фото | PARTIAL | photo upload новий |
| Admin | CRUD + модерація | COMPLETE | E2E admin sections |
| Catalog | API + UI фільтри | COMPLETE | showcase:verify-catalog |
| AHP/WSM | Integration tests | COMPLETE | vitest + e2e matching |
| Showcase DB | verify без reset | COMPLETE | showcase:verify |
| Public content + stock | ASSET-SOURCES + hero | PARTIAL | 4 images |
| final-product screenshots | Phase 6 | MISSING | — |

**DONE заборонено** до заповнення колонки «Доказ» для всіх рядків P0.
