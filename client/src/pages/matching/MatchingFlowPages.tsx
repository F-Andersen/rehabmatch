import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchCatalogDictionaries } from "../../features/specialists/api";
import {
  createRecommendationAhp,
  createRecommendationWsm,
  createSearchRequest,
  fetchRecommendation,
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
import { matchingSearchSchema, type MatchingSearchFormValues } from "../../features/matching/schemas";
import { ApiError } from "../../lib/api";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export function MatchingNewPage() {
  const navigate = useNavigate();
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: fetchCatalogDictionaries });
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MatchingSearchFormValues>({
    resolver: zodResolver(matchingSearchSchema),
    defaultValues: {
      injuryTypeId: "",
      specializationId: "",
      cityId: "",
      districtId: "",
      formatId: "",
      maxBudget: 1500,
      cityOnly: false,
      inclusiveOnly: false,
      formatStrict: false,
      preferenceMode: "AHP_PAIRWISE",
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
          <label className="mb-1 block text-sm font-medium">Тип травми / захворювання</label>
          <select className={inputClass} {...register("injuryTypeId")}>
            <option value="">Оберіть…</option>
            {catalog.data?.injuryTypes.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          {errors.injuryTypeId && <p className="mt-1 text-xs text-red-600">{errors.injuryTypeId.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Спеціалізація (необовʼязково)</label>
          <select className={inputClass} {...register("specializationId")}>
            <option value="">Будь-яка</option>
            {catalog.data?.specializations.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Місто</label>
            <select className={inputClass} {...register("cityId")}>
              <option value="">Не вказано</option>
              {catalog.data?.cities.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Район</label>
            <select className={inputClass} {...register("districtId")}>
              <option value="">Не вказано</option>
              {districts.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Формат консультації</label>
          <select className={inputClass} {...register("formatId")}>
            <option value="">Не вказано</option>
            {catalog.data?.formats.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Максимальний бюджет (грн)</label>
          <input type="number" min={1} className={inputClass} {...register("maxBudget")} />
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
  const navigate = useNavigate();
  const [mode, setMode] = useState<"AHP_PAIRWISE" | "DIRECT_WSM">("AHP_PAIRWISE");
  const [stepIndex, setStepIndex] = useState(0);
  const [comparisons, setComparisons] = useState<ComparisonMap>({});
  const [priorities, setPriorities] = useState<Record<CriterionKey, number>>({
    EXPERIENCE: 5,
    PRICE: 5,
    RATING: 5,
    LOCATION: 5,
    FORMAT: 5,
  });
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewAhpPairwise>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchRequestId) return;
    const draft = loadMatchingDraft(searchRequestId);
    if (draft?.comparisons) setComparisons(draft.comparisons as ComparisonMap);
    if (draft?.priorities) setPriorities(draft.priorities as Record<CriterionKey, number>);
    if (draft?.mode) setMode(draft.mode as "AHP_PAIRWISE" | "DIRECT_WSM");
  }, [searchRequestId]);

  useEffect(() => {
    if (!searchRequestId) return;
    saveMatchingDraft(searchRequestId, { comparisons, priorities, mode });
  }, [searchRequestId, comparisons, priorities, mode]);

  const currentPair = PAIR_STEPS[stepIndex];
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
        return createRecommendationAhp(searchRequestId, comparisonsList);
      }
      return createRecommendationWsm(searchRequestId, priorities);
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
                <button type="button" className="flex-1 rounded-lg border border-border px-2 py-1.5 text-left text-sm hover:bg-surface-tint" onClick={() => setPairValue(scale.value, currentPair.criterionA)}>
                  {CRITERION_LABELS[currentPair.criterionA]} — {scale.label}
                </button>
                <button type="button" className="flex-1 rounded-lg border border-border px-2 py-1.5 text-left text-sm hover:bg-surface-tint" onClick={() => setPairValue(scale.value, currentPair.criterionB)}>
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
              <label className="mb-1 flex justify-between text-sm font-medium">
                <span>{CRITERION_LABELS[key]}</span>
                <span>{priorities[key]}</span>
              </label>
              <input type="range" min={1} max={9} step={1} value={priorities[key]} onChange={(e) => setPriorities((p) => ({ ...p, [key]: Number(e.target.value) }))} className="w-full" />
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
            (mode === "AHP_PAIRWISE" && Boolean(preview && !preview.isConsistent))
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

  if (query.isLoading) return <p className="p-8 text-text-muted">Завантаження…</p>;
  if (query.isError || !query.data) {
    return <p className="p-8 text-text-muted">Рекомендацію не знайдено.</p>;
  }

  const rec = query.data;

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
            <span key={key} className="rounded-full bg-surface-tint px-2 py-0.5">{key}: {(weight * 100).toFixed(0)}%</span>
          ))}
        </div>
      </section>

      {rec.items.length === 0 ? (
        <p className="mt-8 text-center text-text-muted">За вашими фільтрами спеціалістів не знайдено.</p>
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
                        <td className="py-1">{f.key}</td>
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

      <Link to="/matching/new" className="mt-8 inline-block text-sm text-brand-600">Повторити підбір</Link>
    </div>
  );
}
