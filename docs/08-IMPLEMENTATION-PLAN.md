# 08. План роботи Cursor — поетапно, з перевіркою кожної ітерації

Не просити агента «зробити все одним повідомленням». Після кожного milestone виконується check, статус оновлюється у `docs/IMPLEMENTATION-STATUS.md`, користувачу надходить короткий звіт. Нічого не позначати DONE без перевіреного коду/тестів. За можливості коміт по завершенні кожної фази.

## M0 — Аудит матеріалів і рішення

- [ ] Прочитати всі файли зі списку в `prompts/01-START-CURSOR.md`.
- [ ] Оглянути всі 7 дизайнерських PNG та sitemap.
- [ ] Перевірити конфлікти, логіку AHP+WSM, privacy; записати блокери у status.
- [ ] Сформувати короткий план API/DB/файлів за цим пакетом. Не розширювати scope.

**Done:** status file створений, реальний план відповідає даним.

## M1 — Bootstrap + PostgreSQL/Prisma/seed

- [ ] Створити npm workspaces або інший акуратний monorepo з `client/` та `server/`.
- [ ] Vite+React+TypeScript, Express+TypeScript, Zod, PostgreSQL Docker Compose, Prisma (compatible version).
- [ ] Перенести/адаптувати `schemas/schema.prisma` із реальним `prisma validate`.
- [ ] Міграції, repeatable seed із `fixtures/specialists.csv`, demo markers, default dictionaries, тестові ролі.
- [ ] `.env.example`, `.gitignore`, README з локальними командами.
- [ ] `/api/v1/health` → `{status:"ok"}`; базовий shell UI.

**Done:** `docker compose up -d`, install, migrate, seed, API health, typecheck/build реально успішні.

## M2 — Auth і ролі

- [ ] Register/Login/Logout/Me, session cookie, passwords, guards, patient/specialist profile shell.
- [ ] Role middleware, permission/ownership tests, admin bootstrap.
- [ ] Зробити login/register близьким до А.2, мобільний layout.

**Done:** через браузер усі ролі можуть увійти й вийти, приватні API захищені, жодної відкритої реєстрації admin.

## M3 — Профілі, модерація, каталог

- [ ] Specialist CRUD for own profile, approve/reject by admin.
- [ ] Datasets: cities/districts/injuries/specializations/formats/services.
- [ ] Public `/specialists` filters, sort, pagination, profile details; screens A.3 and A.6.
- [ ] Demo badges, empty/loading/network errors, owner checks.

**Done:** approval реально управляє видимістю, фільтри запитують БД, тести API й basic UI проходять.

## M4 — Математика AHP + WSM (спочатку unit tests)

- [ ] Pure AHP matrix construction, geometric mean weights, lambdaMax, CI, CR, edge-case validation.
- [ ] Pure WSM direct weights normalization.
- [ ] Fixed normalization config, hard filters, stable ranking, explanations.
- [ ] Unit tests incl. `fixtures/ahp-reference.json` and inconsistent matrix.
- [ ] `/ahp/calculate` endpoint.

**Done:** усі unit tests pass, видимі реальні numeric values, не hardcode outputs.

## M5 — Наскрізний персоналізований підбір

- [ ] Patient search form, persistence, criteria modes; A.4 (sliders+pairwise wizard).
- [ ] POST /recommendations: apply hard filters, compute weights, CR gate, compute score, explanations, persist items in transaction.
- [ ] Screen A.5, detail breakdown, recommendation history.
- [ ] End-to-end сценарії зі зміною пріоритетів.

**Done:** увесь `search→weights→rank→details→saved history` working end-to-end; зміна ваг впливає на ranking.

## M6 — Reviews, requests, admin completion

- [ ] Review form and moderation; aggregate from APPROVED only.
- [ ] Consultation **request** flow, 4 statuses, ownership and status transitions.
- [ ] Admin A.7 (users/specialists/reviews/criteria/dictionaries/requests).
- [ ] User dashboard, specialist dashboard, missing minor screens, responsive polish.

**Done:** усі показані основні кнопки виконують persisted action або чесно описують обмеження; немає вигаданих медичних відгуків.

## M7 — Integration/QA/academic demo

- [ ] OpenAPI docs match deployed API.
- [ ] `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, Playwright smoke.
- [ ] Test permissions as all roles, validation, CR consistency, performance for 500 synthetic records.
- [ ] Browser walkthrough 375/768/1440 px and screenshots.
- [ ] Full clean install runbook and restore instructions.
- [ ] Academic demo script: 3 scenarios + weights, screenshot/report of computed AHP metrics, comparison with WSM.

**Done:** reproducible clean local setup and documented evidence of every working core feature. Final status report includes known limitations.

## Правило делівері

Кожен milestone = (source code + commands to run + tests + documentation + visible demo). Якщо будь-який компонент відсутній — статус `IN PROGRESS` або `BLOCKED`, а не `DONE`.
