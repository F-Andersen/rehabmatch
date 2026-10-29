# RehabMatch MVP

**RehabMatch** — демонстраційна веб-система інтелектуального підбору спеціалістів з реабілітації на основі **гібриду AHP + WSM** (парні порівняння або прямі ваги). Це **не** медична інформаційна система та **не** підтверджений запис до лікаря.

**Стек:** React (Vite) + TypeScript · Express + TypeScript · PostgreSQL · Prisma.

Демонстраційний сайт: [RehabMatch](http://188.137.232.136:8083). Дані профілів вигадані. [Повідомлення про помилки та пропозиції](https://github.com/F-Andersen/rehabmatch/issues) публічні; не додавайте туди паролі, медичні документи й персональні дані.

Контракт API: `docs/api/openapi.yaml`. Дипломні матеріали, плани та звіти перевірок зберігаються локально й не входять у поточний checkout.

## Вимоги

- Node.js **20+**, npm **10+**
- Docker Desktop (PostgreSQL)
- Windows: PowerShell; для ланцюжків команд використовуйте `;` замість `&&`

## Встановлення (чистий checkout)

```bash
npm install
cp .env.example .env
```

У `.env` задайте (не комітьте файл):

- `POSTGRES_PASSWORD`, `DATABASE_URL`
- `SESSION_SECRET` (довгий випадковий рядок)
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (локальний admin для seed)

```bash
npm run db:up
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

| Сервіс | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3001 |
| Health | http://localhost:3001/api/v1/health |
| DB health | http://localhost:3001/api/v1/health/database |

## Команди

| Команда | Опис |
|---------|------|
| `npm run dev` | Client + server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript |
| `npm run test:build` | Production-збірка й перевірки завантаження маршрутів, відмови мережі та відновлення |
| `npm test` | Vitest (server) |
| `npm run e2e` | Playwright (ізольована БД `rehabmatch_e2e`, піднімає API+client) |
| `npm run e2e:prepare` | Міграції + seed на E2E БД (див. `.env.e2e.example`) |
| `npm run e2e:visual` | Smoke-скріншоти → `e2e/artifacts/visual-qa/` |
| `npm run bench:recommendation` | Benchmark алгоритму (синтетика) |
| `npm run openapi:lint` | Валідація OpenAPI |
| `npm run db:validate` | `prisma validate` |
| `npm run audit:test-data -w server` | Звіт тестових користувачів у БД |

## Demo accounts

- **Admin** створюється seed (`SEED_ADMIN_EMAIL` у `.env`). Пароль **не** зберігайте в репозиторії та не вставляйте в README.
- **PATIENT / SPECIALIST** — реєстрація через UI (`/register`).
- Демо-спеціалісти з seed — вигадані профілі з позначкою demo.
- У showcase всі 48 портретів `sc-001`–`sc-048` — фотореалістичні AI-зображення вигаданих дорослих людей (512×512 WebP). Походження, промпти, імена та контрольні суми — у `fixtures/showcase/portrait-manifest.json`. Це синтетичні профілі, не реальний каталог лікарів.
- `npm run showcase:portraits` створює лише відсутні заглушки й зберігає наявні портрети.

## Презентаційний набір із 48 профілями

```bash
cp .env.showcase.example .env.showcase
```

Налаштуйте `SHOWCASE_DATABASE_URL` і `DATABASE_URL` на базу **`rehabmatch_showcase`**; також задайте `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` і `SHOWCASE_SEED_PASSWORD`. Паролі мають залишатись у локальних env-файлах.

```bash
npm run db:up
npm run showcase:prepare
npm run showcase:seed
npm run showcase:verify
npm run dev:showcase
```

Frontend: `http://localhost:5184`, API: `http://localhost:3021`. Портрети вже включені в репозиторій; повторно генерувати їх не потрібно. Seed зв'язує їх зі стабільними профілями `sc-001`–`sc-048`.

Вхід пацієнта: `showcase.patient-01@example.test`; спеціаліста: `specialist.sc-001@example.test`. Showcase-seed спочатку задає всім демокористувачам, включно з адміністратором, `SHOWCASE_SEED_PASSWORD` (або `SEED_ADMIN_PASSWORD`, якщо перший не заданий). На сервері команда `deploy/bootstrap-admin.mjs` нижче встановлює адміністратору окремий `SEED_ADMIN_PASSWORD`.

## Контакти та підтримка

Сторінка `/contacts` містить посилання на GitHub Issues, підказки для опису проблеми, FAQ та опубліковані власником контакти. Якщо email і телефон не задані, залишається робоче посилання на GitHub. Для створення звернення потрібен обліковий запис GitHub. Вбудованої форми надсилання повідомлень немає.

За потреби заповніть `VITE_CONTACT_EMAIL`, `VITE_CONTACT_PHONE`, `VITE_CONTACT_OFFICE` у локальному `.env`, а для Docker — у `.env.deploy`. Email відкривається через `mailto:`, телефон — через `tel:`. Ці значення публічні й вбудовуються під час збірки: після зміни перезапустіть Vite або перебудуйте web-контейнер. Секрети у `VITE_*` заборонені.

## Тестування

1. `npm test` — Vitest (локальна demo БД з `.env`).
2. E2E: `cp .env.e2e.example .env.e2e`, налаштуйте `E2E_DATABASE_URL` → **`rehabmatch_e2e`** (не `rehabmatch`).
3. `npm run e2e` — global setup створить БД (за потреби), migrate, seed; API з `REHABMATCH_E2E=1` (auth quota для тестів; production ліміт не змінюється).
4. Демо вручну: `npm run dev` + БД **`rehabmatch`** — E2E її не очищає.
5. E2E використовує порти `5174`/`3011` за прикладом env. Не направляйте тестові мутації на презентаційну БД; `npm run e2e:showcase` призначена для перегляду й smoke-перевірок showcase.

## Завантаження сторінок і production-збірка

Головна сторінка та спільна навігація завантажуються одразу. Код форм, каталогу, інформаційних сторінок і кабінетів пацієнта, спеціаліста та адміністратора завантажується при переході до відповідного розділу. Під час завантаження залишається навігація; якщо модуль недоступний, сторінка показує помилку з кнопкою оновлення.

`npm run build` явно встановлює production-режим для Vite незалежно від `NODE_ENV=development` у локальному `.env`. Початковий JS після поділу маршрутів становить приблизно 343 КБ (106 КБ gzip), порівняно з 561 КБ (159 КБ gzip) у попередній production-збірці. Це розмір початкового модуля, а не всього застосунку чи час завантаження. Залежності форм і сторінки завантажуються окремо.

У Docker-профілі Nginx стискає JS/CSS/JSON, кешує ресурси з хешованими назвами та перевіряє актуальність HTML. `npm run test:build` перевіряє саме зібраний frontend через Vite preview з тестовими відповідями API; `npm run e2e` окремо перевіряє реальні API/БД.

## Типові проблеми (Windows)

- **Prisma EPERM on generate** — зупиніть `npm run dev`, повторіть `npm run db:generate`.
- **E2E 404 на API** — звірте порти з `.env.e2e` (за замовчуванням API `3011`, client `5174`).
- **Docker** — перевірте `docker ps`, порт 5432 вільний.

## Окремий демонстраційний сервер за IP

`compose.deploy.yml` запускає окремі web/API/PostgreSQL та постійні volumes для БД і завантажених фото. PostgreSQL та API не публікують портів на хості. Створіть приватний `.env.deploy` з `POSTGRES_PASSWORD` (hex), `SESSION_SECRET`, `CLIENT_ORIGIN=http://IP:8083`, `PUBLIC_PORT=8083`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SHOWCASE_SEED_PASSWORD`.

```bash
docker compose --env-file .env.deploy -f compose.deploy.yml build
docker compose --env-file .env.deploy -f compose.deploy.yml up -d db
docker compose --env-file .env.deploy -f compose.deploy.yml run --rm api npm run db:migrate:deploy -w server
docker compose --env-file .env.deploy -f compose.deploy.yml run --rm api npm run showcase:seed -w server
docker compose --env-file .env.deploy -f compose.deploy.yml up -d
docker compose --env-file .env.deploy -f compose.deploy.yml exec -T api node --input-type=module < deploy/bootstrap-admin.mjs
```

Seed виконуйте лише для початкового наповнення окремої демонстраційної БД. Цей профіль призначений для HTTP-демонстрації з вигаданими даними: Nginx прибирає `Secure` з cookie сесії, щоб вхід працював за IP без TLS. Для HTTPS приберіть `proxy_cookie_flags ... nosecure` та оновіть `CLIENT_ORIGIN`. Секрети й резервні копії не входять у Git.

## Оновлення на сервері без повторного seed

Після доставки оновленого коду в каталог застосунку виконайте з цього каталогу:

```bash
docker compose --env-file .env.deploy -f compose.deploy.yml build web
docker compose --env-file .env.deploy -f compose.deploy.yml up -d --no-deps web
```

Це команда для змін frontend і контактів. Для змін API окремо перебудуйте й оновіть `api`; міграції застосовуйте перед запуском нової версії API, якщо вони додані. Зберігайте приватний `.env.deploy`, volumes і резервні копії. Повторний showcase-seed може перезаписати демопрофілі й паролі; для звичайного оновлення він не потрібен. Не використовуйте `down -v`, якщо потрібно зберегти БД і фото.

## Обмеження MVP

Немає OAuth, платежів, eHealth, LLM, повноцінного календаря, email/SMS. Заявка на консультацію — лише статусний workflow. Рекомендації не перераховуються задним числом при зміні рейтингу.

## Що зберігається в Git

Код, тести, конфігурація, lock-файли, ресурси інтерфейсу, Prisma schema/міграції, seed-фікстури, цей README та контракт OpenAPI. Живі БД, дампи, секрети, uploads, дипломні документи, локальні пояснення й скриншоти звітів ігноруються. Міграції та seed потрібні для відтворюваного запуску й залишаються в репозиторії.
