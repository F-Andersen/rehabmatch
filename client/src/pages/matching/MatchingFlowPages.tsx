import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { fetchCatalogDictionaries } from "../../features/specialists/api";
import {
  createRecommendationAhp,
  createRecommendationWsm,
  createSearchRequest,
  fetchRecommendation,
  fetchSearchRequest,
  type SearchRequestDetail,
  loadMatchingDraft,
  previewAhpPairwise,
  previewDirectWsm,
  saveMatchingDraft,
} from "../../features/matching/api";
import {
  CRITERION_LABELS,
  PAIR_STEPS,
  SAATY_SCALE,
  type CriterionKey,
} from "../../features/matching/criteria";
import { matchingSearchSchema, type MatchingSearchFormValues, type MatchingSearchFormInput } from "../../features/matching/schemas";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../features/auth/AuthProvider";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export function MatchingNewPage() {
  const [params] = useSearchParams();
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: fetchCatalogDictionaries });
  const sourceId = params.get("from");
  const source = useQuery({
    queryKey: ["search-request", sourceId],
    queryFn: () => fetchSearchRequest(sourceId!),
    enabled: Boolean(sourceId),
  });
  if (catalog.isLoading || (sourceId && source.isLoading)) return <p className="p-8 text-text-muted">Завантаження параметрів…</p>;
  if (catalog.isError) return (
    <div className="p-8"><p role="alert">Не вдалося завантажити довідники пошуку.</p>
      <button type="button" onClick={() => void catalog.refetch()} className="mt-4 text-brand-600 underline">Спробувати ще раз</button>
    </div>
  );
  if (sourceId && !source.data) return (
    <div className="p-8"><p role="alert">Не вдалося завантажити параметри підбору.</p>
      <Link to="/matching/new" className="mt-4 inline-block text-brand-600 underline">Почати новий підбір</Link>
    </div>
  );
  return <MatchingSearchForm key={sourceId ?? "new"} initialSearch={source.data} />;
}

