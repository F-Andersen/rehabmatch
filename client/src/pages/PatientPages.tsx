import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../features/auth/AuthProvider";
import { updateMeRequest } from "../features/auth/api";
import { fetchRecommendations } from "../features/matching/api";
import {
  cancelPatientAppointmentRequest,
  fetchPatientAppointmentRequests,
  fetchPatientReviews,
} from "../features/reviews-requests/api";
import { ApiError } from "../lib/api";

export {
  MatchingNewPage,
  MatchingCriteriaPage,
  RecommendationDetailPage,
} from "./matching/MatchingFlowPages";

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Мінімум 2 символи").max(120),
  phone: z.string().trim().max(32).optional().or(z.literal("")),
});

function reviewStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "На модерації";
    case "APPROVED":
      return "Схвалено";
    case "REJECTED":
      return "Відхилено";
    default:
      return status;
  }
}

export function PatientDashboardPage() {
  const { user } = useAuth();
  const history = useQuery({
    queryKey: ["recommendations", "list"],
    queryFn: () => fetchRecommendations(1),
  });
  const requests = useQuery({
    queryKey: ["patient", "appointment-requests"],
    queryFn: () => fetchPatientAppointmentRequests({ page: "1", pageSize: "5" }),
  });

  const openRequests =
    requests.data?.data.filter((r) => r.status === "REQUESTED").length ?? 0;

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-text">Огляд</h1>
        <p className="mt-2 text-text-muted">Вітаємо, {user?.fullName}.</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-surface-tint px-4 py-3">
            <dt className="text-text-muted">Email</dt>
            <dd className="font-medium text-text">{user?.email}</dd>
          </div>
          <div className="rounded-lg bg-surface-tint px-4 py-3">
            <dt className="text-text-muted">Телефон</dt>
            <dd className="font-medium text-text">{user?.phone || "Не вказано"}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/matching/new"
            className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Персоналізований підбір
          </Link>
          <Link
            to="/specialists"
            className="inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-surface-tint"
          >
            Каталог спеціалістів
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="font-semibold text-text">Заявки на консультацію</h2>
          <p className="mt-2 text-2xl font-bold text-brand-600">{openRequests}</p>
          <p className="text-sm text-text-muted">очікують відповіді спеціаліста</p>
          <Link to="/my-requests" className="mt-3 inline-block text-sm text-brand-600">
            Переглянути всі →
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="font-semibold text-text">Збережені підбори</h2>
          <p className="mt-2 text-2xl font-bold text-brand-600">
            {history.data?.meta.total ?? (history.isLoading ? "…" : 0)}
          </p>
          <p className="text-sm text-text-muted">рекомендацій у історії</p>
          <Link to="/recommendations" className="mt-3 inline-block text-sm text-brand-600">
            Історія →
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Останні підбори</h2>
        {history.isLoading ? (
          <p className="mt-2 text-sm text-text-muted">Завантаження…</p>
        ) : history.data?.data.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">
            Ще немає збережених рекомендацій.{" "}
            <Link to="/matching/new" className="text-brand-600">Почати підбір</Link>
          </p>
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
      </div>
    </section>
  );
}

export function PatientProfilePage() {
  const { user, refetchUser } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: {
      fullName: user?.fullName ?? "",
      phone: user?.phone ?? "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: (values: z.infer<typeof profileSchema>) =>
      updateMeRequest({
        fullName: values.fullName,
        phone: values.phone?.trim() ? values.phone.trim() : null,
      }),
    onSuccess: async () => {
      setError(null);
      setMessage("Профіль оновлено.");
      await refetchUser();
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiError ? err.message : "Не вдалося зберегти.");
    },
  });

  return (
    <section className="max-w-lg space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-text">Мій профіль</h1>
      <p className="text-sm text-text-muted">Оновіть контактні дані облікового запису пацієнта.</p>
      {message && <p className="rounded-lg bg-surface-tint px-3 py-2 text-sm">{message}</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      <form
        className="space-y-4"
        onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
        noValidate
      >
        <label className="block text-sm">
          <span className="text-text-muted">ПІБ</span>
          <input className="mt-1 w-full rounded-lg border border-border px-3 py-2" {...register("fullName")} />
          {errors.fullName && <span className="text-xs text-red-600">{errors.fullName.message}</span>}
        </label>
        <label className="block text-sm">
          <span className="text-text-muted">Email (не змінюється)</span>
          <input className="mt-1 w-full rounded-lg border border-border bg-surface-tint px-3 py-2" value={user?.email ?? ""} disabled />
        </label>
        <label className="block text-sm">
          <span className="text-text-muted">Телефон</span>
          <input className="mt-1 w-full rounded-lg border border-border px-3 py-2" {...register("phone")} placeholder="+380…" />
        </label>
        <button
          type="submit"
          disabled={isSubmitting || saveMutation.isPending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Зберегти
        </button>
      </form>
    </section>
  );
}

export function MyReviewsPage() {
  const listQuery = useQuery({
    queryKey: ["patient", "reviews"],
    queryFn: () => fetchPatientReviews("1", "30"),
  });

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-text">Мої відгуки</h1>
      <p className="text-sm text-text-muted">
        Відгуки проходять модерацію перед публікацією на профілі спеціаліста.
      </p>
      {listQuery.isLoading ? (
        <p className="text-text-muted">Завантаження…</p>
      ) : listQuery.data?.data.length === 0 ? (
        <p className="text-text-muted">
          Ви ще не залишали відгуків. Відкрийте профіль спеціаліста в каталозі, щоб оцінити консультацію.
        </p>
      ) : (
        <ul className="space-y-3">
          {listQuery.data?.data.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link to={`/specialists/${item.specialistId}`} className="font-medium text-brand-600">
                  {item.specialistName}
                </Link>
                <span className="text-sm text-text-muted">{reviewStatusLabel(item.status)}</span>
              </div>
              <p className="mt-1 text-sm">Оцінка: {item.rating} / 5</p>
              <p className="mt-2 text-sm text-text-muted">{item.comment}</p>
              <p className="mt-2 text-xs text-text-muted">
                {new Date(item.createdAt).toLocaleString("uk-UA")}
              </p>
            </li>
          ))}
        </ul>
      )}
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
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Історія рекомендацій</h1>
      {history.isLoading ? (
        <p className="text-text-muted">Завантаження…</p>
      ) : history.data?.data.length === 0 ? (
        <p className="text-text-muted">
          Поки що немає збережених підборів.{" "}
          <Link to="/matching/new" className="text-brand-600">Створити перший</Link>
        </p>
      ) : (
        <ul className="space-y-3">
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
    </section>
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
    <section className="space-y-6">
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
    </section>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  return (
    <section className="max-w-lg space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-text">Налаштування облікового запису</h1>
      <p className="text-sm text-text-muted">
        Email і пароль змінюються через адміністратора в навчальному середовищі. ПІБ і телефон — у розділі{" "}
        <Link to="/profile" className="text-brand-600">Мій профіль</Link>.
      </p>
      {user && (
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-text-muted">Роль</dt>
            <dd className="font-medium text-text">{user.role}</dd>
          </div>
          <div>
            <dt className="text-text-muted">ID облікового запису</dt>
            <dd className="font-mono text-xs text-text">{user.id}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
