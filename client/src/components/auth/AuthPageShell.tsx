import { Link } from "react-router-dom";

type AuthPageShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthPageShell({ title, subtitle, children, footer }: AuthPageShellProps) {
  return (
    <div className="relative -mx-4 -my-8 min-h-[calc(100vh-8rem)] overflow-hidden bg-gradient-to-br from-[#EAF2FF] via-[#F6F9FF] to-[#DCE9FF] px-4 py-10 sm:-mx-6 sm:px-6">
      <div className="pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full bg-brand-600/10 blur-2xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-56 w-56 rounded-full bg-brand-600/10 blur-2xl" />

      <div className="relative mx-auto flex max-w-lg justify-center">
        <div className="w-full rounded-2xl border border-border bg-surface p-6 shadow-lg sm:p-8">
          <div className="mb-6 text-center">
            <Link to="/" className="text-lg font-bold text-brand-600">RehabMatch</Link>
            <h1 className="mt-4 text-2xl font-semibold text-text">{title}</h1>
            <p className="mt-2 text-sm text-text-muted">{subtitle}</p>
          </div>
          {children}
          {footer ? <div className="mt-6 text-center text-sm text-text-muted">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
