# 02. Архітектура і технічний стек

## Стек

**Source-derived**: React (JavaScript/HTML/CSS); Node.js + Express REST; PostgreSQL; UML і IDEF0.

**MVP refinements**: TypeScript end-to-end; Vite; Tailwind CSS; shadcn/ui (опційно), TanStack Query, React Hook Form + Zod; Prisma; Docker Compose; Vitest (unit), Supertest (integration), Playwright (E2E). Не ставити застарілі версії бібліотек без перевірки. До інсталяції перевірити актуальну документацію та сумісність Prisma/Node/React/Tailwind.

## Взаємодія

```
Browser React app
   |  HTTPS / HTTP on localhost + secure session cookie
   v
Express REST API  --auth/rbac--> service modules
   |                         \--recommendation engine (pure TS)
   v
Prisma repository/queries
   v
PostgreSQL (Docker)
```

Сховище стану: TanStack Query для API; локальні компоненти/форми для UI. Не вводити Redux за замовчуванням. Prisma тільки на сервері. API `/api/v1` для усіх маршрутів.

## Папки (Cursor створює в milestone 1)

```
client/src/{app,pages,components,features,services,styles}
server/src/{app,modules,middleware,algorithms,lib}
server/prisma/{schema.prisma,migrations,seed.ts}
server/tests/{unit,integration}
e2e/
docs/
design/reference/
```

`scripts/dev` чи npm workspaces — на вибір агента, але в кореневому `package.json` повинні бути послідовні команди `dev`, `build`, `typecheck`, `test`, `db:migrate`, `db:seed`, `e2e` та `lint` (якщо не можна використати команду, README пояснює чому).

## Пропоновані модулі backend

- `auth`: password hashing, session creation/revocation, role guards, CSRF/origin policy;
- `users/patients`: profile, preference access;
- `specialists`: profile, search, public projection, verification;
- `catalog`: specializations, injuries, cities, districts, appointment formats;
- `search-requests`: persist filter choices, validation;
- `recommendations`: orchestrator + deterministic scoring engine;
- `reviews`: upsert, moderation, aggregates;
- `appointment-requests`: status transitions;
- `admin`: moderation and audit of changes.

## Conventions

- `success` responses expose normal JSON resource objects; errors `{error:{code,message,details?}}`.
- Zod validation at HTTP boundary, stable error codes, semantic statuses 400/401/403/404/409/422/500.
- Do not return password hashes, session hashes or private notes in public DTOs.
- Pagination via `page` and `pageSize`, bounds 1..100; sort enum allowlist; unknown filters => 400, not silent ignore.
- Use UTC in DB (`DateTime`) and render times in user's Ukraine local timezone (Europe/Kyiv) where applicable; display timezone explicitly for consultation request.
- Seed must be repeatable, and test database separate from dev database.
- Store monetary amounts via Prisma Decimal, cast to number **only** for validated scoring. Accept finite float values for AHP calculation within defined bounds.

## Local ports (defaults, configurable via env)

- Client: `http://localhost:5173`
- Server: `http://localhost:3001`
- Database: `localhost:5432` exposed only in local dev; in Docker network use service name.
- CORS limited to configured local client origin; credentials permitted explicitly (never wildcard).

## Dependency graph for milestones

DB/auth → Specialist profile and moderation → Catalog → Search Request → AHP/WSM → Recommendations → Reviews and requests → Admin finish → E2E/QA. UI can be scaffolded early but must connect to real backend before milestone is marked done.
