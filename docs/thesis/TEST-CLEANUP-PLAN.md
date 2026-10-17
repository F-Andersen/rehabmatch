# План очищення тестових даних (без виконання)

**Статус:** лише план. Видалення **не виконувалось** без підтвердження власника.

## 1. Поточний стан (2026-10-17)

- Команда: `npm run audit:test-data -w server`
- Знайдено **151** користувач(ів) з тестовими email-патернами (`e2e-*`, `m6-*`, `@example.test`, `m2auth-*`, `m3cat-*`, `m5rec-*` тощо).
- Seed-демо спеціалісти (без цих префіксів) **не входять** у вибірку скрипта.

## 2. Залежності (ризики)

| Сутність | Ризик при видаленні user/patient/specialist |
|----------|-----------------------------------------------|
| `Session` | Безпечно (каскад з user) |
| `SearchRequest` / `Recommendation` / `RecommendationItem` | Може змінити **локальну** історію підборів тестових пацієнтів; **не** чіпає seed demo recommendations інших користувачів |
| `Review` / `AppointmentRequest` | Лише для тестових patient/specialist id |
| `RecommendationItem` на тестового specialist | Якщо тестовий спеціаліст потрапив у Top-5 — item для **іншого** searchRequest; видалення specialist потребує спочатку `recommendationItem` для цього specialistId |
| Seed `User` / demo specialists | Не видаляти (email не match audit patterns) |

**Висновок:** очищення **можливе**, якщо обмежитися користувачами з audit-патернів і видаляти у порядку FK (як у `m6.integration.test.ts` cleanup).

## 3. Резервне копіювання (перед очищенням)

```bash
# Приклад (локально, замініть пароль/шлях)
pg_dump -h localhost -U rehabmatch -d rehabmatch -F c -f rehabmatch-pre-cleanup.dump
```

Або Neon/хмара: snapshot гілки БД.

## 4. Пропонований порядок SQL/Prisma (псевдокроки)

1. `SELECT id, email FROM users WHERE email ILIKE '%@example.test%' OR email ILIKE '%e2e-%' OR ...` — зберегти список у CSV.
2. Для `patientIds` / `specialistIds` цих users:
   - `appointmentRequest`, `review` (обидва напрямки)
   - `recommendationItem` WHERE specialistId IN (...)
   - `recommendation` / `searchRequest` / priorities / comparisons для patientIds
   - `session`, `patient`, `specialist`, `user`
3. Перевірка: `npm test`, `npm run e2e`, demo-scenarios на seed.

## 5. Ізоляція на майбутнє

- `.env.test` → `DATABASE_URL=postgresql://.../rehabmatch_test`
- Playwright + Vitest integration лише на test DB
- Єдиний префікс `e2e-run-<id>-` + `afterAll` cleanup (як M6)

## 6. Підтвердження

Перед виконанням потрібна явна згода: «очистити тестові записи за audit-патернами» + наявність dump.
