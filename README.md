# RehabMatch — пакет передачі MVP у Cursor

**Проєкт:** «Інформаційна технологія інтелектуального підбору спеціалістів з реабілітації на основі аналізу потреб пацієнта».  
**Дата формування пакета:** 2026-10-17.  
**Статус:** розробка MVP у процесі (M1A bootstrap). Детальний прогрес — `docs/IMPLEMENTATION-STATUS.md`.

## Локальний запуск (розробка)

**Вимоги:** Node.js 20+, npm 10+, Docker Desktop (PostgreSQL).

1. Скопіюйте `.env.example` → `.env`, задайте `POSTGRES_PASSWORD`, `DATABASE_URL`, `SEED_ADMIN_PASSWORD` (не комітьте `.env`).
2. У корені проєкту:
   ```bash
   npm install
   npm run db:up
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```
3. Перевірки:
   ```bash
   npm run db:validate
   npm run typecheck
   npm run build
   npm test
   curl http://localhost:3001/api/v1/health
   curl http://localhost:3001/api/v1/health/database
   ```
4. Відкрийте [http://localhost:5173](http://localhost:5173) — на головній сторінці відображається результат `GET /api/v1/health` через Vite proxy.

| Сервіс | URL за замовчуванням |
|---|---|
| Frontend (Vite) | http://localhost:5173 |
| API (Express) | http://localhost:3001 |
| PostgreSQL (Docker) | localhost:5432 |

```bash
npm run db:up        # PostgreSQL (Docker Compose)
npm run db:down      # зупинити контейнер
npm run db:validate  # prisma validate
npm run db:generate  # prisma generate
npm run db:migrate   # prisma migrate dev
npm run db:seed      # демо-дані (ідемпотентно)
npm run db:studio    # Prisma Studio
```

## Почати за 5 хвилин (пакет специфікації)

1. Розпакуйте **вміст цієї папки** в нову папку проєкту `rehabmatch` і відкрийте **всю папку** в Cursor (`File → Open Folder`). Не відкривайте лише один файл.
2. Переконайтеся, що в корені є `AGENTS.md`, `.cursor/rules/`, `docs/`, `design/reference/`, `prompts/` та `schemas/`.
3. Відкрийте Cursor Agent у **Plan mode** (якщо доступний) та вставте текст із `prompts/01-START-CURSOR.md`.
4. Попросіть виконувати `docs/08-IMPLEMENTATION-PLAN.md` по етапах; перевіряйте демо та тести наприкінці кожного етапу.
5. Для запуску після генерації коду Cursor зобов'язаний створити фактичні команди в README проєкту, `docker-compose.yml`, `.env.example`, seed, міграції, тести та перевірити їх локально.

## Склад пакета

| Шлях | Що містить |
|---|---|
| `prompts/01-START-CURSOR.md` | Головний промпт для першого запуску агента |
| `prompts/02-CONTINUE-CURSOR.md` | Промпт для продовження наступного етапу |
| `AGENTS.md` і `.cursor/rules/*.mdc` | Постійні правила реалізації у Cursor |
| `docs/01-PRODUCT-REQUIREMENTS.md` | ТЗ, MVP scope, ролі, бізнес-правила, критерії готовності |
| `docs/02-ARCHITECTURE.md` | Стек, структура репозиторію, потоки даних |
| `docs/03-DATABASE.md` | Сутності, зміни відносно документа, правила даних |
| `schemas/schema.prisma` | Стартовий цільовий Prisma-дизайн для погодження/реалізації |
| `docs/04-AHP-ALGORITHM.md` | Формули, числові правила, еталонні тести |
| `docs/05-DESIGN-SYSTEM.md` | Усі 7 екранів, шляхи, UI-токени, адаптивність |
| `design/reference/*.png` | Оригінальні 7 макетів, карта навігації, UML та ER |
| `docs/06-API-CONTRACT.md` | Контракт REST API, приклади JSON |
| `docs/07-SECURITY-AND-DATA.md` | Авторизація, конфіденційність, захист, обмеження медичного застосування |
| `docs/08-IMPLEMENTATION-PLAN.md` | Послідовні етапи для Cursor + Definition of Done |
| `docs/09-TEST-PLAN.md` | Перевірки бізнес-логіки, математики, API та E2E |
| `docs/10-SOURCE-MAPPING-AND-DECISIONS.md` | Що в джерелах і що додано як рішення для MVP |
| `fixtures/specialists.csv` | 48 **синтетичних**, виключно демонстраційних спеціалістів |
| `fixtures/ahp-reference.json` та `fixtures/demo-scenarios.json` | Еталон AHP і три повторювані експериментальні сценарії |
| `reference/original-docx/*.docx` | Обидва вихідні звіти без змін |

## Пріоритет документів у разі конфліктів

1. `docs/10-SOURCE-MAPPING-AND-DECISIONS.md` — затверджені розбіжності та обмеження **цього MVP**;
2. `docs/01-PRODUCT-REQUIREMENTS.md` та `docs/04-AHP-ALGORITHM.md` — поведінка продукту;
3. `docs/06-API-CONTRACT.md` та `schemas/schema.prisma` — узгоджені контракти (якщо знайдено внутрішній конфлікт, спочатку повідомити власника);
4. `design/reference/A*.png` та `docs/05-DESIGN-SYSTEM.md` — візуальне виконання;
5. оригінальні DOCX — наукове обґрунтування, первинні вимоги та термінологія.

**Промпт НЕ надає право переписувати джерела або видавати спроєктовані функції за вже реалізовані.** Зміни до магістерської роботи виконуються окремо після фактичної розробки.

## Межі використання

Навчальний MVP, не медична інформаційна система для клінічних рішень. Демо-профілі вигадані. Система лише ранжує варіанти за вподобаннями користувача, не ставить діагнозів, не призначає лікування та не заявляє про перевірку державних медичних ліцензій. Перед публічним запуском потрібні додаткові юридична, безпекова та предметна перевірки.
