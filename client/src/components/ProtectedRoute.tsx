import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import type { UserRole } from "../features/auth/types";

type ProtectedRouteProps = {
  children: React.ReactNode;
  roles?: UserRole[];
};

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-text-muted">
        Завантаження сесії…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8">
        <h1 className="text-xl font-semibold text-text">Доступ заборонено</h1>
        <p className="mt-2 text-text-muted">У вашої ролі немає прав для перегляду цієї сторінки.</p>
      </div>
    );
  }

  return children;
}
