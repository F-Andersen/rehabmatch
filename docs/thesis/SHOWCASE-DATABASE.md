# Showcase database (`rehabmatch_showcase`)

Презентаційна PostgreSQL БД для захисту магістерської роботи. **Не замінює** demo `rehabmatch` та E2E `rehabmatch_e2e`.

## Запуск

```bash
cp .env.showcase.example .env.showcase
# DATABASE_URL, SHOWCASE_DATABASE_URL, паролі, SEED_ADMIN_*, SHOWCASE_SEED_PASSWORD

npm run showcase:portraits   # 48 WebP у client/public/images/specialists/
npm run showcase:prepare     # CREATE DATABASE + migrate deploy
npm run showcase:seed        # ідемпотентне наповнення
npm run showcase:verify      # лічильники, фото, заборона demo-імен
npm run dev:showcase         # API :3021, client :5184
```

## Обсяг даних (орієнтовно після seed)

| Сутність | Кількість |
|----------|-----------|
| Спеціалісти | 48 (40 APPROVED, 8 PENDING) |
| Пацієнти | 25 |
| Послуги | ~192 (2–5 на спеціаліста) |
| Відгуки | 120+ |
| Заявки на консультацію | 28+ (повторні seed до додавання guard могли дати більше; повторний запуск не додає нові) |
| Збережені рекомендації | 8–15 (AHP + WSM) |
| Портрети | 48 локальних `/images/specialists/sc-*.webp` |

## Демо-акаунти

- **Admin:** `SEED_ADMIN_EMAIL` з `.env.showcase` (пароль локально, не в Git).
- **Пацієнт (приклад):** `showcase.patient-01@example.test` — пароль = `SHOWCASE_SEED_PASSWORD`.
- **Спеціаліст (приклад):** `specialist.sc-001@example.test` — той самий пароль seed.

## Синтетичність і обмеження

- Усі ПІБ, відгуки та описи вигадані; це **не** ліцензовані лікарі та не медичні рекомендації.
- Фотографії — **синтетичні ілюстративні портрети** (див. `fixtures/showcase/IMAGE-ATTRIBUTION.md`), не фото реальних осіб.
- Дисклеймер MVP залишається у футері застосунку.

## Сценарії рекомендацій

`fixtures/showcase/recommendation-scenarios.json` — цінa, досвід, рейтинг, рівні ваги, WSM (формат/локація). Обчислення через `createRecommendation` (реальний алгоритм, CR ≤ 0.10 для AHP).

## E2E smoke (опційно)

```bash
npm run dev:showcase   # окремий термінал
npm run e2e:showcase   # smoke + acceptance screenshots (read-only, порти 5184/3021)
npm run showcase:verify-catalog
```

Звичайний `npm run e2e` лишається на `rehabmatch_e2e`.
