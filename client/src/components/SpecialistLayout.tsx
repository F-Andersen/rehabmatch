import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/specialist/dashboard", label: "Огляд", end: true },
  { to: "/specialist/profile", label: "Мій профіль" },
  { to: "/specialist/profile/edit", label: "Редагування" },
  { to: "/specialist/services", label: "Мої послуги" },
  { to: "/specialist/requests", label: "Заявки" },
  { to: "/settings", label: "Налаштування" },
];

function linkClass({ isActive }: { isActive: boolean }) {
  return [
    "block rounded-lg px-3 py-2 text-sm font-medium transition",
    isActive ? "bg-brand-600 text-white" : "text-text-muted hover:bg-surface-tint hover:text-text",
  ].join(" ");
}

export function SpecialistLayout() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 rounded-xl border border-border bg-surface p-4 shadow-sm lg:w-56">
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Кабінет спеціаліста</p>
        <nav className="mt-3 flex flex-col gap-1" aria-label="Меню спеціаліста">
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
