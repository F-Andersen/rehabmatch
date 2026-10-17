# 03. Модель даних і правила БД

## З оригінальних матеріалів

Розділ 3.3 містить ER-діаграму з 16 сутностей: `users`, `patients`, `specialists`, `specializations`, `cities`, `districts`, `injury_types`, `appointment_formats`, `specialist_injury_types`, `specialist_appointment_formats`, `search_requests`, `criteria`, `criterion_priorities`, `recommendations`, `recommendation_items`, `reviews` (див. `design/reference/ER-original.png`).

## Важливі проектні зміни для MVP

1. `SpecialistSpecialization` (many-to-many) замість одного `specialists.specialization_id`, бо каталог/макети допускають кілька спеціалізацій.
2. `CriterionComparison` для зберігання AHP матриці попарних порівнянь — наявний у документах `criterion_priorities` зберігає лише ваги.
3. `Service` для цін на окремі послуги. На профілі в макеті є картки «Послуги та вартість».
4. `AppointmentRequest` для легкої заявки на консультацію (не календарне бронювання).
5. `Session` для серверних сесій та можливості примусового logout.
6. `Rating` спеціаліста не має бути безконтрольним полем, що редагується ним; обчислювати зі схвалених відгуків (за відсутності — null у публічному DTO).
7. `verifiedStatus` enum замість простого Boolean: PENDING, APPROVED, REJECTED; для демо вручну підтверджує admin.
8. Історія результатів: `Recommendation` має `algorithmVersion`, `mode`; `RecommendationItem` має JSON `scoreBreakdown`/`explanation`.
9. `radiusKm` можна тримати nullable лише для майбутньої реалізації координат; **не показувати фільтр радіуса як працюючий** поки немає геоданих.
10. Пацієнтам не обов'язково зберігати діагноз — у `SearchRequest` зберігається тільки вибраний довідниковий injuryType, без вільного опису медичного стану.

## Цільовий schema template

Див. `schemas/schema.prisma` як стартовий узгоджуваний шаблон. Cursor має скопіювати й при потребі обґрунтовано адаптувати до `server/prisma/schema.prisma`, підтвердити валідність через `prisma validate`, `prisma migrate dev`, `prisma generate`, `db:seed`. Якщо актуальна версія Prisma вимагає іншу конфігурацію datasource URL (наприклад окремий `prisma.config.ts`), агент адаптує **синтаксис**, не змінюючи семантики.

## Обов'язкові обмеження цілісності

- Email уникальний case-insensitive (CITEXT або нормалізація до lower-case на запис + unique).
- User↔Patient і User↔Specialist 1:0..1, зв'язки FK у БД; доступні ролі не можна змінити з браузера.
- Specialist не може редагувати чужий профіль.
- Review має unique(patientId,specialistId). Публічно тільки APPROVED.
- AHP comparisons мають unique(searchRequestId, criterionAId, criterionBId). Зберігати **лише одну напрямлену половину матриці**; обернені значення будувати програмно. Валідовувати !=1? Для діагоналі немає записів.
- Пріоритети зберігати окремо для кожного `SearchRequest`, разом з `mode`, `consistencyRatio` та обчисленими `weight`.
- RecommendationItem має unique(recommendationId,specialistId) та unique(recommendationId,rankPosition).
- Decimal price >= 0. Будь-які критичні business bounds перевіряти Zod та БД, де можливо.
- Hard-delete пов'язаних з історією даних краще замінити на disabled status; заборонити неконтрольовані каскадні видалення рекомендацій.

## Seed data

`fixtures/specialists.csv` — **суто синтетичні дані**. Додатково seed: 6 міст; райони (2–3 на місто); 5 спеціалізацій (фізична терапія, ерготерапія, реабілітаційна медицина, логопедія, спортивна реабілітація), типи травм/запитів і три формати (очно, онлайн, змішаний); 5 критеріїв; кілька тестових пацієнтів та specialist accounts.

**Не видавати demo-профілі за реальних лікарів!** Demo badge і footer disclaimer — обов'язкові.
