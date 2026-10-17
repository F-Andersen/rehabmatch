import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest, ApiError } from "../lib/api";
import { useAuth } from "../features/auth/AuthProvider";
import { PlaceholderPage } from "../components/PlaceholderPage";
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
  };
};

function adminPlaceholder(title: string) {
  return function AdminSectionPage() {
    return (
      <PlaceholderPage
        title={title}
        description="Розділ адміністративної панелі буде розширено на етапах M3 та M6–M7."
      />
    );
  };
}

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

      <div className="grid gap-4 sm:grid-cols-3">
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
      </div>
    </section>
  );
}

export const AdminUsersPage = adminPlaceholder("Користувачі");
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
export const AdminReviewsPage = adminPlaceholder("Відгуки");
export const AdminDictionariesPage = adminPlaceholder("Довідники");
export const AdminCriteriaPage = adminPlaceholder("Критерії");
export const AdminRequestsPage = adminPlaceholder("Заявки");