function MatchingSearchForm({ initialSearch }: { initialSearch?: SearchRequestDetail }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: fetchCatalogDictionaries });
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MatchingSearchFormInput, undefined, MatchingSearchFormValues>({
    resolver: zodResolver(matchingSearchSchema),
    defaultValues: {
      injuryTypeId: initialSearch?.filtersSnapshot.injuryTypeId ?? "",
      specializationId: initialSearch?.filtersSnapshot.specializationId ?? "",
      cityId: initialSearch ? initialSearch.filtersSnapshot.cityId ?? "" : user?.cityId ?? "",
      districtId: initialSearch?.filtersSnapshot.districtId ?? "",
      formatId: initialSearch?.filtersSnapshot.formatId ?? "",
      maxBudget: initialSearch?.filtersSnapshot.maxBudget ?? 1500,
      cityOnly: initialSearch?.filtersSnapshot.cityOnly ?? false,
      inclusiveOnly: initialSearch?.filtersSnapshot.inclusiveOnly ?? false,
      formatStrict: initialSearch?.filtersSnapshot.formatStrict ?? false,
      preferenceMode: initialSearch?.preferenceMode ?? "AHP_PAIRWISE",
    },
  });

  const cityId = watch("cityId");
  const districts = useMemo(() => {
    if (!cityId || !catalog.data) return [];
    return catalog.data.districts.filter((d) => d.cityId === cityId);
  }, [catalog.data, cityId]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const data = await createSearchRequest({
        injuryTypeId: values.injuryTypeId,
        specializationId: values.specializationId || undefined,
        cityId: values.cityId || null,
        districtId: values.districtId || null,
        formatId: values.formatId || null,
        maxBudget: values.maxBudget,
        cityOnly: values.cityOnly,
        inclusiveOnly: values.inclusiveOnly,
        formatStrict: values.formatStrict,
        preferenceMode: values.preferenceMode,
      });
      saveMatchingDraft(data.id, { mode: values.preferenceMode });
      navigate(`/matching/${data.id}/criteria`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не вдалося створити запит");
    }
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-text">Персоналізований підбір</h1>
      <p className="mt-2 text-sm text-text-muted">Крок 1: параметри пошуку</p>

      <form className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm" onSubmit={onSubmit}>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

        <div>
          <label htmlFor="matching-injury" className="mb-1 block text-sm font-medium">Тип травми / захворювання</label>
          <select id="matching-injury" className={inputClass} {...register("injuryTypeId")}>
            <option value="">Оберіть…</option>
            {catalog.data?.injuryTypes.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          {errors.injuryTypeId && <p className="mt-1 text-xs text-red-600">{errors.injuryTypeId.message}</p>}
        </div>

        <div>
          <label htmlFor="matching-specialization" className="mb-1 block text-sm font-medium">Спеціалізація (необовʼязково)</label>
          <select id="matching-specialization" className={inputClass} {...register("specializationId")}>
            <option value="">Будь-яка</option>
            {catalog.data?.specializations.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="matching-city" className="mb-1 block text-sm font-medium">Місто</label>
            <select id="matching-city" className={inputClass} {...register("cityId", { onChange: () => setValue("districtId", "") })} value={cityId}>
              <option value="">Не вказано</option>
              {catalog.data?.cities.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="matching-district" className="mb-1 block text-sm font-medium">Район</label>
            <select id="matching-district" className={inputClass} {...register("districtId")} value={watch("districtId")}>
              <option value="">Не вказано</option>
              {districts.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="matching-format" className="mb-1 block text-sm font-medium">Формат консультації</label>
          <select id="matching-format" className={inputClass} {...register("formatId")}>
            <option value="">Не вказано</option>
            {catalog.data?.formats.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="matching-budget" className="mb-1 block text-sm font-medium">Максимальний бюджет (грн)</label>
          <input id="matching-budget" type="number" min={1} className={inputClass} {...register("maxBudget")} />
          {errors.maxBudget && <p className="mt-1 text-xs text-red-600">{errors.maxBudget.message}</p>}
        </div>

        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" {...register("cityOnly")} /> Лише обране місто</label>
          <label className="flex items-center gap-2"><input type="checkbox" {...register("inclusiveOnly")} /> Інклюзивний простір</label>
          <label className="flex items-center gap-2"><input type="checkbox" {...register("formatStrict")} /> Суворий фільтр формату</label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Спосіб визначення пріоритетів</p>
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <input type="radio" value="AHP_PAIRWISE" {...register("preferenceMode")} />
              Попарне порівняння (AHP)
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <input type="radio" value="DIRECT_WSM" {...register("preferenceMode")} />
              Швидке налаштування (WSM)
            </label>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting || catalog.isLoading} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          Далі: критерії
        </button>
      </form>
    </div>
  );
}

type ComparisonMap = Record<string, number>;

function comparisonKey(a: CriterionKey, b: CriterionKey) {
  return `${a}|${b}`;
}

export function MatchingCriteriaPage() {
  const { id: searchRequestId } = useParams();
  const search = useQuery({
    queryKey: ["search-request", searchRequestId],
    queryFn: () => fetchSearchRequest(searchRequestId!),
    enabled: Boolean(searchRequestId),
  });
  if (!searchRequestId) return <p className="p-8">Невідомий ідентифікатор запиту.</p>;
  if (search.isPending) return <p className="p-8">Завантаження параметрів підбору…</p>;
  if (search.isError) return (
    <div className="p-8" role="alert">
      <p>Не вдалося завантажити параметри підбору.</p>
      <button type="button" onClick={() => search.refetch()}>Спробувати ще раз</button>
    </div>
  );
  return <MatchingCriteriaForm key={searchRequestId} search={search.data} />;
}

function MatchingCriteriaForm({ search }: { search: SearchRequestDetail }) {
  const searchRequestId = search.id;
  const navigate = useNavigate();
  const [draft] = useState(() => loadMatchingDraft(searchRequestId));
  const [mode, setMode] = useState<"AHP_PAIRWISE" | "DIRECT_WSM">(() =>
    draft?.mode === "AHP_PAIRWISE" || draft?.mode === "DIRECT_WSM"
      ? draft.mode : search.preferenceMode,
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [comparisons, setComparisons] = useState<ComparisonMap>(() => (draft?.comparisons as ComparisonMap) ?? {});
  const [priorities, setPriorities] = useState<Record<CriterionKey, number>>(() => ({
    EXPERIENCE: 5,
    PRICE: 5,
    RATING: 5,
    LOCATION: 5,
    FORMAT: 5,
    ...(draft?.priorities as Partial<Record<CriterionKey, number>>),
  }));
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewAhpPairwise>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(null);
    setError(null);
  }, [mode, comparisons, priorities]);

  useEffect(() => {
    if (!searchRequestId) return;
    saveMatchingDraft(searchRequestId, { comparisons, priorities, mode });
  }, [searchRequestId, comparisons, priorities, mode]);

  const currentPair = PAIR_STEPS[stepIndex];
  const selectedPairValue = currentPair ? comparisons[comparisonKey(currentPair.criterionA, currentPair.criterionB)] : undefined;
  const comparisonsList = useMemo(
    () =>
      PAIR_STEPS.map((pair) => {
        const key = comparisonKey(pair.criterionA, pair.criterionB);
        const value = comparisons[key];
        return value
          ? { criterionA: pair.criterionA, criterionB: pair.criterionB, value }
          : null;
      }).filter(Boolean) as Array<{ criterionA: CriterionKey; criterionB: CriterionKey; value: number }>,
    [comparisons],
  );

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (mode === "AHP_PAIRWISE") {
        if (comparisonsList.length < 10) throw new Error("Заповніть усі 10 порівнянь");
        return previewAhpPairwise(comparisonsList);
      }
      return previewDirectWsm(priorities);
    },
    onSuccess: (data) => {
      setPreview(data);
      setError(null);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Помилка розрахунку"),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!searchRequestId) throw new Error("Невідомий запит");
      if (mode === "AHP_PAIRWISE") {
        if (!preview?.isConsistent) throw new ApiError(422, "Порівняння суперечливі", "AHP_INCONSISTENT");
      }
      // A changed mode needs its own persisted request; the original keeps its history.
      const target = mode === search.preferenceMode ? search : await createSearchRequest({
        ...search.filtersSnapshot,
        specializationId: search.filtersSnapshot.specializationId ?? undefined,
        preferenceMode: mode,
      });
      return mode === "AHP_PAIRWISE"
        ? createRecommendationAhp(target.id, comparisonsList)
        : createRecommendationWsm(target.id, priorities);
    },
    onSuccess: (data) => navigate(`/recommendations/${data.id}`),
    onError: (e) => setError(e instanceof ApiError ? e.message : "Не вдалося зберегти рекомендацію"),
  });

  function setPairValue(importance: number, favored: CriterionKey) {
    if (!currentPair) return;
    const { criterionA, criterionB } = currentPair;
    let value = importance;
    if (favored === criterionB) {
      value = 1 / importance;
    }
    setComparisons((prev) => ({
      ...prev,
      [comparisonKey(criterionA, criterionB)]: value,
    }));
  }

  if (!searchRequestId) {
    return <p className="p-8">Невідомий ідентифікатор запиту.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/matching/new" className="text-sm text-brand-600">← Параметри пошуку</Link>
      <h1 className="mt-4 text-2xl font-semibold">Критерії підбору</h1>
      <p className="mt-1 text-sm text-text-muted">Крок 2: ваги критеріїв</p>

      <div className="mt-4 flex gap-2">
        <button type="button" className={mode === "AHP_PAIRWISE" ? "rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white" : "rounded-lg border px-3 py-1.5 text-sm"} onClick={() => setMode("AHP_PAIRWISE")}>
          Попарне порівняння (AHP)
        </button>
        <button type="button" className={mode === "DIRECT_WSM" ? "rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white" : "rounded-lg border px-3 py-1.5 text-sm"} onClick={() => setMode("DIRECT_WSM")}>
          Швидке налаштування (WSM)
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      {mode === "AHP_PAIRWISE" && currentPair && (
        <section className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-sm text-text-muted">Порівняння {stepIndex + 1} / 10</p>
          <h2 className="mt-2 text-lg font-semibold">
            {CRITERION_LABELS[currentPair.criterionA]} vs {CRITERION_LABELS[currentPair.criterionB]}
          </h2>
          <p className="mt-2 text-sm text-text-muted">Який критерій важливіший і наскільки?</p>
          <div className="mt-4 space-y-2">
            {SAATY_SCALE.map((scale) => (
              <div key={scale.value} className="flex flex-wrap gap-2">
                <button type="button" aria-pressed={selectedPairValue === scale.value} className="min-h-11 flex-1 rounded-lg border border-border px-2 py-1.5 text-left text-sm hover:bg-surface-tint aria-pressed:bg-brand-600 aria-pressed:text-white" onClick={() => setPairValue(scale.value, currentPair.criterionA)}>
                  {CRITERION_LABELS[currentPair.criterionA]} — {scale.label}
                </button>
                <button type="button" aria-pressed={selectedPairValue === 1 / scale.value} className="min-h-11 flex-1 rounded-lg border border-border px-2 py-1.5 text-left text-sm hover:bg-surface-tint aria-pressed:bg-brand-600 aria-pressed:text-white" onClick={() => setPairValue(scale.value, currentPair.criterionB)}>
                  {CRITERION_LABELS[currentPair.criterionB]} — {scale.label}
                </button>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between">
            <button type="button" disabled={stepIndex === 0} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40" onClick={() => setStepIndex((s) => s - 1)}>Назад</button>
            <button type="button" disabled={stepIndex >= 9} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40" onClick={() => setStepIndex((s) => s + 1)}>Далі</button>
          </div>
        </section>
      )}

      {mode === "DIRECT_WSM" && (
        <section className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
          {(Object.keys(CRITERION_LABELS) as CriterionKey[]).map((key) => (
            <div key={key}>
              <label htmlFor={`priority-${key}`} className="mb-1 flex justify-between text-sm font-medium">
                <span>{CRITERION_LABELS[key]}</span>
                <span>{priorities[key]}</span>
              </label>
              <input id={`priority-${key}`} type="range" min={1} max={9} step={1} value={priorities[key]} onChange={(e) => setPriorities((p) => ({ ...p, [key]: Number(e.target.value) }))} className="min-h-11 w-full" />
            </div>
          ))}
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="rounded-lg border border-border px-4 py-2 text-sm" onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending}>
          Попередній розрахунок
        </button>
        <button
          type="button"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          disabled={
            submitMutation.isPending ||
            previewMutation.isPending ||
            (mode === "AHP_PAIRWISE" && !preview?.isConsistent)
          }
          onClick={() => submitMutation.mutate()}
        >
          Отримати рекомендації
        </button>
      </div>

      {preview && (
        <div className="mt-6 rounded-xl border border-border bg-surface-tint p-4 text-sm">
          <p className="font-medium">Ваги критеріїв</p>
          <ul className="mt-2 space-y-1">
            {(Object.keys(preview.weights) as CriterionKey[]).map((key) => (
              <li key={key}>{CRITERION_LABELS[key]}: {(preview.weights[key] * 100).toFixed(1)}%</li>
            ))}
          </ul>
          {preview.cr != null && (
            <p className="mt-2">
              CR: {preview.cr.toFixed(4)} — {preview.isConsistent ? "узгоджено" : "неузгоджено (виправте порівняння)"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function RecommendationDetailPage() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ["recommendation", id],
    queryFn: () => fetchRecommendation(id!),
    enabled: Boolean(id),
  });
  const catalog = useQuery({
    queryKey: ["catalog"], queryFn: fetchCatalogDictionaries,
    enabled: query.data?.items.length === 0,
  });

  if (query.isLoading) return <p className="p-8 text-text-muted">Завантаження…</p>;
  if (query.isError || !query.data) {
    return <p className="p-8 text-text-muted">Рекомендацію не знайдено.</p>;
  }

  const rec = query.data;
  const filters = rec.filtersSnapshot;
  const nameOf = (rows: Array<{ id: string; name: string }> | undefined, value: string | null | undefined) =>
    value ? rows?.find((row) => row.id === value)?.name ?? "Назва недоступна" : "Не вказано";
  const appliedFilters = filters ? [
    ["Тип запиту", nameOf(catalog.data?.injuryTypes, filters.injuryTypeId)],
    ["Спеціалізація", filters.specializationId ? nameOf(catalog.data?.specializations, filters.specializationId) : "Будь-яка"],
    ["Місто", nameOf(catalog.data?.cities, filters.cityId)],
    ["Район", nameOf(catalog.data?.districts, filters.districtId)],
    ["Бюджет", `До ${filters.maxBudget} грн за консультацію`],
    ["Формат", nameOf(catalog.data?.formats, filters.formatId)],
    ["Лише обране місто", filters.cityOnly ? "Так" : "Ні"],
    ["Інклюзивний простір", filters.inclusiveOnly ? "Обов’язково" : "Без обмеження"],
    ["Суворий фільтр формату", filters.formatStrict ? "Так" : "Ні"],
  ] : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/recommendations" className="text-sm text-brand-600">← Історія підборів</Link>
      <h1 className="mt-4 text-2xl font-semibold">Персоналізовані рекомендації</h1>
      <p className="mt-2 text-sm text-text-muted">
        Режим: {rec.mode === "AHP_PAIRWISE" ? "AHP (попарні порівняння)" : "WSM (прямі ваги)"} · {rec.items.length} спеціалістів
      </p>
      <p className="mt-2 rounded-lg bg-surface-tint px-3 py-2 text-xs text-text-muted">
        Підсумкова оцінка відповідності — математичний показник за вашими критеріями, а не медичний висновок чи ймовірність успіху лікування.
      </p>

      <section className="mt-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold">Ваги критеріїв</h2>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {Object.entries(rec.weights).map(([key, weight]) => (
            <span key={key} className="rounded-full bg-surface-tint px-2 py-0.5">{CRITERION_LABELS[key as CriterionKey] ?? key}: {(weight * 100).toFixed(0)}%</span>
          ))}
        </div>
      </section>

      {rec.items.length === 0 ? (
        <section aria-labelledby="empty-results-title" className="mt-8 rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h2 id="empty-results-title" className="text-lg font-semibold">За вашими фільтрами спеціалістів не знайдено</h2>
          <p className="mt-2 max-w-prose text-sm text-text-muted">На момент цього підбору в каталозі не було доступних профілів, які одночасно відповідали всім обов’язковим умовам. Зміна ваг критеріїв не розширить цей перелік.</p>
          <h3 className="mt-6 text-sm font-semibold">Параметри цього підбору</h3>
          {catalog.isLoading ? <p className="mt-2 text-sm text-text-muted">Завантаження назв параметрів…</p> : (
            <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {appliedFilters.map(([label, value]) => <div key={label}><dt className="text-text-muted">{label}</dt><dd className="mt-0.5 font-medium">{value}</dd></div>)}
            </dl>
          )}
          <p className="mt-6 max-w-prose text-sm text-text-muted">Спробуйте прибрати обмеження спеціалізації чи міста або збільшити бюджет. Це змінить умови пошуку й не гарантує наявності збігів.</p>
          <Link to={`/matching/new?from=${encodeURIComponent(rec.searchRequestId)}`} className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">Змінити параметри</Link>
          <p className="mt-2 text-xs text-text-muted">Попередні фільтри та спосіб визначення пріоритетів будуть збережені.</p>
        </section>
      ) : (
        <ul className="mt-8 space-y-6">
          {rec.items.map((item) => (
            <li key={item.specialistId} className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-text-muted">#{item.rankPosition}</p>
                  <h3 className="text-lg font-semibold">{item.fullName}</h3>
                  <p className="text-sm text-text-muted">{item.specializations.join(", ")}</p>
                  <p className="text-sm text-text-muted">{item.city ?? "—"} · {item.experienceYears} р. · {item.pricePerSession} грн</p>
                </div>
                <p className="text-xl font-bold text-brand-600">{item.matchScorePercent}%</p>
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-brand-600">Деталізація оцінки</summary>
                <table className="mt-2 w-full text-left text-xs">
                  <thead><tr className="text-text-muted"><th className="py-1">Критерій</th><th>Внесок</th><th>Норм.</th></tr></thead>
                  <tbody>
                    {item.factors.map((f) => (
                      <tr key={f.key} className="border-t border-border">
                        <td className="py-1">{CRITERION_LABELS[f.key as CriterionKey] ?? f.key}</td>
                        <td>{f.contribution.toFixed(3)}</td>
                        <td>{f.normalizedValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <ul className="mt-3 list-disc pl-5 text-sm text-text-muted">
                  {item.explanation.map((line) => <li key={line}>{line}</li>)}
                </ul>
              </details>
              <Link to={`/specialists/${item.specialistId}`} className="mt-4 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700">
                Переглянути профіль
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link to="/matching/new" className="mt-8 inline-block text-sm text-brand-600">{rec.items.length === 0 ? "Почати новий підбір" : "Повторити підбір"}</Link>
    </div>
  );
}
