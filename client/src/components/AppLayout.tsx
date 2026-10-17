import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { dashboardPathForRole } from "../lib/role-routes";

const publicLinks = [
  { to: "/", label: "Головна", end: true },
  { to: "/specialists", label: "Пошук спеціалістів" },
  { to: "/about", label: "Про систему" },
  { to: "/how-it-works", label: "Як це працює" },
  { to: "/contacts", label: "Контакти" },
];

function navClassName({ isActive }: { isActive: boolean }) {
  return [
    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-surface-tint text-brand-600" : "text-text-muted hover:text-text",
  ].join(" ");
}

export function AppLayout() {
  const { user, isLoading, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <NavLink to="/" className="text-lg font-bold text-brand-600">
            RehabMatch
          </NavLink>
          <nav className="flex flex-wrap items-center gap-1" aria-label="Головна навігація">
            {publicLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navClassName}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <span className="text-sm text-text-muted">…</span>
            ) : user ? (
              <>
                <NavLink to={dashboardPathForRole(user.role)} className={navClassName}>
                  {user.fullName}
                </NavLink>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-text-muted hover:bg-surface-tint hover:text-text"
                >
                  Вийти
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navClassName}>
                  Увійти
                </NavLink>
                <NavLink
                  to="/register"
                  className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Зареєструватися
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface px-4 py-6 text-center text-sm text-text-muted sm:px-6">
        RehabMatch — демонстраційна система порівняння спеціалістів за визначеними критеріями.
        Не здійснює медичної діагностики та не замінює консультацію кваліфікованого фахівця.
      </footer>
    </div>
  );
}
