import { Link } from "react-router-dom";
import { hasConfiguredContact, publicContact } from "../config/site";

export function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-text">Про систему RehabMatch</h1>
        <p className="mt-3 text-lg text-text-muted">
          Вебзастосунок для підтримки вибору спеціаліста з реабілітації на основі багатокритеріального аналізу.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <img
          src="/images/marketing/rehab-center.jpg"
          alt="Сучасний зал фізичної реабілітації з обладнанням"
          className="h-48 w-full rounded-xl object-cover shadow-sm sm:h-56"
          loading="lazy"
        />
        <img
          src="/images/marketing/manual-therapy.png"
          alt="Мануальна терапія та супровід спеціаліста"
          className="h-48 w-full rounded-xl object-cover shadow-sm sm:h-56"
          loading="lazy"
        />
      </div>

      <section className="space-y-3 text-sm leading-relaxed text-text-muted">
        <h2 className="text-xl font-semibold text-text">Що це таке</h2>
        <p>
          RehabMatch поєднує каталог фахівців, фільтри за клініко-організаційними параметрами та модуль
          персоналізованих рекомендацій. Користувач формалізує власні пріоритети, а система ранжує кандидатів із
          поясненням внеску кожного критерію.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-muted">
        <h2 className="text-xl font-semibold text-text">Для кого</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Пацієнти та їхні опікуни, які шукають реабілітаційну підтримку з урахуванням бюджету та формату.</li>
          <li>Спеціалісти, які публікують профіль, послуги та обробляють заявки на консультацію.</li>
          <li>Адміністратори, що модерують профілі та відгуки й підтримують довідники.</li>
        </ul>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-muted">
        <h2 className="text-xl font-semibold text-text">Яку проблему вирішує</h2>
        <p>
          Інформація про фахівців часто розпорошена, а критерії вибору суб’єктивні. RehabMatch структурує порівняння
          за п’ятьма узгодженими параметрами та дозволяє явно зафіксувати ваги замість неформального «на око».
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-muted">
        <h2 className="text-xl font-semibold text-text">Можливості</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Публічний каталог із фільтрами та профілями спеціалістів.</li>
          <li>Персоналізований підбір (AHP / WSM) із збереженням історії рекомендацій.</li>
          <li>Відгуки з модерацією та перерахунком рейтингу.</li>
          <li>Заявки на консультацію зі статусною моделлю.</li>
          <li>Адміністративна панель для користувачів, довідників і критеріїв.</li>
        </ul>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-muted">
        <h2 className="text-xl font-semibold text-text">Багатокритеріальне оцінювання</h2>
        <p>
          Для кожного спеціаліста обчислюються нормалізовані оцінки за досвідом, вартістю, рейтингом, відповідністю
          локації та формату консультації. Підсумковий бал — зважена сума (WSM) із вагами, отриманими з AHP або
          прямого введення.
        </p>
        <p>
          <strong className="text-text">Чому AHP:</strong> метод дозволяє перевірити узгодженість парних порівнянь
          (індекс CR) і зменшує ризик суперечливих пріоритетів при складному виборі.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-muted">
        <h2 className="text-xl font-semibold text-text">Переваги та обмеження</h2>
        <p>
          Переваги — прозорість ваг, пояснюваність ранжування, єдиний інтерфейс для пацієнта та адміністратора.
          Обмеження — навчальний характер даних, відсутність телемедицини та онлайн-оплати, спрощена модель
          критеріїв без клінічної верифікації.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-text-muted">
        <h2 className="text-xl font-semibold text-text">Конфіденційність</h2>
        <p>
          Облікові записи захищені сесіями на сервері; адміністративні дії доступні лише ролі ADMIN. Не вводьте
          реальні медичні документи в демонстраційному середовищі.
        </p>
      </section>

      <p className="rounded-xl border border-border bg-surface-tint px-4 py-3 text-sm text-text-muted">
        Усі профілі та відгуки в демо-базах є синтетичними й призначені для захисту навчального проєкту, а не для
        реального підбору лікування.
      </p>
    </article>
  );
}

const workflowSteps = [
  {
    title: "Реєстрація пацієнта",
    text: "Створіть обліковий запис із роллю PATIENT, щоб зберігати запити підбору та заявки.",
    to: "/register",
    cta: "Реєстрація",
  },
  {
    title: "Визначення потреб",
    text: "Оберіть тип травми/захворювання, місто, бюджет, формат та додаткові фільтри.",
    to: "/matching/new",
    cta: "Новий підбір",
  },
  {
    title: "Вибір критеріїв",
    text: "Перейдіть до кроку ваг після збереження параметрів пошуку.",
    to: "/how-it-works",
    cta: "Деталі",
  },
  {
    title: "AHP або WSM",
    text: "Попарні порівняння (10 кроків) або слайдери пріоритетів у спрощеному режимі.",
    to: "/how-it-works",
    cta: "Порівняння методів",
  },
  {
    title: "Ваги та CR",
    text: "Попередній розрахунок показує відсотковий розподіл ваг; для AHP — індекс узгодженості CR.",
    to: "/how-it-works",
    cta: "Про CR",
  },
  {
    title: "Рейтинг спеціалістів",
    text: "Алгоритм формує ранжований список із показником відповідності вашим пріоритетам.",
    to: "/specialists",
    cta: "Каталог",
  },
  {
    title: "Пояснення",
    text: "На сторінці рекомендації доступні ваги критеріїв і текстові пояснення по кожному кандидату.",
    to: "/recommendations",
    cta: "Історія (після входу)",
  },
  {
    title: "Профіль і заявка",
    text: "Відкрийте профіль спеціаліста та надішліть заявку на консультацію з бажаною датою.",
    to: "/specialists",
    cta: "Переглянути профілі",
  },
];

