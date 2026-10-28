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
  uploadOwnSpecialistPhoto,
} from "../features/specialists/api";
import { ApiError } from "../lib/api";
import {
  fetchSpecialistAppointmentRequests,
  patchSpecialistAppointmentStatus,
} from "../features/reviews-requests/api";

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

function verificationLabel(status: string | null | undefined) {
  return status === "APPROVED" ? "Підтверджено" : status === "PENDING" ? "На перевірці" : status === "REJECTED" ? "Відхилено" : "—";
}

export function SpecialistDashboardPage() {
  const { user } = useAuth();
  const profileQuery = useQuery({
    queryKey: ["specialist", "me"],
    queryFn: fetchOwnSpecialistProfile,
  });
  const requestsQuery = useQuery({
    queryKey: ["specialist", "appointment-requests", "overview"],
    queryFn: () => fetchSpecialistAppointmentRequests({ page: "1", pageSize: "20" }),
  });

  const verificationStatus = profileQuery.data?.verificationStatus ?? user?.specialistVerificationStatus;
  const pending =
    requestsQuery.data?.data.filter((r) => r.status === "REQUESTED").length ?? 0;
  const serviceCount = profileQuery.data?.services.length ?? 0;

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-text">Огляд</h1>
        <p className="mt-2 text-text-muted">Вітаємо, {user?.fullName}.</p>
        <p className="mt-3 rounded-lg bg-surface-tint px-4 py-3 text-sm">
          Статус модерації: <strong>{verificationLabel(verificationStatus)}</strong>
          <br />
          <span className="text-text-muted">{statusMessage(verificationStatus)}</span>
        </p>
        {profileQuery.data?.verificationStatus === "APPROVED" && (
          <Link
            to={`/specialists/${profileQuery.data.id}`}
            className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Публічний профіль у каталозі →
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm text-text-muted">Нові заявки</p>
          <p className="mt-1 text-2xl font-bold text-brand-600">{requestsQuery.isLoading ? "…" : pending}</p>
          <Link to="/specialist/requests" className="mt-2 inline-block text-sm text-brand-600">Перейти →</Link>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm text-text-muted">Послуг у профілі</p>
          <p className="mt-1 text-2xl font-bold text-text">{profileQuery.isLoading ? "…" : serviceCount}</p>
          <Link to="/specialist/services" className="mt-2 inline-block text-sm text-brand-600">Список →</Link>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm text-text-muted">Досвід</p>
          <p className="mt-1 text-2xl font-bold text-text">
            {profileQuery.data ? `${profileQuery.data.experienceYears} р.` : "…"}
          </p>
          <Link to="/specialist/profile/edit" className="mt-2 inline-block text-sm text-brand-600">Редагувати →</Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="font-semibold text-text">Швидкі дії</h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          <li>
            <Link to="/specialist/profile/edit" className="rounded-lg border border-border px-3 py-2 hover:bg-surface-tint">
              Оновити анкету
            </Link>
          </li>
          <li>
            <Link to="/specialist/requests" className="rounded-lg border border-border px-3 py-2 hover:bg-surface-tint">
              Обробити заявки
            </Link>
          </li>
        </ul>
        <p className="mt-4 text-xs text-text-muted">
          Після суттєвих змін профілю адміністратор може повторно перевірити дані перед публікацією в каталозі.
        </p>
      </div>
    </section>
  );
}

function SpecialistProfileEditForm() {
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
    setValue,
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

  const photoMutation = useMutation({
    mutationFn: (file: File) => uploadOwnSpecialistPhoto(file),
    onSuccess: async () => {
      setFormSuccess("Фото профілю оновлено. Профіль може потребувати повторної модерації.");
      await queryClient.invalidateQueries({ queryKey: ["specialist", "me"] });
    },
    onError: (error) => {
      setFormSuccess(null);
      setFormError(error instanceof ApiError ? error.message : "Не вдалося завантажити фото.");
    },
  });

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
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">Редагування профілю</h1>
      <p className="text-sm text-text-muted">
        Статус модерації: <strong>{verificationLabel(verificationStatus)}</strong>. {statusMessage(verificationStatus)}
      </p>

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

          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-surface-tint/50 p-4">
            {profileQuery.data?.photoUrl ? (
              <img
                src={profileQuery.data.photoUrl}
                alt="Поточне фото профілю"
                className="h-20 w-20 rounded-full object-cover ring-2 ring-white"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface text-sm text-text-muted">
                Немає фото
              </div>
            )}
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium text-text">Фото профілю</p>
              <p className="text-text-muted">JPEG, PNG або WebP, до 2 МБ. Після зміни можлива повторна модерація.</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-2 max-w-xs text-xs"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) photoMutation.mutate(file);
                  event.target.value = "";
                }}
              />
            </div>
          </div>

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
              <select id="cityId" className={inputClass} {...register("cityId", { onChange: () => setValue("districtId", "") })} value={cityId}>
                <option value="">Оберіть місто</option>
                {catalogQuery.data?.cities.map((city) => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="districtId" className="mb-1 block text-sm font-medium">Район</label>
              <select id="districtId" className={inputClass} {...register("districtId")} value={watch("districtId")}>
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
    </section>
  );
}

