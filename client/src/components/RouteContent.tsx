import { Component, Suspense, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";

class RouteErrorBoundary extends Component<
  { children: ReactNode; pathname: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(previous: Readonly<{ children: ReactNode; pathname: string }>) {
    if (this.state.failed && previous.pathname !== this.props.pathname) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" className="mx-auto max-w-xl space-y-4 rounded-xl border border-border bg-surface p-6">
          <h1 className="text-xl font-semibold text-text">Не вдалося відкрити сторінку</h1>
          <p className="text-sm text-text-muted">Перевірте підключення до інтернету й оновіть сторінку.</p>
          <button type="button" onClick={() => window.location.reload()}
            className="min-h-11 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700">
            Оновити сторінку
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}

export function RouteContent() {
  const { pathname } = useLocation();
  return (
    <RouteErrorBoundary pathname={pathname}>
      <Suspense fallback={<p role="status" className="py-8 text-text-muted">Завантаження сторінки…</p>}>
        <Outlet />
      </Suspense>
    </RouteErrorBoundary>
  );
}
