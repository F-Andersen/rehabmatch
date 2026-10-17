# Сценарій демонстрації (магістерська)

## Підготовка

1. `npm run db:up` → `npm run db:migrate` → `npm run db:seed`
2. `npm run dev` (client + server)
3. Облікові записи: admin з seed (email у `.env`, пароль не публікувати); новий PATIENT/SPECIALIST через UI.

## Послідовність (15 кроків)

1. Відкрити головну — дисклеймер MVP.
2. **PATIENT**: реєстрація → dashboard.
3. Каталог спеціалістів — фільтри, відкрити APPROVED профіль.
4. **Підбір**: `/matching/new` → параметри → AHP wizard (10 кроків) → CR ≤ 0.10 → рекомендації.
5. Пояснення factors на `/recommendations/:id`.
6. Історія `/recommendations`.
7. З профілю спеціаліста — **запит на консультацію** (не запис).
8. `/my-requests` — статус REQUESTED.
9. **SPECIALIST**: реєстрація → заповнення профілю → PENDING.
10. **ADMIN**: `/admin/specialists` → APPROVED.
11. PATIENT — відгук (PENDING) → ADMIN `/admin/reviews` → APPROVED → рейтинг на профілі.
12. SPECIALIST `/specialist/requests` — прийняти/відхилити заявку.
13. ADMIN — користувачі, заявки, довідники, критерії (лише безпечні зміни).
14. Logout → спроба `/dashboard` → login.
15. Показати `docs/api/openapi.yaml` та `docs/thesis/benchmark-results.md`.

## Альтернатива WSM

Повторити крок 4 з режимом DIRECT_WSM на етапі критеріїв (або API `POST /recommendations` з `priorities` 1–9).
