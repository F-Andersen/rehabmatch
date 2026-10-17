import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../features/auth/AuthProvider";
import {
  fetchCatalogDictionaries,
  fetchOwnSpecialistProfile,
  replaceOwnSpecialistServices,
  updateOwnSpecialistProfile,
} from "../features/specialists/api";
import { ApiError } from "../lib/api";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

const profileFormSchema = z.object({
  fullName: z.string().trim().min(2, "Мінімум 2 символи"),
  description: z.string().trim().max(5000),
  experienceYears: z.coerce.number().int().min(0).max(60),
  pricePerSession: z.coerce.number().min(0).max(100_000),
  cityId: z.string().uuid().optional().or(z.literal("")),
  districtId: z.string().uuid().optional().or(z.literal("")),
  inclusiveSpace: z.boolean(),
  specializationIds: z.array(z.string()).min(1, "Оберіть хоча б одну спеціалізацію"),
  injuryTypeIds: z.array(z.string()).min(1, "Оберіть хоча б один тип"),
  formatIds: z.array(z.string()).min(1, "Оберіть формат прийому"),
  services: z.array(
    z.object({
      name: z.string().trim().min(2),
      description: z.string().trim().optional(),
      price: z.coerce.number().min(0),
    }),
  ),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function statusMessage(status: string | null | undefined) {
  switch (status) {
    case "APPROVED":
      return "Ваш профіль підтверджено й відображається в каталозі.";
    case "PENDING":
      return "Профіль на перевірці адміністратором. Після суттєвих змін статус знову стає «На перевірці».";
    case "REJECTED":
      return "Профіль відхилено. Оновіть дані та зверніться до підтримки.";
    default:
      return "";
  }
}

export function SpecialistDashboardPage() {
  const { user, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const catalogQuery = useQuery({ queryKey: ["catalog"], queryFn: fetchCatalogDictionaries });
  const profileQuery = useQuery({
    queryKey: ["specialist", "me"],
    queryFn: fetchOwnSpecialistProfile,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: "",
      description: "",
      experienceYears: 0,
      pricePerSession: 0,
      cityId: "",
      districtId: "",
      inclusiveSpace: false,
      specializationIds: [],
      injuryTypeIds: [],
      formatIds: [],
      services: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "services" });
  const cityId = watch("cityId");

  const districtsForCity = useMemo(() => {
    if (!cityId || !catalogQuery.data) return [];
    return catalogQuery.data.districts.filter((d) => d.cityId === cityId);
  }, [catalogQuery.data, cityId]);

  useEffect(() => {
    if (!profileQuery.data || !user) return;
    const profile = profileQuery.data;
    reset({
      fullName: user.fullName,
      description: profile.description ?? "",
      experienceYears: profile.experienceYears,
      pricePerSession: profile.pricePerSession,
      cityId: profile.city?.id ?? "",
      districtId: profile.district?.id ?? "",
      inclusiveSpace: profile.inclusiveSpace,
      specializationIds: profile.specializations.map((s) => s.id),
      injuryTypeIds: profile.injuryTypes.map((i) => i.id),
      formatIds: profile.formats.map((f) => f.id),
      services: profile.services.map((s) => ({
        name: s.name,
        description: s.description,
        price: s.price,
      })),
    });
  }, [profileQuery.data, user, reset]);

  const saveMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      await updateOwnSpecialistProfile({
        fullName: values.fullName,
        description: values.description,
        experienceYears: values.experienceYears,
        pricePerSession: values.pricePerSession,
        cityId: values.cityId || null,
        districtId: values.districtId || null,
        inclusiveSpace: values.inclusiveSpace,
        specializationIds: values.specializationIds,
        injuryTypeIds: values.injuryTypeIds,
        formatIds: values.formatIds,
      });
      await replaceOwnSpecialistServices(
        values.services.map((s) => ({
          name: s.name,
          description: s.description,
          price: s.price,
        })),
      );
    },
    onSuccess: async () => {
      setFormError(null);
      setFormSuccess("Профіль збережено.");
      await queryClient.invalidateQueries({ queryKey: ["specialist", "me"] });
      await refetchUser();
    },
    onError: (error) => {
      setFormSuccess(null);
      if (error instanceof ApiError) setFormError(error.message);
      else setFormError("Не вдалося зберегти профіль.");
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFormSuccess(null);
    setFormError(null);
    saveMutation.mutate(values);
  });

  const verificationStatus = profileQuery.data?.verificationStatus ?? user?.specialistVerificationStatus;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-text">Кабінет спеціаліста</h1>
        <p className="mt-2 text-text-muted">
          Вітаємо, {user?.fullName}. Статус модерації:{" "}
          <strong>{verificationStatus ?? "—"}</strong>.
        </p>
        <p className="mt-2 text-sm text-text-muted">{statusMessage(verificationStatus)}</p>
        {profileQuery.data?.verificationStatus === "APPROVED" && (
          <Link
            to={`/specialists/${profileQuery.data.id}`}
            className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Переглянути публічний профіль
          </Link>
        )}
      </div>

      {profileQuery.isLoading || catalogQuery.isLoading ? (
        <p className="text-text-muted">Завантаження профілю…</p>
      ) : profileQuery.isError ? (
        <p className="text-red-700">Не вдалося завантажити профіль.</p>
      ) : (
        <form
          className="space-y-6 rounded-xl border border-border bg-surface p-6 shadow-sm"
          onSubmit={onSubmit}
          noValidate
        >
          <h2 className="text-lg font-semibold text-text">Редагування анкети</h2>

          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {formError}
            </p>
          )}
          {formSuccess && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-success">
              {formSuccess}
            </p>
          )}

          <div>
            <label htmlFor="fullName" className="mb-1 block text-sm font-medium">ПІБ</label>
            <input id="fullName" className={inputClass} {...register("fullName")} />
            {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium">Опис</label>
            <textarea id="description" rows={5} className={inputClass} {...register("description")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="experienceYears" className="mb-1 block text-sm font-medium">
                Стаж (років)
              </label>
              <input
                id="experienceYears"
                type="number"
                min={0}
                className={inputClass}
                {...register("experienceYears")}
              />
              {errors.experienceYears && (
                <p className="mt-1 text-xs text-red-600">{errors.experienceYears.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="pricePerSession" className="mb-1 block text-sm font-medium">
                Ціна консультації (грн)
              </label>
              <input
                id="pricePerSession"
                type="number"
                min={0}
                className={inputClass}
                {...register("pricePerSession")}
              />
              {errors.pricePerSession && (
                <p className="mt-1 text-xs text-red-600">{errors.pricePerSession.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cityId" className="mb-1 block text-sm font-medium">Місто</label>
              <select id="cityId" className={inputClass} {...register("cityId")}>
                <option value="">Оберіть місто</option>
                {catalogQuery.data?.cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="districtId" className="mb-1 block text-sm font-medium">Район</label>
              <select id="districtId" className={inputClass} {...register("districtId")}>
                <option value="">Оберіть район</option>
                {districtsForCity.map((district) => (
                  <option key={district.id} value={district.id}>{district.name}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("inclusiveSpace")} />
            Інклюзивний простір
          </label>

          <CheckboxGroup
            label="Спеціалізації"
            items={catalogQuery.data?.specializations ?? []}
            name="specializationIds"
            register={register}
            error={errors.specializationIds?.message}
          />
          <CheckboxGroup
            label="Типи травм / захворювань"
            items={catalogQuery.data?.injuryTypes ?? []}
            name="injuryTypeIds"
            register={register}
            error={errors.injuryTypeIds?.message}
          />
          <CheckboxGroup
            label="Формат прийому"
            items={catalogQuery.data?.formats ?? []}
            name="formatIds"
            register={register}
            error={errors.formatIds?.message}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text">Послуги</h3>
              <button
                type="button"
                className="text-sm text-brand-600 hover:text-brand-700"
                onClick={() => append({ name: "", description: "", price: 0 })}
              >
                + Додати послугу
              </button>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-border p-3 space-y-2">
                  <input
                    className={inputClass}
                    placeholder="Назва послуги"
                    {...register(`services.${index}.name`)}
                  />
                  <input
                    className={inputClass}
                    placeholder="Опис (необовʼязково)"
                    {...register(`services.${index}.description`)}
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      className={inputClass}
                      placeholder="Ціна"
                      {...register(`services.${index}.price`)}
                    />
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-border px-3 text-sm text-text-muted"
                      onClick={() => remove(index)}
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || saveMutation.isPending}
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saveMutation.isPending ? "Збереження…" : "Зберегти профіль"}
          </button>
        </form>
      )}
    </div>
  );
}

function CheckboxGroup({
  label,
  items,
  name,
  register,
  error,
}: {
  label: string;
  items: { id: string; name: string }[];
  name: "specializationIds" | "injuryTypeIds" | "formatIds";
  register: ReturnType<typeof useForm<ProfileFormValues>>["register"];
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-text">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" value={item.id} {...register(name)} />
            {item.name}
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </fieldset>
  );
}

export function SpecialistProfileEditPage() {
  return <SpecialistDashboardPage />;
}

export function SpecialistRequestsPage() {
  return (
    <section className="rounded-xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-text">Заявки на консультацію</h1>
      <p className="mt-3 text-text-muted">Обробка заявок спеціалістом — етап M6.</p>
    </section>
  );
}
