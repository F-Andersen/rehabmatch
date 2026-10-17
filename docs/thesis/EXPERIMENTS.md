# Експерименти RehabMatch

## 1. Три демонстраційні сценарії (seed PostgreSQL)

Фікстура `fixtures/demo-scenarios.json` — **DEMO-PRICE**, **DEMO-EXPERIENCE**, **DEMO-EQUAL**.  
Інтеграційний тест `demo-scenarios.integration.test.ts` будує SearchRequest + AHP + Top-5 з реальної БД (48+ демо-спеціалістів).

## 2. Фіксована когорта (10 кандидатів, in-memory)

Тест `sensitivity-fixed-cohort.test.ts` використовує **один і той самий** набір `fixedCohortSpecialists()` та `FIXED_FILTERS` для трьох наборів AHP-порівнянь з demo-scenarios.

| Сценарій | Очікуваний лідер (cohort id) | Пояснення |
|----------|------------------------------|-----------|
| DEMO-PRICE | `cohort-e` (price 700) | Вага PRICE домінує |
| DEMO-EXPERIENCE | `cohort-d` (20 років досвіду) | Вага EXPERIENCE домінує |
| DEMO-EQUAL | змішаний порядок | Ранжування відрізняється від PRICE-сценарію |

Порівнюються **ті самі** 10 id; зміна позицій обумовлена вагами, а не іншим пулом спеціалістів.

## 3. Benchmark продуктивності (синтетика)

Команда: `npm run bench:recommendation`  
Результати: `benchmark-results.md`, `benchmark-results.csv`.

Останній запуск (Node v24.14.1, warmup 10, repeats 50):

| N | Total median (ms) | Total p95 (ms) |
|---:|---:|---:|
| 50 | 0.099 | 0.235 |
| 100 | 0.150 | 0.384 |
| 250 | 0.553 | 1.050 |
| 500 | 0.692 | 1.379 |

Вимірюється лише алгоритмічний пайплайн (filter + score + sort), без HTTP і без Prisma.
