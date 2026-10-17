import { useAuth } from "../features/auth/AuthProvider";
import { PlaceholderPage } from "../components/PlaceholderPage";

export function SpecialistDashboardPage() {
  const { user } = useAuth();

  return (
    <section className="rounded-xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-text">Кабінет спеціаліста</h1>
      <p className="mt-3 text-text-muted">
        Вітаємо, {user?.fullName}. Статус модерації:{" "}
        <strong>{user?.specialistVerificationStatus ?? "—"}</strong>.
      </p>
      <p className="mt-2 text-sm text-text-muted">
        Повне редагування анкети та публічний каталог будуть на етапі M3.
      </p>
    </section>
  );
}

export function SpecialistProfileEditPage() {
  return (
    <PlaceholderPage
      title="Редагування профілю"
      description="Редагування анкети спеціаліста — етап M3."
    />
  );
}

export function SpecialistRequestsPage() {
  return (
    <PlaceholderPage
      title="Заявки на консультацію"
      description="Обробка заявок спеціалістом — етап M6."
    />
  );
}
