import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { fetchRecommendations } from "../features/matching/api";
import { PlaceholderPage } from "../components/PlaceholderPage";

export {
  MatchingNewPage,
  MatchingCriteriaPage,
  RecommendationDetailPage,
} from "./matching/MatchingFlowPages";

export function PatientDashboardPage() {
  const { user } = useAuth();
  const history = useQuery({
    queryKey: ["recommendations", "list"],
    queryFn: () => fetchRecommendations(1),
  });

  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-text">Кабінет пацієнта</h1>
        <p className="mt-3 text-text-muted">Вітаємо, {user?.fullName}.</p>
        <Link to="/matching/new" className="mt-4 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Інтелектуальний підбір спеціаліста
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Останні підбори</h2>
        {history.isLoading ? (
          <p className="mt-2 text-sm text-text-muted">Завантаження…</p>
        ) : history.data?.data.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">Ще немає збережених рекомендацій.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {history.data?.data.slice(0, 5).map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-text">{item.injuryType}</p>
                  <p className="text-xs text-text-muted">
                    {new Date(item.createdAt).toLocaleString("uk-UA")} · {item.mode}
                  </p>
                </div>
                <Link to={`/recommendations/${item.id}`} className="text-sm text-brand-600 hover:text-brand-700">
                  Переглянути
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to="/recommendations" className="mt-4 inline-block text-sm text-brand-600">Вся історія</Link>
      </div>
    </section>
  );
}

export function MatchingResultsPage() {
  return (
    <PlaceholderPage
      title="Результати підбору"
      description="Після збереження рекомендації відкривається сторінка /recommendations/:id."
    />
  );
}

export function RecommendationsHistoryPage() {
  const history = useQuery({
    queryKey: ["recommendations", "list"],
    queryFn: () => fetchRecommendations(1),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Історія рекомендацій</h1>
      {history.isLoading ? (
        <p className="mt-4 text-text-muted">Завантаження…</p>
      ) : history.data?.data.length === 0 ? (
        <p className="mt-4 text-text-muted">Поки що немає збережених підборів.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {history.data?.data.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-surface p-4">
              <p className="font-medium">{item.injuryType}</p>
              <p className="text-sm text-text-muted">
                {item.city ?? "Будь-яке місто"} · бюджет до {item.maxBudget} грн
              </p>
              <p className="text-xs text-text-muted">{new Date(item.createdAt).toLocaleString("uk-UA")}</p>
              <Link to={`/recommendations/${item.id}`} className="mt-2 inline-block text-sm text-brand-600">
                Відкрити результати
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MyRequestsPage() {
  return <PlaceholderPage title="Мої заявки" description="Заявки на консультацію — етап M6." />;
}

export function SettingsPage() {
  return <PlaceholderPage title="Налаштування" description="Налаштування профілю — майбутній етап." />;
}