export function SpecialistProfileViewPage() {
  const profileQuery = useQuery({
    queryKey: ["specialist", "me"],
    queryFn: fetchOwnSpecialistProfile,
  });

  if (profileQuery.isLoading) return <p className="text-text-muted">Завантаження…</p>;
  if (profileQuery.isError || !profileQuery.data) {
    return <p className="text-red-700">Не вдалося завантажити профіль.</p>;
  }

  const p = profileQuery.data;
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold text-text">Мій профіль</h1>
      <div className="flex flex-wrap gap-6 rounded-xl border border-border bg-surface p-6 shadow-sm">
        {p.photoUrl ? (
          <img src={p.photoUrl} alt="Фото профілю" className="h-28 w-28 rounded-full object-cover ring-2 ring-surface-tint" />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-surface-tint text-text-muted">Немає фото</div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-lg font-semibold">{p.fullName}</p>
          <p className="text-sm text-text-muted">
            {[p.city?.name, p.district?.name].filter(Boolean).join(", ") || "Локація не вказана"}
          </p>
          <p className="text-sm">Статус: <strong>{verificationLabel(p.verificationStatus)}</strong></p>
          <Link to="/specialist/profile/edit" className="text-sm font-medium text-brand-600">Редагувати →</Link>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="font-semibold">Опис</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-muted">{p.description || "—"}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold">Спеціалізації</h3>
          <p className="mt-2 text-sm text-text-muted">{p.specializations.map((s) => s.name).join(", ")}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold">Формати</h3>
          <p className="mt-2 text-sm text-text-muted">{p.formats.map((f) => f.name).join(", ")}</p>
        </div>
      </div>
    </section>
  );
}

export function SpecialistServicesPage() {
  const profileQuery = useQuery({
    queryKey: ["specialist", "me"],
    queryFn: fetchOwnSpecialistProfile,
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-text">Мої послуги</h1>
        <Link to="/specialist/profile/edit" className="text-sm font-medium text-brand-600">Редагувати послуги</Link>
      </div>
      {profileQuery.isLoading ? (
        <p className="text-text-muted">Завантаження…</p>
      ) : profileQuery.data?.services.length === 0 ? (
        <p className="text-text-muted">Послуги ще не додані.</p>
      ) : (
        <ul className="space-y-3">
          {profileQuery.data?.services.map((service) => (
            <li key={service.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <p className="font-medium text-text">{service.name}</p>
              {service.description && <p className="mt-1 text-sm text-text-muted">{service.description}</p>}
              <p className="mt-2 text-sm font-semibold text-brand-600">{service.price} грн</p>
            </li>
          ))}
        </ul>
      )}
    </section>
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
  return <SpecialistProfileEditForm />;
}

function specialistRequestStatusLabel(status: string) {
  switch (status) {
    case "REQUESTED":
      return "Нова";
    case "ACCEPTED":
      return "Прийнято";
    case "DECLINED":
      return "Відхилено";
    case "CANCELLED":
      return "Скасовано пацієнтом";
    default:
      return status;
  }
}

export function SpecialistRequestsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["specialist", "appointment-requests", statusFilter],
    queryFn: () =>
      fetchSpecialistAppointmentRequests({
        page: "1",
        pageSize: "50",
        status: statusFilter || undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACCEPTED" | "DECLINED" }) =>
      patchSpecialistAppointmentStatus(id, status),
    onSuccess: async () => {
      setFeedback("Статус оновлено.");
      await queryClient.invalidateQueries({ queryKey: ["specialist", "appointment-requests"] });
    },
    onError: (error) => {
      setFeedback(error instanceof ApiError ? error.message : "Не вдалося оновити статус.");
    },
  });

  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-text">Заявки на консультацію</h1>
        <p className="mt-2 text-sm text-text-muted">
          Переглядайте звернення пацієнтів і змінюйте статус лише для нових заявок.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["", "REQUESTED", "ACCEPTED", "DECLINED", "CANCELLED"].map((value) => (
            <button
              key={value || "all"}
              type="button"
              className={[
                "rounded-lg px-3 py-1.5 text-sm font-medium",
                statusFilter === value
                  ? "bg-brand-600 text-white"
                  : "border border-border text-text-muted hover:bg-surface-tint",
              ].join(" ")}
              onClick={() => setStatusFilter(value)}
            >
              {value === "" ? "Усі" : specialistRequestStatusLabel(value)}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <p className="rounded-lg border border-border bg-surface-tint px-3 py-2 text-sm">{feedback}</p>
      )}

      {listQuery.isLoading ? (
        <p className="text-text-muted">Завантаження…</p>
      ) : listQuery.data?.data.length === 0 ? (
        <p className="text-text-muted">Заявок немає.</p>
      ) : (
        <ul className="space-y-3">
          {listQuery.data?.data.map((item) => (
            <li key={item.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <p className="font-medium text-text">{item.patientName ?? "Пацієнт"}</p>
              <p className="text-sm text-text-muted">
                {new Date(item.createdAt).toLocaleString("uk-UA")} · бажаний час:{" "}
                {new Date(item.preferredAt).toLocaleString("uk-UA")}
              </p>
              <p className="mt-1 text-sm">
                Статус: <strong>{specialistRequestStatusLabel(item.status)}</strong>
              </p>
              {item.note && <p className="mt-2 text-sm text-text-muted">{item.note}</p>}
              {item.status === "REQUESTED" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-success px-3 py-1.5 text-sm font-medium text-white"
                    onClick={() => statusMutation.mutate({ id: item.id, status: "ACCEPTED" })}
                  >
                    Прийняти
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700"
                    onClick={() => statusMutation.mutate({ id: item.id, status: "DECLINED" })}
                  >
                    Відхилити
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
