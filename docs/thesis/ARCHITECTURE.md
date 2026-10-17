# RehabMatch — фактична архітектура MVP

## Огляд

RehabMatch — монорепозиторій з розділенням **client** (React + Vite + TypeScript) та **server** (Express + TypeScript + Prisma). Дані зберігаються в **PostgreSQL**. Авторизація — **HTTP-only session cookie** (`rehabmatch_session`), сервер зберігає хеш токена в таблиці `Session`.

## Шари backend

| Шар | Відповідальність |
|-----|------------------|
| `routes/v1/*` | HTTP, RBAC (`requireAuth`, `requireRole`), парсинг Zod |
| `modules/*` | Бізнес-логіка (auth, catalog, search, recommendations, reviews, appointments, admin) |
| `algorithms/*` | Чисті функції AHP, WSM, нормалізація, scoring, ranking (без Prisma) |
| `middleware` | CSRF/Origin, rate limit (auth), error handler |
| `prisma` | Доступ до БД, міграції, seed |

## Шари frontend

| Шар | Відповідальність |
|-----|------------------|
| `pages/*` | Екрани A.1–A.7 (маршрути в `App.tsx`) |
| `features/*` | API-клієнти, auth provider, domain hooks |
| `components/*` | Layout, ProtectedRoute, UI-примітиви |

## Потік підбору

1. PATIENT створює `SearchRequest` (фільтри + режим AHP або DIRECT_WSM).
2. UI збирає 10 pairwise порівнянь або прямі пріоритети 1–9.
3. `POST /recommendations` обчислює ваги, фільтрує кандидатів, нормалізує, рахує WSM score, зберігає `Recommendation` + `RecommendationItem`.
4. Історія доступна через `GET /recommendations`.

## Взаємодія з M6

Відгуки та заявки на консультацію — окремі модулі з власними state machine та admin-модерацією; не змінюють збережені історичні рекомендації.
