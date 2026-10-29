import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../features/auth/AuthProvider";
import {
  createConsultationRequest,
  fetchMyReviewForSpecialist,
  submitSpecialistReview,
} from "../features/reviews-requests/api";
import {
  fetchCatalogDictionaries,
  fetchSpecialistById,
  fetchSpecialistReviews,
  fetchSpecialistsList,
} from "../features/specialists/api";
import type { SpecialistCard, SpecialistsSort } from "../features/specialists/types";
import { ApiError } from "../lib/api";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

function SpecialistAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={`Фото спеціаліста ${name}`}
        className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-surface-tint shadow-sm"
      />
    );
  }
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface-tint text-lg font-semibold text-brand-600"
      aria-hidden
    >
      {initials || "?"}
    </div>
  );
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(value);
}

function RatingStars({ value, count }: { value: number; count: number }) {
  if (count === 0) {
    return <span className="text-sm text-text-muted">Ще немає відгуків</span>;
  }
  return (
    <span className="text-sm text-text">
      <span className="font-medium text-brand-600">{value.toFixed(1)}</span>
      <span className="text-text-muted"> ({count})</span>
    </span>
  );
}

function SpecialistCardView({ specialist }: { specialist: SpecialistCard }) {
  const location = [specialist.city?.name, specialist.district?.name].filter(Boolean).join(", ");
  const specialization = specialist.specializations.map((s) => s.name).join(", ");

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm transition hover:border-brand-600/30 hover:shadow-md sm:flex-row sm:items-start">
      <SpecialistAvatar name={specialist.fullName} photoUrl={specialist.photoUrl} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-text">{specialist.fullName}</h2>
            <p className="text-sm text-text-muted">{specialization || "Спеціалізація не вказана"}</p>
          </div>
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            Перевірено
          </span>
        </div>
        <p className="text-sm text-text-muted">
          Досвід: {specialist.experienceYears} р. · {location || "Локація не вказана"}
        </p>
        <p className="text-sm text-text-muted">
          Формат: {specialist.formats.map((f) => f.name).join(", ") || "—"}
          {specialist.inclusiveSpace ? " · Інклюзивний простір" : ""}
        </p>
        <RatingStars value={specialist.ratingAvg} count={specialist.ratingCount} />
        <p className="text-base font-semibold text-text">{formatPrice(specialist.pricePerSession)}</p>
        <Link
          to={`/specialists/${specialist.id}`}
          className="inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Переглянути профіль
        </Link>
      </div>
    </article>
  );
}

