import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest, ApiError } from "../lib/api";
import { useAuth } from "../features/auth/AuthProvider";
import {
  fetchAdminAppointmentRequests,
  createAdminCatalogEntry,
  fetchAdminCatalog,
  fetchAdminCriteria,
  fetchAdminReviews,
  fetchAdminUsers,
  patchAdminCatalogEntry,
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
    appointmentRequests?: {
      total: number;
      byStatus: Record<string, number>;
    };
  };
};

const adminQuickLinks = [
  { to: "/admin/users", label: "Користувачі", hint: "Ролі та активність" },
  { to: "/admin/specialists", label: "Спеціалісти", hint: "Модерація профілів" },
  { to: "/admin/reviews", label: "Відгуки", hint: "Схвалення / відхилення" },
  { to: "/admin/requests", label: "Заявки", hint: "Статуси консультацій" },
  { to: "/admin/dictionaries", label: "Довідники", hint: "Міста, травми, формати" },
  { to: "/admin/criteria", label: "Критерії", hint: "Описи AHP-критеріїв" },
];

export function AdminHomePage() {
  const { user } = useAuth();
  const summaryQuery = useQuery({
    queryKey: ["admin", "summary"],
    queryFn: () => apiRequest<AdminSummary>("/api/v1/admin/summary"),
  });

  const appointments = summaryQuery.data?.data.appointmentRequests;

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-text">Огляд системи</h1>
        <p className="mt-2 text-text-muted">Вітаємо, {user?.fullName}. Дані оновлюються з API адміністратора.</p>
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
          <p className="text-sm text-text-muted">Профілі на модерації</p>
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

      {appointments && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-text">Заявки на консультацію</h2>
          <p className="mt-1 text-sm text-text-muted">Усього: {appointments.total}</p>
          <ul className="mt-4 flex flex-wrap gap-3 text-sm">
            {["REQUESTED", "ACCEPTED", "DECLINED", "CANCELLED"].map((status) => (
              <li key={status} className="rounded-lg bg-surface-tint px-3 py-2">
                <span className="text-text-muted">{status}:</span>{" "}
                <span className="font-semibold text-text">{appointments.byStatus[status] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-text">Швидкі переходи</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {adminQuickLinks.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="block rounded-xl border border-border bg-surface p-4 shadow-sm transition hover:border-brand-600/40"
              >
                <span className="font-medium text-text">{item.label}</span>
                <p className="mt-1 text-sm text-text-muted">{item.hint}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [search, setSearch] = useState("");
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

  const filteredUsers = useMemo(() => {
    const rows = listQuery.data?.data ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (user) =>
        user.fullName.toLowerCase().includes(q) || user.email.toLowerCase().includes(q),
    );
  }, [listQuery.data?.data, search]);

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">Користувачі</h1>
      <input
        type="search"
        placeholder="Пошук за ПІБ або email"
        className="w-full max-w-md rounded-lg border border-border px-3 py-2 text-sm"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
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
        <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
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
            {filteredUsers.map((user) => (
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
        </div>
      )}
      {listQuery.data?.meta && (
        <p className="text-xs text-text-muted">
          Сторінка {listQuery.data.meta.page} · показано {filteredUsers.length} з {listQuery.data.meta.total}
        </p>
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
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-text">Модерація спеціалістів</h1>
        <p className="mt-2 text-sm text-text-muted">
          Перегляд анкет і підтвердження профілів перед публікацією в каталозі.
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
    <section className="space-y-6">
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

const dictionaryTypes = [
  { id: "injury-types", label: "Типи травм" },
  { id: "specializations", label: "Спеціалізації" },
  { id: "cities", label: "Міста" },
  { id: "districts", label: "Райони" },
  { id: "appointment-formats", label: "Формати" },
] as const;

export function AdminDictionariesPage() {
  const queryClient = useQueryClient();
  const [type, setType] = useState<string>("injury-types");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCityId, setNewCityId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["admin", "catalog", type],
    queryFn: () => fetchAdminCatalog(type),
  });

  const citiesQuery = useQuery({
    queryKey: ["admin", "catalog", "cities"],
    queryFn: () => fetchAdminCatalog("cities"),
    enabled: type === "districts",
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminCatalogEntry(type, {
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        cityId: type === "districts" ? newCityId : undefined,
      }),
    onSuccess: async () => {
      setMessage("Запис додано.");
      setNewName("");
      setNewDescription("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "catalog", type] });
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : "Не вдалося створити запис.");
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      patchAdminCatalogEntry(type, id, { name }),
    onSuccess: async () => {
      setMessage("Запис оновлено.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "catalog", type] });
    },
    onError: (error) => {
      setMessage(error instanceof ApiError ? error.message : "Не вдалося оновити запис.");
    },
  });

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">Довідники</h1>
      <p className="text-sm text-text-muted">Перегляд, створення та редагування назв через admin API.</p>
      <div className="flex flex-wrap gap-2">
        {dictionaryTypes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={[
              "rounded-lg px-3 py-1.5 text-sm",
              type === item.id ? "bg-brand-600 text-white" : "border border-border",
            ].join(" ")}
            onClick={() => setType(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <form
        className="rounded-xl border border-border bg-surface p-4 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          if (newName.trim().length < 2) return;
          if (type === "districts" && !newCityId) {
            setMessage("Оберіть місто для району.");
            return;
          }
          createMutation.mutate();
        }}
      >
        <h2 className="text-sm font-semibold text-text">Додати запис</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input
            className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
            placeholder="Назва"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            required
            minLength={2}
          />
          {(type === "injury-types" || type === "specializations") && (
            <input
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
              placeholder="Опис (необовʼязково)"
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
            />
          )}
          {type === "districts" && (
            <select
              className="rounded-lg border border-border px-3 py-2 text-sm"
              value={newCityId}
              onChange={(event) => setNewCityId(event.target.value)}
              required
            >
              <option value="">Місто</option>
              {citiesQuery.data?.map((city) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          )}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Додати
          </button>
        </div>
      </form>

      {message && <p className="text-sm text-text-muted">{message}</p>}

      {listQuery.isLoading ? (
        <p className="text-text-muted">Завантаження…</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {listQuery.data?.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <div>
                <span className="font-medium">{row.name}</span>
                {row.description && <span className="text-text-muted"> — {row.description}</span>}
                {row.city && <span className="text-text-muted"> ({row.city.name})</span>}
              </div>
              <button
                type="button"
                className="text-brand-600 hover:text-brand-700"
                onClick={() => {
                  const next = window.prompt("Нова назва", row.name);
                  if (next && next.trim() !== row.name) {
                    patchMutation.mutate({ id: row.id, name: next.trim() });
                  }
                }}
              >
                Редагувати назву
              </button>
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
    <section className="space-y-6">
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
    <section className="space-y-6">
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
