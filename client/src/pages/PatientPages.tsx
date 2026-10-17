import { useAuth } from "../features/auth/AuthProvider";
import { PlaceholderPage } from "../components/PlaceholderPage";

export function PatientDashboardPage() {
  const { user } = useAuth();

  return (
    <section className="rounded-xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-text">Кабінет пацієнта</h1>
      <p className="mt-3 text-text-muted">
        Вітаємо, {user?.fullName}. Тут з&apos;являться збережені пошуки, рекомендації та заявки (M5–M6).
      </p>
      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-surface-tint p-3">
          <dt className="text-text-muted">Email</dt>
          <dd className="font-medium text-text">{user?.email}</dd>
        </div>
        <div className="rounded-lg bg-surface-tint p-3">
          <dt className="text-text-muted">ID пацієнта</dt>
          <dd className="font-medium text-text">{user?.patientId ?? "—"}</dd>
        </div>
      </dl>
    </section>
  );
}

export function MatchingNewPage() {
  return (
    <PlaceholderPage
      title="Новий підбір"
      description="Форма параметрів пошуку та збереження SearchRequest — етап M5."
    />
  );
}

export function MatchingCriteriaPage() {
  return (
    <PlaceholderPage
      title="Критерії підбору"
      description="AHP pairwise та WSM слайдери — етап M4–M5."
    />
  );
}

export function MatchingResultsPage() {
  return (
    <PlaceholderPage
      title="Результати підбору"
      description="Ранжовані рекомендації — етап M5."
    />
  );
}

export function RecommendationsHistoryPage() {
  return (
    <PlaceholderPage title="Історія рекомендацій" description="Збережені рекомендації — етап M5." />
  );
}

export function MyRequestsPage() {
  return <PlaceholderPage title="Мої заявки" description="Заявки на консультацію — етап M6." />;
}

export function SettingsPage() {
  return <PlaceholderPage title="Налаштування" description="Налаштування профілю — майбутній етап." />;
}