export function SpecialistsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = useMemo(
    () => ({
      q: searchParams.get("q") ?? "",
      specializationId: searchParams.get("specializationId") ?? "",
      injuryTypeId: searchParams.get("injuryTypeId") ?? "",
      cityId: searchParams.get("cityId") ?? "",
      districtId: searchParams.get("districtId") ?? "",
      formatId: searchParams.get("formatId") ?? "",
      maxBudget: searchParams.get("maxBudget") ?? "",
      inclusiveOnly: searchParams.get("inclusiveOnly") ?? "",
      sort: (searchParams.get("sort") as SpecialistsSort) || "rating_desc",
      page: searchParams.get("page") ?? "1",
      pageSize: searchParams.get("pageSize") ?? "10",
    }),
    [searchParams],
  );

  const catalogQuery = useQuery({
    queryKey: ["catalog"],
    queryFn: fetchCatalogDictionaries,
  });

  const listQuery = useQuery({
    queryKey: ["specialists", filters],
    queryFn: () =>
      fetchSpecialistsList({
        q: filters.q || undefined,
        specializationId: filters.specializationId || undefined,
        injuryTypeId: filters.injuryTypeId || undefined,
        cityId: filters.cityId || undefined,
        districtId: filters.districtId || undefined,
        formatId: filters.formatId || undefined,
        maxBudget: filters.maxBudget || undefined,
        inclusiveOnly: filters.inclusiveOnly === "true" ? "true" : undefined,
        sort: filters.sort,
        page: filters.page,
        pageSize: filters.pageSize,
      }),
  });

  const districtsForCity = useMemo(() => {
    if (!filters.cityId || !catalogQuery.data) return [];
    return catalogQuery.data.districts.filter((d) => d.cityId === filters.cityId);
  }, [catalogQuery.data, filters.cityId]);

  function patchParams(patch: Record<string, string>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    if (!patch.page) next.set("page", "1");
    setSearchParams(next);
  }

  function onFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    patchParams({
      q: String(form.get("q") ?? ""),
      specializationId: String(form.get("specializationId") ?? ""),
      injuryTypeId: String(form.get("injuryTypeId") ?? ""),
      cityId: String(form.get("cityId") ?? ""),
      districtId: String(form.get("districtId") ?? ""),
      formatId: String(form.get("formatId") ?? ""),
      maxBudget: String(form.get("maxBudget") ?? ""),
      inclusiveOnly: form.get("inclusiveOnly") === "on" ? "true" : "",
      sort: String(form.get("sort") ?? "rating_desc"),
      page: "1",
    });
    setMobileFiltersOpen(false);
  }

  const meta = listQuery.data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const currentPage = meta?.page ?? 1;

  const filtersPanel = (
    <form className="space-y-4" onSubmit={onFilterSubmit}>
      <div>
        <label htmlFor="q" className="mb-1 block text-sm font-medium text-text">Пошук</label>
        <input id="q" name="q" className={inputClass} defaultValue={filters.q} key={`q-${filters.q}`} />
      </div>
      <div>
        <label htmlFor="specializationId" className="mb-1 block text-sm font-medium text-text">
          Спеціалізація
        </label>
        <select id="specializationId" name="specializationId" className={inputClass} defaultValue={filters.specializationId}>
          <option value="">Усі</option>
          {catalogQuery.data?.specializations.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="injuryTypeId" className="mb-1 block text-sm font-medium text-text">
          Тип травми / захворювання
        </label>
        <select id="injuryTypeId" name="injuryTypeId" className={inputClass} defaultValue={filters.injuryTypeId}>
          <option value="">Усі</option>
          {catalogQuery.data?.injuryTypes.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="cityId" className="mb-1 block text-sm font-medium text-text">Місто</label>
        <select id="cityId" name="cityId" className={inputClass} defaultValue={filters.cityId}>
          <option value="">Усі</option>
          {catalogQuery.data?.cities.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="districtId" className="mb-1 block text-sm font-medium text-text">Район</label>
        <select id="districtId" name="districtId" className={inputClass} defaultValue={filters.districtId}>
          <option value="">Усі</option>
          {districtsForCity.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="formatId" className="mb-1 block text-sm font-medium text-text">Формат прийому</label>
        <select id="formatId" name="formatId" className={inputClass} defaultValue={filters.formatId}>
          <option value="">Усі</option>
          {catalogQuery.data?.formats.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="maxBudget" className="mb-1 block text-sm font-medium text-text">
          Макс. бюджет (грн)
        </label>
        <input
          id="maxBudget"
          name="maxBudget"
          type="number"
          min={0}
          className={inputClass}
          defaultValue={filters.maxBudget}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          name="inclusiveOnly"
          defaultChecked={filters.inclusiveOnly === "true"}
          className="rounded border-border"
        />
        Лише інклюзивний простір
      </label>
      <div>
        <label htmlFor="sort" className="mb-1 block text-sm font-medium text-text">Сортування</label>
        <select id="sort" name="sort" className={inputClass} defaultValue={filters.sort}>
          <option value="rating_desc">За рейтингом</option>
          <option value="price_asc">Ціна: зростання</option>
          <option value="price_desc">Ціна: спадання</option>
          <option value="experience_desc">Досвід: більше</option>
          <option value="experience_asc">Досвід: менше</option>
          <option value="newest">Нові</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Застосувати фільтри
      </button>
      <button
        type="button"
        className="w-full rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-tint"
        onClick={() => setSearchParams(new URLSearchParams())}
      >
        Скинути
      </button>
    </form>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold text-text">Пошук спеціалістів</h1>
        <p className="mt-2 text-text-muted">
          Оберіть фахівця з реабілітації за спеціалізацією, локацією та бюджетом.
        </p>
      </header>

      <div className="mb-4 lg:hidden">
        <button
          type="button"
          className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium"
          onClick={() => setMobileFiltersOpen((open) => !open)}
        >
          {mobileFiltersOpen ? "Сховати фільтри" : "Показати фільтри"}
        </button>
        {mobileFiltersOpen && (
          <div className="mt-4 rounded-xl border border-border bg-surface p-4">{filtersPanel}</div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">Фільтри</h2>
            {filtersPanel}
          </div>
        </aside>

        <section className="space-y-4">
          {catalogQuery.isLoading || listQuery.isLoading ? (
            <ul className="space-y-4" aria-busy="true" aria-label="Завантаження">
              {[1, 2, 3].map((i) => (
                <li key={i} className="animate-pulse rounded-xl border border-border bg-surface p-5">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 rounded-full bg-surface-tint" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 rounded bg-surface-tint" />
                      <div className="h-3 w-2/3 rounded bg-surface-tint" />
                      <div className="h-3 w-1/4 rounded bg-surface-tint" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : listQuery.isError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Не вдалося завантажити список. Спробуйте оновити сторінку.
            </p>
          ) : listQuery.data?.data.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface px-6 py-12 text-center text-text-muted">
              За вашими критеріями спеціалістів не знайдено. Спробуйте змінити фільтри.
            </p>
          ) : (
            listQuery.data?.data.map((specialist) => (
              <SpecialistCardView key={specialist.id} specialist={specialist} />
            ))
          )}

          {meta && meta.total > 0 && (
            <nav className="flex flex-wrap items-center justify-between gap-3 pt-4" aria-label="Пагінація">
              <p className="text-sm text-text-muted">
                Сторінка {currentPage} з {totalPages} · всього {meta.total}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40"
                  onClick={() => patchParams({ page: String(currentPage - 1) })}
                >
                  Назад
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40"
                  onClick={() => patchParams({ page: String(currentPage + 1) })}
                >
                  Далі
                </button>
              </div>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}

const reviewFormSchema = z.object({
  rating: z.coerce.number().int().min(1, "Оберіть оцінку").max(5),
  comment: z.string().trim().min(3, "Мінімум 3 символи").max(2000),
});

const consultationFormSchema = z.object({
  preferredAt: z.string().min(1, "Оберіть бажану дату"),
  note: z.string().trim().max(500).optional(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;
type ConsultationFormValues = z.infer<typeof consultationFormSchema>;

function SpecialistReviewSection({ specialistId }: { specialistId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const ownReviewQuery = useQuery({
    queryKey: ["specialist", specialistId, "my-review"],
    queryFn: () => fetchMyReviewForSpecialist(specialistId),
    enabled: user?.role === "PATIENT",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.input<typeof reviewFormSchema>, undefined, ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: { rating: 5, comment: "" },
  });

  useEffect(() => {
    if (ownReviewQuery.data) {
      reset({
        rating: ownReviewQuery.data.rating,
        comment: ownReviewQuery.data.comment,
      });
    }
  }, [ownReviewQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: ReviewFormValues) => submitSpecialistReview(specialistId, values),
    onSuccess: async (data) => {
      setError(null);
      setMessage(data.message ?? "Відгук надіслано на модерацію.");
      setEditing(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["specialist", specialistId] }),
        queryClient.invalidateQueries({ queryKey: ["patient", "reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["specialists"] }),
        queryClient.invalidateQueries({ queryKey: ["home", "specialists"] }),
      ]);
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiError ? err.message : "Не вдалося надіслати відгук.");
    },
  });

  if (!user) {
    return (
      <p className="mt-3 text-sm text-text-muted">
        <Link to="/login" className="text-brand-600 hover:text-brand-700">Увійдіть</Link>, щоб
        залишити відгук.
      </p>
    );
  }

  if (user.role !== "PATIENT") {
    return <p className="mt-3 text-sm text-text-muted">Відгуки можуть залишати лише пацієнти.</p>;
  }

  const own = ownReviewQuery.data;
  if (ownReviewQuery.isPending) return <p className="mt-3 text-sm text-text-muted">Завантаження вашого відгуку…</p>;
  if (ownReviewQuery.isError) return (
    <div role="alert" className="mt-3 text-sm text-red-700">
      <p>Не вдалося завантажити ваш відгук.</p>
      <button type="button" className="underline" onClick={() => ownReviewQuery.refetch()}>Спробувати ще раз</button>
    </div>
  );
  if (own?.status === "PENDING" && !editing) {
    return (
      <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Ваш відгук очікує модерації. Після схвалення він зʼявиться в списку нижче.
        <button type="button" className="mt-2 block underline" onClick={() => setEditing(true)}>Редагувати відгук</button>
      </p>
    );
  }

  if (own?.status === "APPROVED" && !editing) {
    return (
      <p className="mt-3 rounded-lg border border-border bg-surface-tint px-3 py-2 text-sm text-text-muted">
        Ваш відгук опубліковано. Після редагування він повторно пройде модерацію.
        <button type="button" className="mt-2 block text-brand-600 underline" onClick={() => setEditing(true)}>Редагувати відгук</button>
      </p>
    );
  }

  return (
    <form
      className="mt-4 space-y-3 rounded-lg border border-border bg-surface-tint/40 p-4"
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      noValidate
    >
      <h3 className="text-sm font-semibold text-text">{own ? "Редагувати відгук" : "Залишити відгук"}</h3>
      {own?.status === "APPROVED" && <p className="text-sm text-text-muted">Після збереження відгук і його оцінка будуть приховані до повторного схвалення.</p>}
      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div>
        <label htmlFor="rating" className="mb-1 block text-sm font-medium">Оцінка</label>
        <select id="rating" className={inputClass} {...register("rating")}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} зірок</option>
          ))}
        </select>
        {errors.rating && <p className="mt-1 text-xs text-red-600">{errors.rating.message}</p>}
      </div>
      <div>
        <label htmlFor="comment" className="mb-1 block text-sm font-medium">Коментар</label>
        <textarea id="comment" rows={4} className={inputClass} {...register("comment")} />
        {errors.comment && <p className="mt-1 text-xs text-red-600">{errors.comment.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting || mutation.isPending}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {mutation.isPending ? "Надсилання…" : own ? "Оновити відгук" : "Надіслати відгук"}
      </button>
      {editing && <button type="button" className="ml-3 text-sm underline" onClick={() => { reset({ rating: own!.rating, comment: own!.comment }); setEditing(false); }}>Скасувати редагування</button>}
    </form>
  );
}

function ConsultationRequestSection({
  specialistId,
  specialistName,
}: {
  specialistId: string;
  specialistName: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConsultationFormValues>({
    resolver: zodResolver(consultationFormSchema),
    defaultValues: { preferredAt: "", note: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: ConsultationFormValues) => {
      const preferredAt = new Date(values.preferredAt).toISOString();
      return createConsultationRequest({
        specialistId,
        preferredAt,
        note: values.note || undefined,
      });
    },
    onSuccess: () => {
      setError(null);
      setResult("Запит надіслано. Спеціаліст розгляне його найближчим часом.");
      reset();
      setOpen(false);
    },
    onError: (err) => {
      setResult(null);
      setError(err instanceof ApiError ? err.message : "Не вдалося надіслати запит.");
    },
  });

  if (!user) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-surface-tint/30 p-4">
        <p className="text-sm text-text-muted">
          Щоб надіслати запит на консультацію,{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">увійдіть</Link>{" "}
          як пацієнт.
        </p>
      </div>
    );
  }

  if (user.role !== "PATIENT") {
    return null;
  }

  return (
    <section className="mt-8 rounded-lg border border-border p-4">
      <h2 className="text-lg font-semibold text-text">Запит на консультацію</h2>
      <p className="mt-1 text-sm text-text-muted">
        Це не підтверджений запис — лише звернення до спеціаліста {specialistName}.
      </p>
      {result && <p className="mt-3 text-sm text-success">{result}</p>}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          onClick={() => setOpen(true)}
        >
          Надіслати запит на консультацію
        </button>
        <Link
          to="/my-requests"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text hover:bg-surface-tint"
        >
          Мої заявки
        </Link>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consultation-dialog-title"
        >
          <form
            className="w-full max-w-md rounded-xl bg-surface p-6 shadow-lg"
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
            noValidate
          >
            <h3 id="consultation-dialog-title" className="text-lg font-semibold text-text">
              Запит на консультацію
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="preferredAt" className="mb-1 block text-sm font-medium">
                  Бажана дата та час
                </label>
                <input
                  id="preferredAt"
                  type="datetime-local"
                  className={inputClass}
                  {...register("preferredAt")}
                />
                {errors.preferredAt && (
                  <p className="mt-1 text-xs text-red-600">{errors.preferredAt.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="note" className="mb-1 block text-sm font-medium">
                  Коротке повідомлення (необовʼязково)
                </label>
                <textarea id="note" rows={3} className={inputClass} {...register("note")} />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-border px-4 py-2 text-sm"
                onClick={() => setOpen(false)}
              >
                Скасувати
              </button>
              <button
                type="submit"
                disabled={isSubmitting || mutation.isPending}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {mutation.isPending ? "Надсилання…" : "Надіслати"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function verificationLabel(status: string) {
  switch (status) {
    case "APPROVED":
      return { text: "Підтверджено", className: "bg-success/10 text-success" };
    case "PENDING":
      return { text: "На перевірці", className: "bg-amber-100 text-amber-800" };
    case "REJECTED":
      return { text: "Відхилено", className: "bg-red-100 text-red-800" };
    default:
      return { text: status, className: "bg-surface-tint text-text-muted" };
  }
}

export function SpecialistDetailPage() {
  const { id } = useParams();
  const profileQuery = useQuery({
    queryKey: ["specialist", id],
    queryFn: () => fetchSpecialistById(id!),
    enabled: Boolean(id),
  });
  const reviewsQuery = useQuery({
    queryKey: ["specialist", id, "reviews"],
    queryFn: () => fetchSpecialistReviews(id!),
    enabled: Boolean(id),
  });

  if (!id) {
    return <p className="p-8 text-text-muted">Невірний ідентифікатор.</p>;
  }

  if (profileQuery.isLoading) {
    return <p className="mx-auto max-w-4xl px-4 py-12 text-text-muted">Завантаження профілю…</p>;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="rounded-lg border border-border bg-surface px-4 py-6 text-text-muted">
          Спеціаліста не знайдено або профіль ще не опублікований.
        </p>
        <Link to="/specialists" className="mt-4 inline-block text-brand-600 hover:text-brand-700">
          ← До каталогу
        </Link>
      </div>
    );
  }

  const specialist = profileQuery.data;
  const status = verificationLabel(specialist.verificationStatus);
  const location = [specialist.city?.name, specialist.district?.name].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link to="/specialists" className="text-sm text-brand-600 hover:text-brand-700">
        ← До каталогу
      </Link>

      <article className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row">
          <SpecialistAvatar name={specialist.fullName} photoUrl={specialist.photoUrl} />
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-text">{specialist.fullName}</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}>
                {status.text}
              </span>
            </div>
            <p className="text-text-muted">
              {specialist.specializations.map((s) => s.name).join(", ")}
            </p>
            <p className="text-sm text-text-muted">Досвід: {specialist.experienceYears} років</p>
            <RatingStars value={specialist.ratingAvg} count={specialist.ratingCount} />
            <p className="text-xl font-semibold text-text">
              Консультація: {formatPrice(specialist.pricePerSession)}
            </p>
          </div>
        </div>

        {specialist.description && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-text">Про спеціаліста</h2>
            <p className="mt-2 whitespace-pre-wrap text-text-muted">{specialist.description}</p>
          </section>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-text">Місце прийому</h3>
            <p className="mt-1 text-sm text-text-muted">{location || "—"}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">Формат консультацій</h3>
            <p className="mt-1 text-sm text-text-muted">
              {specialist.formats.map((f) => f.name).join(", ") || "—"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">Типи травм / захворювань</h3>
            <p className="mt-1 text-sm text-text-muted">
              {specialist.injuryTypes.map((i) => i.name).join(", ") || "—"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text">Інклюзивність</h3>
            <p className="mt-1 text-sm text-text-muted">
              {specialist.inclusiveSpace ? "Інклюзивний простір доступний" : "Не вказано"}
            </p>
          </div>
        </section>

        <ConsultationRequestSection specialistId={specialist.id} specialistName={specialist.fullName} />

        {specialist.services.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-text">Послуги</h2>
            <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
              {specialist.services.map((service) => (
                <li key={service.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="font-medium text-text">{service.name}</p>
                    {service.description && (
                      <p className="text-sm text-text-muted">{service.description}</p>
                    )}
                  </div>
                  <p className="font-medium text-text">{formatPrice(service.price)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-text">Відгуки</h2>
          <p className="mt-1 text-sm text-text-muted">
            Середній рейтинг:{" "}
            {specialist.ratingCount > 0
              ? `${specialist.ratingAvg.toFixed(1)} (${specialist.ratingCount} схвалених)`
              : "ще немає схвалених відгуків"}
          </p>
          <SpecialistReviewSection specialistId={specialist.id} />
          {reviewsQuery.isLoading ? (
            <p className="mt-2 text-sm text-text-muted">Завантаження…</p>
          ) : reviewsQuery.data?.data.length === 0 ? (
            <p className="mt-2 text-sm text-text-muted">Поки що немає схвалених відгуків.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {reviewsQuery.data?.data.map((review) => (
                <li key={review.id} className="rounded-lg border border-border px-4 py-3">
                  <p className="text-sm font-medium text-text">
                    {review.authorName} · {review.rating}/5
                  </p>
                  <p className="mt-1 text-sm text-text-muted">{review.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </article>
    </div>
  );
}
