import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, ApiError } from "../lib/api";
import { useAuth } from "../features/auth/AuthProvider";
import {
  fetchAdminAppointmentRequests,
  fetchAdminCatalog,
  fetchAdminCriteria,
  fetchAdminReviews,
  fetchAdminUsers,
  patchAdminCriterion,
  patchAdminReviewStatus,
  patchAdminUserStatus,
} from "../features/reviews-requests/api";
import {
  fetchAdminSpecialistById,
  fetchAdminSpecialists,
  patchSpecialistVerification,
} from "../features/specialists/api";

type AdminSummary = {
  data: {
    users: number;
    specialists: number;
    pendingSpecialists: number;
    pendingReviews: number;
  };
};

export function AdminHomePage() {
  const { user } = useAuth();
  const summaryQuery = useQuery({
    queryKey: ["admin", "summary"],
    queryFn: () => apiRequest<AdminSummary>("/api/v1/admin/summary"),
  });

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-text">Панель адміністратора</h1>
        <p className="mt-2 text-text-muted">Вітаємо, {user?.fullName}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm text-text-muted">Користувачі</p>
          <p className="mt-1 text-2xl font-semibold text-text">
            {summaryQuery.data?.data.users ?? "…"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm text-text-muted">Спеціалісти</p>
          <p className="mt-1 text-2xl font-semibold text-text">
            {summaryQuery.data?.data.specialists ?? "…"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm text-text-muted">Очікують модерації</p>
          <p className="mt-1 text-2xl font-semibold text-text">
            {summaryQuery.data?.data.pendingSpecialists ?? "…"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm text-text-muted">Відгуки на модерації</p>
          <p className="mt-1 text-2xl font-semibold text-text">
            {summaryQuery.data?.data.pendingReviews ?? "…"}
          </p>
        </div>
      </div>
    </section>
  );
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["admin", "users", roleFilter, activeFilter],
    queryFn: () =>
      fetchAdminUsers({
        page: "1",
        pageSize: "50",
        role: roleFilter || undefined,
        isActive: activeFilter || undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      patchAdminUserStatus(id, isActive),
    onSuccess: async () => {
      setMessage("Статус користувача оновлено.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : "Помилка оновлення.");
    },
  });

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-text">Користувачі</h1>
      <div className="flex flex-wrap gap-2">
        {["", "PATIENT", "SPECIALIST", "ADMIN"].map((role) => (
          <button
            key={role || "all-roles"}
            type="button"
            className={[
              "rounded-lg px-3 py-1.5 text-sm",
              roleFilter === role ? "bg-brand-600 text-white" : "border border-border",
            ].join(" ")}
            onClick={() => setRoleFilter(role)}
          >
            {role || "Усі ролі"}
          </button>
        ))}
        {["", "true", "false"].map((value) => (
          <button
            key={`active-${value}`}
            type="button"
            className={[
              "rounded-lg px-3 py-1.5 text-sm",
              activeFilter === value ? "bg-brand-600 text-white" : "border border-border",
            ].join(" ")}
            onClick={() => setActiveFilter(value)}
          >
            {value === "" ? "Усі статуси" : value === "true" ? "Активні" : "Деактивовані"}
          </button>
        ))}
      </div>
      {message && <p className="text-sm text-text-muted">{message}</p>}
      {listQuery.isLoading ? (
        <p className="text-text-muted">Завантаження…</p>
      ) : (
        <table className="w-full overflow-hidden rounded-xl border border-border text-left text-sm">
          <thead className="bg-surface-tint text-text-muted">
            <tr>
              <th className="px-4 py-3">ПІБ</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Роль</th>
              <th className="px-4 py-3">Активний</th>
              <th className="px-4 py-3">Дії</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.data?.data.map((user) => (
              <tr key={user.id} className="border-t border-border">
                <td className="px-4 py-3">{user.fullName}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">{user.isActive ? "Так" : "Ні"}</td>
                <td className="px-4 py-3">
                  {user.role !== "ADMIN" && (
                    <button
                      type="button"
                      className="text-brand-600 hover:text-brand-700"
                      onClick={() =>
                        statusMutation.mutate({ id: user.id, isActive: !user.isActive })
                      }
                    >
                      {user.isActive ? "Деактивувати" : "Активувати"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
export function AdminSpecialistsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogAction, setDialogAction] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["admin", "specialists", statusFilter],
    queryFn: () =>
      fetchAdminSpecialists({
        status: statusFilter || undefined,
        page: "1",
        pageSize: "50",
      }),
  });

  const detailQuery = useQuery({
    queryKey: ["admin", "specialist", selectedId],
    queryFn: () => fetchAdminSpecialistById(selectedId!),
    enabled: Boolean(selectedId),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) =>
      patchSpecialistVerification(id, status),
    onSuccess: async () => {
      setActionMessage("Статус оновлено.");
      setDialogAction(null);
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      if (selectedId) {
        await queryClient.invalidateQueries({ queryKey: ["admin", "specialist", selectedId] });
      }
    },
    onError: (error) => {
      if (error instanceof ApiError) setActionMessage(error.message);
      else setActionMessage("Не вдалося оновити статус.");
      setDialogAction(null);
    },
  });

  const selectedRow = listQuery.data?.data.find((row) => row.id === selectedId);

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-text">Модерація спеціалістів</h1>
        <p className="mt-2 text-sm text-text-muted">
          Перегляд анкет і підтвердження профілів (M3).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["PENDING", "APPROVED", "REJECTED", ""].map((value) => (
            <button
              key={value || "all"}
              type="button"
              className={[
                "rounded-lg px-3 py-1.5 text-sm font-medium",
                statusFilter === value
                  ? "bg-brand-600 text-white"
                  : "border border-border text-text-muted hover:bg-surface-tint",
              ].join(" ")}
              onClick={() => {
                setStatusFilter(value);
                setSelectedId(null);
              }}
            >
              {value === "" ? "Усі" : value}
            </button>
          ))}
        </div>
      </div>

      {actionMessage && (
        <p className="rounded-lg border border-border bg-surface-tint px-4 py-2 text-sm">{actionMessage}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          {listQuery.isLoading ? (
            <p className="p-6 text-text-muted">Завантаження…</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-tint text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">ПІБ</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium">Місто</th>
                </tr>
              </thead>
              <tbody>
                {listQuery.data?.data.map((row) => (
                  <tr
                    key={row.id}
                    className={[
                      "cursor-pointer border-b border-border hover:bg-surface-tint/50",
                      selectedId === row.id ? "bg-surface-tint" : "",
                    ].join(" ")}
                    onClick={() => setSelectedId(row.id)}
                  >
                    <td className="px-4 py-3">{row.fullName}</td>
                    <td className="px-4 py-3">{row.verificationStatus}</td>
                    <td className="px-4 py-3">{row.city?.name ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          {!selectedId ? (
            <p className="text-text-muted">Оберіть спеціаліста з таблиці.</p>
          ) : detailQuery.isLoading ? (
            <p className="text-text-muted">Завантаження деталей…</p>
          ) : detailQuery.data ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{detailQuery.data.fullName}</h2>
              <p className="text-sm text-text-muted">
                Статус: <strong>{detailQuery.data.verificationStatus}</strong>
              </p>
              <p className="text-sm text-text-muted whitespace-pre-wrap">
                {detailQuery.data.description || "Опис відсутній"}
              </p>
              <p className="text-sm">
                Ціна: {detailQuery.data.pricePerSession} грн · Досвід: {detailQuery.data.experienceYears} р.
              </p>
              <p className="text-sm text-text-muted">
                {detailQuery.data.city?.name ?? "Місто не вказано"}
                {detailQuery.data.district ? `, ${detailQuery.data.district.name}` : ""}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white"
                  onClick={() => setDialogAction("APPROVED")}
                >
                  Підтвердити
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700"
                  onClick={() => setDialogAction("REJECTED")}
                >
                  Відхилити
                </button>
              </div>
            </div>
          ) : (
            <p className="text-text-muted">Деталі недоступні.</p>
          )}
        </div>
      </div>

      {dialogAction && selectedRow && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-md rounded-xl bg-surface p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-text">Підтвердити дію?</h3>
            <p className="mt-2 text-sm text-text-muted">
              {dialogAction === "APPROVED"
                ? `Підтвердити профіль ${selectedRow.fullName}?`
                : `Відхилити профіль ${selectedRow.fullName}?`}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-border px-4 py-2 text-sm"
                onClick={() => setDialogAction(null)}
              >
                Скасувати
              </button>
              <button
                type="button"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
                onClick={() =>
                  verifyMutation.mutate({ id: selectedRow.id, status: dialogAction })
                }
              >
                Так, продовжити
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
export function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [message, setMessage] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["admin", "reviews", statusFilter],
    queryFn: () =>
      fetchAdminReviews({
        page: "1",
        pageSize: "50",
        status: statusFilter || undefined,
      }),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APPROVED" | "REJECTED" }) =>
      patchAdminReviewStatus(id, status),
    onSuccess: async () => {
      setMessage("Статус відгуку оновлено, рейтинг перераховано.");
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : "Помилка модерації.");
    },
  });

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-text">Модерація відгуків</h1>
      <div className="flex flex-wrap gap-2">
        {["PENDING", "APPROVED", "REJECTED"].map((status) => (
          <button
            key={status}
            type="button"
            className={[
              "rounded-lg px-3 py-1.5 text-sm",
              statusFilter === status ? "bg-brand-600 text-white" : "border border-border",
            ].join(" ")}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>
      {message && <p className="text-sm text-text-muted">{message}</p>}
      {listQuery.isLoading ? (
        <p className="text-text-muted">Завантаження…</p>
      ) : (
        <ul className="space-y-3">
          {listQuery.data?.data.map((review) => (
            <li key={review.id} className="rounded-xl border border-border bg-surface p-4">
              <p className="font-medium">
                {review.patientName} → {review.specialistName} · {review.rating}/5
              </p>
              <p className="mt-2 text-sm text-text-muted">{review.comment}</p>
              <p className="mt-1 text-xs text-text-muted">
                {new Date(review.createdAt).toLocaleString("uk-UA")} · {review.status}
              </p>
              {review.status === "PENDING" && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-success px-3 py-1.5 text-sm text-white"
                    onClick={() => moderateMutation.mutate({ id: review.id, status: "APPROVED" })}
                  >
                    Схвалити
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700"
                    onClick={() => moderateMutation.mutate({ id: review.id, status: "REJECTED" })}
                  >
                    Відхилити
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AdminDictionariesPage() {
  const [type, setType] = useState("injury-types");
  const listQuery = useQuery({
    queryKey: ["admin", "catalog", type],
    queryFn: () => fetchAdminCatalog(type),
  });

  const types = [
    "injury-types",
    "specializations",
    "cities",
    "districts",
    "appointment-formats",
  ];

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-text">Довідники</h1>
      <p className="text-sm text-text-muted">Перегляд довідникових значень MVP (без небезпечного видалення).</p>
      <div className="flex flex-wrap gap-2">
        {types.map((value) => (
          <button
            key={value}
            type="button"
            className={[
              "rounded-lg px-3 py-1.5 text-sm",
              type === value ? "bg-brand-600 text-white" : "border border-border",
            ].join(" ")}
            onClick={() => setType(value)}
          >
            {value}
          </button>
        ))}
      </div>
      {listQuery.isLoading ? (
        <p className="text-text-muted">Завантаження…</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {listQuery.data?.map((row) => (
            <li key={row.id} className="px-4 py-3 text-sm">
              <span className="font-medium">{row.name}</span>
              {row.description && <span className="text-text-muted"> — {row.description}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AdminCriteriaPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const listQuery = useQuery({
    queryKey: ["admin", "criteria"],
    queryFn: fetchAdminCriteria,
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, description }: { id: string; description: string }) =>
      patchAdminCriterion(id, { description }),
    onSuccess: async () => {
      setMessage("Опис критерію оновлено.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "criteria"] });
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : "Помилка збереження.");
    },
  });

  return (
    <section className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-text">Критерії підбору</h1>
      <p className="text-sm text-text-muted">
        П’ять ключів алгоритму AHP не змінюються; доступне лише оновлення опису.
      </p>
      {message && <p className="text-sm text-text-muted">{message}</p>}
      {listQuery.isLoading ? (
        <p className="text-text-muted">Завантаження…</p>
      ) : (
        <ul className="space-y-4">
          {listQuery.data?.map((criterion) => (
            <li key={criterion.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">{criterion.name} ({criterion.key})</p>
              <textarea
                className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm"
                rows={2}
                defaultValue={criterion.description ?? ""}
                onBlur={(event) => {
                  const value = event.target.value.trim();
                  if (value !== (criterion.description ?? "")) {
                    patchMutation.mutate({ id: criterion.id, description: value });
                  }
                }}
              />
              <p className="mt-1 text-xs text-text-muted">
                Активний: {criterion.isActive ? "так" : "ні"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AdminRequestsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const listQuery = useQuery({
    queryKey: ["admin", "appointment-requests", statusFilter],
    queryFn: () =>
      fetchAdminAppointmentRequests({
        page: "1",
        pageSize: "50",
        status: statusFilter || undefined,
      }),
  });

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold text-text">Заявки на консультацію</h1>
      <div className="flex flex-wrap gap-2">
        {["", "REQUESTED", "ACCEPTED", "DECLINED", "CANCELLED"].map((status) => (
          <button
            key={status || "all"}
            type="button"
            className={[
              "rounded-lg px-3 py-1.5 text-sm",
              statusFilter === status ? "bg-brand-600 text-white" : "border border-border",
            ].join(" ")}
            onClick={() => setStatusFilter(status)}
          >
            {status || "Усі"}
          </button>
        ))}
      </div>
      {listQuery.isLoading ? (
        <p className="text-text-muted">Завантаження…</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-text-muted">
            <tr>
              <th className="py-2">Пацієнт</th>
              <th className="py-2">Спеціаліст</th>
              <th className="py-2">Статус</th>
              <th className="py-2">Створено</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.data?.data.map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="py-2">{row.patientName}</td>
                <td className="py-2">{row.specialistName}</td>
                <td className="py-2">{row.status}</td>
                <td className="py-2">{new Date(row.createdAt).toLocaleString("uk-UA")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
