import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Огляд", end: true },
  { to: "/profile", label: "Мій профіль" },
  { to: "/specialists", label: "Пошук спеціалістів" },
  { to: "/matching/new", label: "Персоналізований підбір" },
  { to: "/recommendations", label: "Історія рекомендацій" },
  { to: "/my-requests", label: "Мої заявки" },
  { to: "/my-reviews", label: "Мої відгуки" },
  { to: "/settings", label: "Налаштування" },
];

function linkClass({ isActive }: { isActive: boolean }) {
  return [
    "block rounded-lg px-3 py-2 text-sm font-medium transition",
    isActive ? "bg-brand-600 text-white" : "text-text-muted hover:bg-surface-tint hover:text-text",
  ].join(" ");
}

export function PatientLayout() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 rounded-xl border border-border bg-surface p-4 shadow-sm lg:w-56">
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Кабінет пацієнта</p>
        <nav className="mt-3 flex flex-col gap-1" aria-label="Меню пацієнта">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
