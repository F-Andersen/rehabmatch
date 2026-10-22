import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FaqAccordion, homeFaqItems } from "../components/FaqAccordion";
import { useAuth } from "../features/auth/AuthProvider";
import { fetchCatalogDictionaries, fetchSpecialistsList } from "../features/specialists/api";

function formatPrice(value: number) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(value);
}

export function HomePage() {
  const { user } = useAuth();
  const matchingHref = user?.role === "PATIENT" ? "/matching/new" : "/login";

  const specialistsQuery = useQuery({
    queryKey: ["home", "specialists"],
    queryFn: () =>
      fetchSpecialistsList({
        page: "1",
        pageSize: "6",
        sort: "rating_desc",
      }),
  });

  const catalogQuery = useQuery({
    queryKey: ["catalog"],
    queryFn: fetchCatalogDictionaries,
  });

  const totalInCatalog = specialistsQuery.data?.meta.total ?? null;
  const featured = specialistsQuery.data?.data ?? [];
  const specializations = catalogQuery.data?.specializations.slice(0, 6) ?? [];

  return (
    <div className="space-y-16 pb-4">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface via-surface to-surface-tint shadow-sm">
        <div className="grid lg:grid-cols-2 lg:items-stretch">
        <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-16 lg:max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">RehabMatch</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-text sm:text-4xl lg:text-[2.5rem]">
            Знайдіть спеціаліста з реабілітації відповідно до ваших потреб
          </h1>
          <p className="mt-4 text-base leading-relaxed text-text-muted sm:text-lg">
            Платформа допомагає порівняти фахівців за досвідом, вартістю, рейтингом, локацією та форматом
            консультації. Пріоритети задаєте ви — через попарне порівняння (AHP) або швидкі ваги (WSM).
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/specialists"
              className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
            >
              Знайти спеціаліста
            </Link>
            <Link
              to={matchingHref}
              className="rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-text hover:bg-surface-tint"
            >
              Почати персоналізований підбір
            </Link>
          </div>
          {totalInCatalog !== null && (
            <p className="mt-6 text-sm text-text-muted">
              У каталозі зараз{" "}
              <span className="font-semibold text-text">{totalInCatalog}</span> підтверджених профілів
              спеціалістів (дані з вашої бази).
            </p>
          )}
        </div>
        <div className="relative min-h-[220px] lg:min-h-full">
          <img
            src="/images/marketing/hero-gait-training.png"
            alt="Спеціаліст супроводжує пацієнта під час відновлення ходи в реабілітаційному залі"
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-page/80 via-transparent to-transparent lg:bg-gradient-to-l lg:from-surface lg:via-surface/40 lg:to-transparent" />
        </div>
        </div>
      </section>

      <section aria-labelledby="benefits-heading">
        <h2 id="benefits-heading" className="text-2xl font-semibold text-text">Чому RehabMatch</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Прозорі критерії",
              text: "П’ять зрозумілих параметрів: досвід, ціна, рейтинг, локація, формат зустрічі.",
            },
            {
              title: "Ваші пріоритети",
              text: "AHP узгоджує ваги з перевіркою CR; WSM — для швидкого налаштування.",
            },
            {
              title: "Пояснення ранжування",
              text: "Кожна рекомендація містить ваги критеріїв і коротке пояснення балів.",
            },
            {
              title: "Навчальний контекст",
              text: "Синтетичні профілі для демонстрації; система не замінює медичну діагностику чи лікування.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <h3 className="font-semibold text-text">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {specializations.length > 0 && (
        <section aria-labelledby="directions-heading">
          <h2 id="directions-heading" className="text-2xl font-semibold text-text">
            Напрями реабілітації
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-text-muted">
            Довідник спеціалізацій із каталогу — для фільтрації та підбору за типом запиту.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {specializations.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/specialists?specializationId=${item.id}`}
                  className="inline-block rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text hover:border-brand-600 hover:text-brand-600"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="steps-heading" className="rounded-2xl border border-border bg-surface-tint/40 p-6 sm:p-8">
        <h2 id="steps-heading" className="text-2xl font-semibold text-text">Як проходить підбір</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            "Опишіть запит: травма, місто, бюджет, формат.",
            "Задайте ваги критеріїв (AHP або WSM).",
            "Отримайте ранжований список із поясненням.",
            "Перегляньте профіль і надішліть заявку на консультацію.",
          ].map((step, index) => (
            <li key={step} className="flex gap-3 rounded-xl bg-surface p-4 shadow-sm">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
                aria-hidden
              >
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed text-text-muted">{step}</p>
            </li>
          ))}
        </ol>
        <Link to="/how-it-works" className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700">
          Детальніше про етапи →
        </Link>
      </section>

      <section aria-labelledby="ahp-heading">
        <h2 id="ahp-heading" className="text-2xl font-semibold text-text">AHP і WSM у RehabMatch</h2>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="font-semibold text-text">Analytic Hierarchy Process (AHP)</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Десять попарних порівнянь критеріїв перетворюються на нормалізовані ваги. Індекс узгодженості CR
              показує, чи не суперечать ваші відповіді одна одній (поріг узгодженості в системі — 0,10).
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="font-semibold text-text">Weighted Sum Model (WSM)</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Швидке налаштування пріоритетів слайдерами без попарних кроків. Зручно для першого ознайомлення або
              коли різниця між критеріями очевидна.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="featured-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="featured-heading" className="text-2xl font-semibold text-text">
              Спеціалісти з високим рейтингом
            </h2>
            <p className="mt-1 text-sm text-text-muted">Підтверджені профілі з каталогу (сортування за рейтингом).</p>
          </div>
          <Link to="/specialists" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            Увесь каталог
          </Link>
        </div>
        {specialistsQuery.isLoading ? (
          <p className="mt-6 text-text-muted">Завантаження профілів…</p>
        ) : featured.length === 0 ? (
          <p className="mt-6 text-text-muted">Поки немає опублікованих спеціалістів у каталозі.</p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((spec) => (
              <li key={spec.id}>
                <Link
                  to={`/specialists/${spec.id}`}
                  className="flex h-full flex-col rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-brand-600/40 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    {spec.photoUrl ? (
                      <img
                        src={spec.photoUrl}
                        alt={`Фото спеціаліста ${spec.fullName}`}
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-surface-tint"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-tint text-brand-600">
                        {spec.fullName.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-text">{spec.fullName}</p>
                      <p className="text-sm text-text-muted">
                        {spec.specializations.map((s) => s.name).join(", ") || "Реабілітація"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-text-muted">
                    {spec.city?.name ?? "Місто не вказано"}
                    {spec.experienceYears > 0 ? ` · ${spec.experienceYears} р. досвіду` : ""}
                  </p>
                  <p className="mt-2 text-sm font-medium text-brand-600">{formatPrice(spec.pricePerSession)}</p>
                  {spec.ratingCount > 0 && (
                    <p className="mt-1 text-xs text-text-muted">
                      Рейтинг {spec.ratingAvg.toFixed(1)} ({spec.ratingCount} відгуків)
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="faq-heading" className="max-w-3xl">
        <h2 id="faq-heading" className="text-2xl font-semibold text-text">Часті запитання</h2>
        <p className="mt-2 text-sm text-text-muted">Відповіді відповідають фактичній логіці RehabMatch.</p>
        <div className="mt-6">
          <FaqAccordion items={homeFaqItems} />
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-brand-600/30 bg-surface-tint/50 px-6 py-10 text-center sm:px-10">
        <h2 className="text-xl font-semibold text-text">Приєднуйтесь до платформи</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-text-muted">
          Пацієнти можуть зберігати історію рекомендацій і надсилати заявки. Спеціалісти — вести профіль після
          модерації адміністратора.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/register"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Зареєструватися як пацієнт
          </Link>
          <Link
            to="/register"
            className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text hover:bg-surface-tint"
          >
            Реєстрація спеціаліста
          </Link>
        </div>
      </section>

      <p className="text-center text-xs leading-relaxed text-text-muted">
        RehabMatch — навчальний прототип із синтетичними профілями для демонстрації алгоритмів підбору. Не є
        медичною послугою та не гарантує результатів лікування.
      </p>
    </div>
  );
}
