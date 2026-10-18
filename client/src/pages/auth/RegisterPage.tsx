import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { AuthPageShell } from "../../components/auth/AuthPageShell";
import { PasswordField } from "../../components/auth/PasswordField";
import { useAuth } from "../../features/auth/AuthProvider";
import { registerFormSchema, type RegisterFormValues } from "../../features/auth/schemas";
import { ApiError } from "../../lib/api";
import { dashboardPathForRole } from "../../lib/role-routes";

export function RegisterPage() {
  const { register: registerUser, user } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "PATIENT",
      acceptTerms: false,
    },
  });

  useEffect(() => {
    if (user) {
      navigate(dashboardPathForRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccessMessage(null);
    try {
      const created = await registerUser({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        role: values.role,
      });
      setSuccessMessage("Обліковий запис створено. Перенаправляємо до кабінету…");
      navigate(dashboardPathForRole(created.role), { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Не вдалося зареєструватися. Спробуйте ще раз.");
      }
    }
  });

  return (
    <AuthPageShell
      title="Реєстрація"
      subtitle="Створіть акаунт, щоб знайти свого спеціаліста"
      footer={
        <>
          Вже маєте акаунт?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Увійти
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-text">
            Повне ім&apos;я
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none ring-brand-600 focus:ring-2"
            {...register("fullName")}
          />
          {errors.fullName ? (
            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-text">
            Електронна пошта
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none ring-brand-600 focus:ring-2"
            {...register("email")}
          />
          {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
        </div>

        <div>
          <label htmlFor="role" className="mb-1 block text-sm font-medium text-text">
            Роль
          </label>
          <select
            id="role"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none ring-brand-600 focus:ring-2"
            {...register("role")}
          >
            <option value="PATIENT">Пацієнт</option>
            <option value="SPECIALIST">Спеціаліст</option>
          </select>
          {errors.role ? <p className="mt-1 text-sm text-red-600">{errors.role.message}</p> : null}
        </div>

        <PasswordField
          id="password"
          label="Пароль"
          error={errors.password?.message}
          registration={register("password")}
        />

        <PasswordField
          id="confirmPassword"
          label="Підтвердження пароля"
          error={errors.confirmPassword?.message}
          registration={register("confirmPassword")}
        />

        <label className="flex items-start gap-2 text-sm text-text-muted">
          <input type="checkbox" className="mt-1" {...register("acceptTerms")} />
          <span>Я погоджуюсь з умовами використання та політикою конфіденційності (навчальний прототип).</span>
        </label>
        {errors.acceptTerms ? (
          <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
        ) : null}

        {formError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {formError}
          </p>
        ) : null}
        {successMessage ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-success" role="status">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? "Реєстрація…" : "Зареєструватися"}
        </button>
      </form>
    </AuthPageShell>
  );
}
