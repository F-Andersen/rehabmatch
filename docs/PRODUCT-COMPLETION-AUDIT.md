# Product Completion Audit — RehabMatch

Дата аудиту: **2026-10-22**. Оцінка власника до робіт: **~40%** фактичної готовності UI/контенту при формальному M7 DONE.

Джерела: `docs/01-PRODUCT-REQUIREMENTS.md`, `docs/05-DESIGN-SYSTEM.md`, `docs/06-API-CONTRACT.md`, `docs/IMPLEMENTATION-STATUS.md`, код `client/` + `server/`, браузерна перевірка showcase (5184/3021).

Стани: **COMPLETE** | **PARTIAL** | **BROKEN** | **MISSING**

---

## 1. Авторизація та користувачі

| Функція | Маршрут / API | Backend | Frontend | DB | Browser | Пріоритет |
|---------|---------------|---------|----------|-----|---------|-----------|
| Реєстрація пацієнта | `/register`, `POST /auth/register` | COMPLETE | COMPLETE | COMPLETE | COMPLETE | — |
| Реєстрація спеціаліста | `/register` SPECIALIST | COMPLETE | COMPLETE | COMPLETE | COMPLETE | — |
| Login / logout | `/login`, cookies | COMPLETE | COMPLETE | COMPLETE | COMPLETE | — |
| Сесія після reload | `GET /auth/me` | COMPLETE | COMPLETE | COMPLETE | COMPLETE | — |
| Ролі / захист маршрутів | `ProtectedRoute` + server RBAC | COMPLETE | COMPLETE | — | COMPLETE | — |
| Редагування профілю пацієнта | `PATCH /me` | COMPLETE | **PARTIAL→COMPLETE** (`/profile`) | COMPLETE | потрібна reverif | P0 |
| Телефон у профілі | `PATCH /me` phone | COMPLETE | **PARTIAL→COMPLETE** | COMPLETE | reverif | P1 |
| Відновлення пароля | — | MISSING | MISSING | — | — | out of MVP |
| OAuth Google/FB | — | MISSING | відсутнє (OK) | — | — | — |

---

## 2. Кабінет пацієнта

| Функція | Маршрут | Backend | Frontend | Browser | Проблеми / зміни |
|---------|---------|---------|----------|---------|------------------|
| Dashboard | `/dashboard` | API рекомендацій, заявок | було PARTIAL | PARTIAL | Додано огляд, лічильники, sidebar **PatientLayout** |
| Мій профіль | `/profile` | `PATCH /me` | було MISSING | — | **Новий розділ** |
| Пошук спеціалістів | `/specialists` | COMPLETE | COMPLETE | COMPLETE | URL-фільтри є |
| Персоналізований підбір | `/matching/*` | COMPLETE | COMPLETE | COMPLETE | E2E покриває |
| Історія рекомендацій | `/recommendations` | COMPLETE | COMPLETE | COMPLETE | — |
| Мої заявки | `/my-requests` | COMPLETE | COMPLETE | COMPLETE | — |
| Мої відгуки | `/my-reviews` | `GET /me/reviews` **NEW** | було MISSING | — | **Новий API + UI** |
| Налаштування | `/settings` | read-only meta | PARTIAL | PARTIAL | Посилання на профіль |

---

## 3. Кабінет спеціаліста

| Функція | Маршрут / API | Статус | Примітки |
|---------|---------------|--------|----------|
| Анкета, послуги, модерація | `/specialist/dashboard`, `PUT /specialist/me` | COMPLETE | Форма повна |
| Заявки accept/decline | `/specialist/requests` | COMPLETE | — |
| Фото профілю | `POST /specialist/me/photo` | **NEW** | WebP upload, sharp, 2MB |
| `/specialist/profile/edit` | alias dashboard | PARTIAL | Дубль маршруту OK |

---

## 4. Каталог і профіль

| Функція | Статус | Примітки |
|---------|--------|----------|
| Пошук, фільтри, URL, пагінація | COMPLETE | `SpecialistsListPage` |
| Детальний профіль, відгуки, заявка | COMPLETE | — |
| Skeleton / empty states | PARTIAL | Базові тексти є, skeleton рідко |
| Обране / порівняння 2–3 | MISSING | Відкладено (другорядне) |

---

## 5. AHP / WSM

| Крок | Статус |
|------|--------|
| Параметри → критерії → CR → результати | COMPLETE (API + UI) |
| DIRECT_WSM | COMPLETE |
| Hardcoded Top-5 | відсутнє (перевірено тестами) |
| Історія в PostgreSQL | COMPLETE |

---

## 6. Адмінпанель

| Розділ | Маршрут | Статус | Примітки |
|--------|---------|--------|----------|
| Dashboard | `/admin` | COMPLETE | summary API |
| Users | `/admin/users` | COMPLETE | activate/deactivate |
| Specialists | `/admin/specialists` | COMPLETE | approve/reject |
| Reviews | `/admin/reviews` | COMPLETE | модерація + рейтинг |
| Requests | `/admin/requests` | COMPLETE | фільтри статусів |
| Dictionaries | `/admin/dictionaries` | COMPLETE | CRUD |
| Criteria | `/admin/criteria` | COMPLETE | описи AHP |
| Графіки аналітики | — | MISSING | не критично для MVP |

---

## 7. Showcase БД і контент

| Елемент | Статус | Дія |
|---------|--------|-----|
| 48 спеціалістів, послуги, відгуки | COMPLETE | `showcase:verify` |
| Портрети sc-001…048 | COMPLETE | синтетичні |
| Текст «Демо-категорія» в довідниках | PARTIAL | seed + `showcase:patch-copy` |
| Стокові фото публічних сторінок | PARTIAL | 4 файлу в `images/marketing/` |
| ASSET-SOURCES.md | **NEW** | — |

---

## 8. Публічний UI / контент

| Сторінка | Статус | Потрібно |
|----------|--------|----------|
| Home | PARTIAL→PARTIAL+ | hero фото додано; FAQ розширити |
| About | PARTIAL+ | 2 фото додано |
| How it works | COMPLETE | можна додати ілюстрації |
| Contacts | PARTIAL | лише якщо `VITE_CONTACT_*` |
| Візуальна поліровка каталогу | PARTIAL | hover/skeleton |

---

## 9. Критичні прогалини (пріоритет після цього блоку)

1. Browser QA + `docs/thesis/screenshots/final-product/` (Phase 6).
2. `PRODUCT-ACCEPTANCE.md` з таблицею COMPLETE після E2E.
3. Додаткові стокові зображення (5–8 напрямів) з задокументованою ліцензією.
4. Specialist layout (sidebar як у пацієнта) — P2.
5. Обране / порівняння — P3.

---

## 10. Висновок аудиту

**Фактична готовність до робіт:** ~40% за критерієм «повноцінний презентаційний продукт» (контент + кабінети + медіа).  
**Після блоку 2026-10-22:** ~**55–60%** — закрито прогалини пацієнта, фото спеціаліста, маркетингові зображення, копірайт довідників showcase.

Наступна сесія: Phase 4 візуал (каталог, профіль), Phase 6 browser matrix, Phase 7 acceptance doc.
