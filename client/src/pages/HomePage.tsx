import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchHealth } from "../services/api";

type ApiStatus = "loading" | "ok" | "error";

export function HomePage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>("loading");
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchHealth()
      .then((payload) => {
        if (cancelled) return;
        setApiStatus(payload.data.status === "ok" ? "ok" : "error");
        setApiMessage(`API відповіла: status = ${payload.data.status}`);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setApiStatus("error");
        setApiMessage(
          error instanceof Error ? error.message : "Не вдалося підключитися до API",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-brand-600">MVP bootstrap</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Інтелектуальний підбір спеціалістів з реабілітації
        </h1>
        <p className="mt-4 max-w-2xl text-text-muted">
          Локальний каркас застосунку RehabMatch: маршрутизація, базовий UI та перевірка зв&apos;язку
          з backend API.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/specialists"
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Перейти до каталогу (заглушка)
          </Link>
          <Link
            to="/how-it-works"
            className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-text hover:bg-surface-tint"
          >
            Як це працює
          </Link>
        </div>
      </section>

      <section
        className="rounded-xl border border-border bg-surface p-6 shadow-sm"
        aria-live="polite"
      >
        <h2 className="text-lg font-semibold">Стан backend API</h2>
        <p className="mt-2 text-sm text-text-muted">
          Перевірка <code className="rounded bg-surface-tint px-1">GET /api/v1/health</code> через
          Vite proxy.
        </p>
        <p
          className={[
            "mt-4 inline-flex rounded-full px-3 py-1 text-sm font-medium",
            apiStatus === "ok"
              ? "bg-emerald-50 text-success"
              : apiStatus === "error"
                ? "bg-red-50 text-red-700"
                : "bg-surface-tint text-text-muted",
          ].join(" ")}
        >
          {apiStatus === "loading" && "Перевірка…"}
          {apiStatus === "ok" && "Підключено"}
          {apiStatus === "error" && "Помилка підключення"}
        </p>
        {apiMessage ? <p className="mt-3 text-sm text-text-muted">{apiMessage}</p> : null}
      </section>
    </div>
  );
}
