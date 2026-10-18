import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { fetchRecommendations } from "../features/matching/api";
import {
  cancelPatientAppointmentRequest,
  fetchPatientAppointmentRequests,
} from "../features/reviews-requests/api";
import { ApiError } from "../lib/api";

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
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/matching/new" className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Інтелектуальний підбір спеціаліста
          </Link>
          <Link to="/my-requests" className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-surface-tint">
            Мої заявки на консультацію
          </Link>
        </div>
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
  return <Navigate to="/recommendations" replace />;
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

function requestStatusLabel(status: string) {
  switch (status) {
    case "REQUESTED":
      return "Очікує відповіді";
    case "ACCEPTED":
      return "Прийнято спеціалістом";
    case "DECLINED":
      return "Відхилено";
    case "CANCELLED":
      return "Скасовано";
    default:
      return status;
  }
}

export function MyRequestsPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["patient", "appointment-requests"],
    queryFn: () => fetchPatientAppointmentRequests({ page: "1", pageSize: "50" }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelPatientAppointmentRequest(id),
    onSuccess: async () => {
      setMessage("Заявку скасовано.");
      await queryClient.invalidateQueries({ queryKey: ["patient", "appointment-requests"] });
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : "Не вдалося скасувати заявку.");
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-text">Мої заявки на консультацію</h1>
      <p className="text-sm text-text-muted">
        Це запити на звʼязок, а не підтверджені медичні записи.
      </p>
      {message && (
        <p className="rounded-lg border border-border bg-surface-tint px-3 py-2 text-sm">{message}</p>
      )}
      {listQuery.isLoading ? (
        <p className="text-text-muted">Завантаження…</p>
      ) : listQuery.data?.data.length === 0 ? (
        <p className="text-text-muted">У вас ще немає заявок.</p>
      ) : (
        <ul className="space-y-3">
          {listQuery.data?.data.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <p className="font-medium text-text">{item.specialistName ?? "Спеціаліст"}</p>
              <p className="mt-1 text-sm text-text-muted">
                Створено: {new Date(item.createdAt).toLocaleString("uk-UA")}
              </p>
              <p className="text-sm text-text-muted">
                Бажаний час: {new Date(item.preferredAt).toLocaleString("uk-UA")}
              </p>
              <p className="mt-2 text-sm">
                Статус: <strong>{requestStatusLabel(item.status)}</strong>
              </p>
              {item.note && <p className="mt-2 text-sm text-text-muted">{item.note}</p>}
              {item.status === "REQUESTED" && (
                <button
                  type="button"
                  className="mt-3 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface-tint"
                  onClick={() => cancelMutation.mutate(item.id)}
                >
                  Скасувати заявку
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-text">Налаштування облікового запису</h1>
      <p className="text-sm text-text-muted">
        Базові дані сесії. Розширене редагування профілю доступне в кабінеті пацієнта або спеціаліста.
      </p>
      {user && (
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-text-muted">ПІБ</dt>
            <dd className="font-medium text-text">{user.fullName}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Email</dt>
            <dd className="font-medium text-text">{user.email}</dd>
          </div>
          <div>
            <dt className="text-text-muted">Роль</dt>
            <dd className="font-medium text-text">{user.role}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
