import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";
import { dashboardPathForRole } from "../lib/role-routes";

const publicLinks = [
  { to: "/", label: "Головна", end: true },
  { to: "/specialists", label: "Пошук спеціалістів" },
  { to: "/about", label: "Про систему" },
  { to: "/how-it-works", label: "Як це працює" },
  { to: "/contacts", label: "Контакти" },
];

const footerLinks = [
  { to: "/about", label: "Про систему" },
  { to: "/how-it-works", label: "Як це працює" },
  { to: "/contacts", label: "Контакти" },
  { to: "/specialists", label: "Каталог" },
];

function navClassName({ isActive }: { isActive: boolean }) {
  return [
    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-surface-tint text-brand-600" : "text-text-muted hover:text-text",
  ].join(" ");
}

export function AppLayout() {
  const { user, isLoading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <NavLink to="/" className="text-lg font-bold text-brand-600">
            RehabMatch
          </NavLink>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((open) => !open)}
          >
            Меню
          </button>
          <nav
            className="hidden flex-wrap items-center gap-1 lg:flex"
            aria-label="Головна навігація"
          >
            {publicLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={navClassName}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
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
        {mobileOpen && (
          <div id="mobile-nav" className="border-t border-border px-4 py-4 lg:hidden">
            <nav className="flex flex-col gap-1" aria-label="Мобільна навігація">
              {publicLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={navClassName}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              {user ? (
                <>
                  <NavLink to={dashboardPathForRole(user.role)} className={navClassName} onClick={() => setMobileOpen(false)}>
                    {user.fullName}
                  </NavLink>
                  <button
                    type="button"
                    className="rounded-lg px-3 py-2 text-left text-sm text-text-muted"
                    onClick={() => {
                      setMobileOpen(false);
                      void logout();
                    }}
                  >
                    Вийти
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className={navClassName} onClick={() => setMobileOpen(false)}>
                    Увійти
                  </NavLink>
                  <NavLink to="/register" className={navClassName} onClick={() => setMobileOpen(false)}>
                    Зареєструватися
                  </NavLink>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
            <div>
              <p className="font-bold text-brand-600">RehabMatch</p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-muted">
                Навчальна система порівняння спеціалістів реабілітації за визначеними критеріями. Не здійснює
                медичної діагностики та не замінює консультацію кваліфікованого фахівця.
              </p>
            </div>
            <nav className="flex flex-col gap-2 text-sm" aria-label="Посилання в підвалі">
              {footerLinks.map((link) => (
                <Link key={link.to} to={link.to} className="text-text-muted hover:text-brand-600">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <p className="mt-8 border-t border-border pt-6 text-center text-xs text-text-muted">
            Дані профілів у демонстраційних базах є синтетичними. © {new Date().getFullYear()} RehabMatch (навчальний
            проєкт).
          </p>
        </div>
      </footer>
    </div>
  );
}
