# npm audit (2026-10-17)

Команда: `npm audit` у корені monorepo. **`npm audit fix --force` не застосовувався.**

## Зведення

**6** advisories: 1 moderate, 3 high, 2 critical (за npm).

| Пакет | Severity | Уразлива версія | Ланцюг | prod / dev | Безпечний fix (audit) | Runtime prod? |
|-------|----------|-----------------|--------|------------|----------------------|---------------|
| tinypool | critical | ≤2.1.1 | vitest | dev | vitest@5.0.5 (major) | Ні |
| vitest | high (transitive) | 0.0.95–4.1.10 | — | dev | vitest@5.0.5 (major) | Ні |
| @vitest/mocker | moderate | 2.1.0–4.1.10 | vitest | dev | vitest@5.0.5 (major) | Ні |
| deepmerge-ts | high | <8.0.0 | @prisma/config → prisma CLI | dev | prisma@7.10.1 (major) | Ні (CLI) |
| @prisma/config | high | transitive | prisma | dev | prisma 7 | Ні |
| prisma | high | transitive | — | dev (CLI) | prisma 7 | Ні (`@prisma/client` окремо) |

## Patch / minor

На момент перевірки audit пропонує лише **major**-оновлення (Vitest 5, Prisma 7). Безпечних patch/minor без breaking changes **немає**.

## Залишковий ризик

- **CI / розробка:** Vitest/tinypool — запускати тести лише на довірених репозиторіях; не запускати недовірені тести з RCE gadget.
- **Prisma CLI:** оновлення до v7 — окремий релізний цикл з `migrate deploy` і повним regression.
- **Production deploy:** runtime залежності (express, react, bcryptjs) у цьому audit **не в critical chain**; ризики зосереджені в devDependencies.

## Рекомендація перед production

Планувати оновлення Vitest 5 + Prisma 7 після MVP freeze, з повним `npm test` + `npm run e2e` на ізольованій E2E БД.
