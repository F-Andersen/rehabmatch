import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/api";
import { useAuth } from "../features/auth/AuthProvider";
import { PlaceholderPage } from "../components/PlaceholderPage";

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
export const AdminSpecialistsPage = adminPlaceholder("Спеціалісти");
export const AdminReviewsPage = adminPlaceholder("Відгуки");
export const AdminDictionariesPage = adminPlaceholder("Довідники");
export const AdminCriteriaPage = adminPlaceholder("Критерії");
export const AdminRequestsPage = adminPlaceholder("Заявки");
