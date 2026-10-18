import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";

const adminLinks = [
  { to: "/admin", label: "Огляд", end: true },
  { to: "/admin/users", label: "Користувачі" },
  { to: "/admin/specialists", label: "Спеціалісти" },
  { to: "/admin/reviews", label: "Відгуки" },
  { to: "/admin/requests", label: "Заявки" },
  { to: "/admin/dictionaries", label: "Довідники" },
  { to: "/admin/criteria", label: "Критерії" },
];

function linkClass({ isActive }: { isActive: boolean }) {
  return [
    "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive ? "bg-brand-600 text-white" : "text-text-muted hover:bg-surface-tint hover:text-text",
  ].join(" ");
}

export function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 rounded-xl border border-border bg-surface p-4 shadow-sm lg:sticky lg:top-4 lg:w-56">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Адміністрування</p>
        <p className="mt-1 text-sm font-medium text-text">{user?.fullName}</p>
        <nav className="mt-4 flex flex-wrap gap-1 lg:flex-col" aria-label="Адмін-меню">
          {adminLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/" className="mt-4 block text-sm text-brand-600 hover:text-brand-700">
          ← На сайт
        </NavLink>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