export function HowItWorksPage() {
  return (
    <article className="space-y-10">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold text-text">Як це працює</h1>
        <p className="mt-3 text-text-muted">
          Від реєстрації до заявки на консультацію — покроковий сценарій роботи з RehabMatch.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <img
          src="/images/marketing/resistance-therapy.jpg"
          alt="Вправи з еластичною стрічкою під наглядом реабілітолога"
          className="h-56 w-full rounded-2xl object-cover shadow-sm"
          loading="lazy"
        />
        <img
          src="/images/marketing/manual-therapy.png"
          alt="Мануальна робота з пацієнтом у кабінеті реабілітації"
          className="h-56 w-full rounded-2xl object-cover shadow-sm"
          loading="lazy"
        />
      </div>

      <ol className="grid gap-4 md:grid-cols-2">
        {workflowSteps.map((step, index) => (
          <li key={step.title} className="flex gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
              aria-hidden
            >
              {index + 1}
            </span>
            <div>
              <h2 className="font-semibold text-text">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{step.text}</p>
              <Link to={step.to} className="mt-3 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700">
                {step.cta} →
              </Link>
            </div>
          </li>
        ))}
      </ol>

      <section className="rounded-2xl border border-border bg-surface-tint/50 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-text">Схема AHP / WSM</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-surface p-5 shadow-sm">
            <p className="text-sm font-medium text-brand-600">AHP (попарно)</p>
            <p className="mt-2 text-sm text-text-muted">
              Матриця порівнянь → власний вектор пріоритетів → CR. Якщо CR &gt; 0,10, система просить уточнити
              відповіді.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-tint p-3 text-xs text-text-muted" aria-hidden>
              {`Критерії → 10 пар → ваги wᵢ → Σ wᵢ = 1\nscore = Σ wᵢ · нормᵢ`}
            </pre>
          </div>
          <div className="rounded-xl bg-surface p-5 shadow-sm">
            <p className="text-sm font-medium text-brand-600">WSM (прямі ваги)</p>
            <p className="mt-2 text-sm text-text-muted">
              Пріоритети 1–9 нормалізуються до часток суми. CR не обчислюється — режим для швидкого старту.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-tint p-3 text-xs text-text-muted" aria-hidden>
              {`pᵢ → wᵢ = pᵢ / Σpⱼ\nrank за зваженою сумою`}
            </pre>
          </div>
        </div>
        <Link
          to="/login"
          className="mt-6 inline-flex rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Увійти та спробувати підбір
        </Link>
      </section>
    </article>
  );
}

const faqItems = [
  {
    q: "Чи це медична консультація?",
    a: "Ні. RehabMatch — навчальний прототип для демонстрації алгоритмів підбору, а не платформа телемедицини.",
  },
  {
    q: "Як спеціалісту потрапити в каталог?",
    a: "Зареєструйтесь із роллю SPECIALIST, заповніть профіль і дочекайтесь схвалення адміністратора (статус APPROVED).",
  },
  {
    q: "Чи зберігаються мої рекомендації?",
    a: "Так, для авторизованого пацієнта історія доступна в розділі рекомендацій.",
  },
  {
    q: "Куди звернутися з технічними питаннями?",
    a: "Використовуйте контакти нижче, якщо вони налаштовані власником інсталяції.",
  },
];

export function ContactsPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-text">Контакти та підтримка</h1>
        <p className="mt-3 text-text-muted">
          Зв’язок із командою проєкту або адміністратором інсталяції RehabMatch.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-text">Способи зв’язку</h2>
        {hasConfiguredContact ? (
          <ul className="mt-4 space-y-2 text-sm text-text-muted">
            {publicContact.supportEmail && (
              <li>
                Email:{" "}
                <a className="font-medium text-brand-600" href={`mailto:${publicContact.supportEmail}`}>
                  {publicContact.supportEmail}
                </a>
              </li>
            )}
            {publicContact.supportPhone && (
              <li>
                Телефон: <span className="font-medium text-text">{publicContact.supportPhone}</span>
              </li>
            )}
            {publicContact.officeNote && <li>{publicContact.officeNote}</li>}
          </ul>
        ) : (
          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            Публічні контакти ще не налаштовані. Власнику інсталяції потрібно додати в локальний{" "}
            <code className="rounded bg-surface-tint px-1">.env</code> змінні{" "}
            <code className="rounded bg-surface-tint px-1">VITE_CONTACT_EMAIL</code>,{" "}
            <code className="rounded bg-surface-tint px-1">VITE_CONTACT_PHONE</code>,{" "}
            <code className="rounded bg-surface-tint px-1">VITE_CONTACT_OFFICE</code> (не комітити в Git).
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-text">Для спеціалістів</h2>
        <p className="text-sm leading-relaxed text-text-muted">
          Після реєстрації заповніть опис, послуги та формати прийому. Профіль з’явиться в каталозі лише після
          модерації. Питання щодо статусу анкети адресуйте адміністратору вашої інсталяції.
        </p>
        <Link to="/register" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          Форма реєстрації →
        </Link>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-text">Короткі відповіді (FAQ)</h2>
        <ul className="space-y-3">
          {faqItems.map((item) => (
            <li key={item.q} className="rounded-xl border border-border bg-surface p-4">
              <p className="font-medium text-text">{item.q}</p>
              <p className="mt-2 text-sm text-text-muted">{item.a}</p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-text-muted">
        Онлайн-форма звернень у цьому прототипі не реалізована, щоб не створювати ілюзію доставки повідомлень без backend.
        Для демонстрації використовуйте{" "}
        <Link to="/about" className="text-brand-600 hover:text-brand-700">розділ «Про систему»</Link>.
      </p>
    </article>
  );
}
