# 05. Дизайн-система та маршрути UI

## Візуальна основа (автентичні ресурси з `Диплом1.docx`, Додаток А)

| Екран | Макет | Основний UI |
|---|---|---|
| Головна | `design/reference/A1-home.png` | навігація, hero, переваги, 4 кроки підбору, CTA |
| Вхід/реєстрація | `design/reference/A2-auth.png` | дві світлі картки на блакитному фоні з ілюстраціями |
| Каталог | `design/reference/A3-search.png` | sidebar filters, 3+ list cards, avatar, badges, ціни, CTA |
| Критерії | `design/reference/A4-criteria.png` | 5 вагових рядків, права пояснювальна колонка, відсотковий підсумок |
| Рекомендації | `design/reference/A5-recommendations.png` | 5 ranked cards, score, права колонка ваг та пояснення |
| Спеціаліст | `design/reference/A6-specialist-profile.png` | картка експерта, tabs, services, reviews, consult CTA |
| Адмінка | `design/reference/A7-admin-dashboard.png` | sidebar, tabs за ролями, table, статуси |
| Навігація | `design/reference/A8-sitemap.png` | потоки між реєстрацією, каталогом, критеріями, рекомендаціями, профілями, admin |

Матеріали **не є редагованими Figma-макетами**. Вони збережені у вигляді оригінальних PNG з DOCX. Pixel-perfect гарантій немає. Оберіть шрифти/токени нижче як **наближення**, а не як відомі вихідні значення.

## Пропоновані дизайн-токени (не з документа)

- `--brand-600: #1D5FEF` (primary blue)
- `--brand-700: #1648C8` (hover/focus)
- `--bg-page: #F6F9FF` (світла сторінка)
- `--surface: #FFFFFF`
- `--surface-tint: #EAF2FF`
- `--text: #17223B`
- `--text-muted: #66758B`
- `--border: #E1E8F4`
- `--success: #16845B` (лише статус)
- UI typography: `Inter`, fallback system sans-serif; body 14–16px, h1 32–44px, заголовки карток 16–20px.
- border radius 10–14px, soft shadows, max container width 1200–1280px, desktop gap 16–24px.

## Route map

**Public**: `/` home; `/login`; `/register`; `/specialists`; `/specialists/:id`; `/about`; `/how-it-works`; `/contacts` (простий інформаційний екран/секція).

**Patient authenticated**: `/dashboard`; `/matching/new` (форма пошуку); `/matching/:id/criteria` (pairwise wizard або WSM quick sliders); `/matching/:id/results`; `/recommendations` (історія); `/my-requests`; `/settings`.

**Specialist authenticated**: `/specialist/dashboard`; `/specialist/profile/edit`; `/specialist/requests`.

**Admin**: `/admin`; `/admin/users`; `/admin/specialists`; `/admin/reviews`; `/admin/dictionaries`; `/admin/criteria`; `/admin/requests`.

Стани auth, помилки, відсутності результатів та незаповнених форм — окремі продумані інтерфейси, навіть якщо не намальовані у source DOCX.

## Layout/behavior

**Desktop ≥1200px:** топ-меню; на каталозі лівий фіксований фільтр 260–300px, праворуч список; на рекомендаціях summary праворуч. На профілі 2-колонкова секція фото/послуг; admin має власний сайдбар.

**Tablet 768–1199px:** зменшені горизонтальні відступи, cards у 1 стовпець, summary нижче.

**Mobile 375–767px:** меню-гамбургер; filter drawer/sheet; cards вертикально з CTA на всю ширину; 5 критеріїв в один стовпець; AHP wizard з прогресом `x/10`; таблиці адмінки з горизонтальним скролом або мобільними картками.

## Конкретні UX сценарії

1. Home CTA «Розпочати підбір» → `/matching/new` (перенаправлення на login при збереженні). Гостьовий каталог лишається доступним.
2. Catalog кнопка «Переглянути профіль» відкриває детальну сторінку; «До порівняння» у макеті можна замінити реальною позначкою обраного, але тільки якщо реалізована функція порівняння. Інакше не показувати кнопку.
3. Criteria AHP: кнопка «Попарні порівняння» відкриває wizard з 10 кроками; після валідації right panel показує read-only bars та CR. Режим WSM: безпосередньо керовані sliders 1–9, прапорець «Спрощений режим (без AHP)», CR не показувати.
4. Recommendations: label «Показник відповідності пріоритетам: 0.892», 5 ranked cards та explanations за кожним (не відсоток успіху лікування).
5. Specialist: «Надіслати запит на консультацію» відкриває дату/час + підтвердження, після API успіху показує статус REQUESTED. Таб «Розклад» з оригіналу не відображати як календар, оскільки слотів немає; показати інформацію про запити.
6. Admin: status badges, реальні CRUD-модалі, підтвердження небезпечних дій, empty+loading+error states.

## Доступність/чистота

- `label` для inputs, error text + `aria-invalid`, видимі focus states, Tab/Enter/Escape, коректні dialog focus traps.
- Не покладатися лише на колір status, текстові назви поруч.
- Аватари можуть бути ініціалами; **не використовувати зображення демо-людей так, ніби це справжні медичні спеціалісти**.
- Логотип і слово RehabMatch відтворити як простий SVG/icon+text або CSS, без безпідставного використання чужих брендових знаків.
- Для будь-якого incomplete feature CTA або не показувати, або явно пояснювати недоступність. UI test має натиснути кожну видиму основну CTA.
