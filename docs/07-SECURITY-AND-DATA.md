# 07. Безпека, конфіденційність і медичні обмеження

## Рівень ризику / позиціювання

Це демонстраційний вебзастосунок підтримки вибору спеціаліста, а **не** система медичної діагностики, реального запису до державного лікаря чи клінічного призначення. Не збирати медичні документи, історії хвороби, дату народження та повні діагнози для MVP. Зберігати тільки довідникову категорію запиту, потрібну для підбору. Інтерфейс має показувати, що оцінка — відповідність перевагам, а не клінічний рейтинг якості лікування.

## Обов'язкові захисні заходи

1. Password hash Argon2id (або bcrypt з коректною складністю), password length/strength policy, порівняння без leak.
2. Непередбачуваний session token у Secure+HTTP-only+SameSite cookie, сервер зберігає хеш токена; CSRF/origin-check strategy для mutating endpoints; revoke on logout; TTL.
3. CORS allowlist з `credentials: true` і чітким origin; жодних `*` з cookie auth.
4. Rate limits на auth і write actions, помірна кількість відгуків; passwords/emails/сесії не логувати.
5. Zod DTO validation, length limits, sanitize render HTML (React escapes by default), no unsafe HTML. Uploads — поза MVP; для аватарів дозволено URL або ініціали із перевірених даних.
6. RBAC на server маршрутах; object-level auth на history, appointment request, profile edits; admin bootstrap only via env.
7. `.env` до `.gitignore`; `.env.example` без секретів; жодних real API keys у репозиторії або screenshots.
8. DB migrations+FK+unique constraints; backup/restore для пізнішої production фази; seed idempotent.
9. Dependency auditing і тестування API помилок. Error stack traces не показувати користувачу.
10. Відгуки/профілі з demo seed: чітка позначка «Демонстраційний профіль / синтетичні дані». Ніяких вигаданих «сертифікованих лікарів».

## Дані та дисклеймер

User-facing footer: «RehabMatch — демонстраційна система порівняння спеціалістів за визначеними критеріями. Вона не здійснює медичної діагностики та не замінює консультацію кваліфікованого фахівця. Дані демонстраційних спеціалістів є вигаданими».

Захист персональних даних для реального публічного сервісу потребуватиме окремих процедур (юридична підстава обробки, строки зберігання, видалення, реальна перевірка медичних даних, privacy notice, безпекова оцінка). Це **поза MVP** і має бути забороною на production-реліз без перевірки.
