import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthPageShell } from "../../components/auth/AuthPageShell";
import { PasswordField } from "../../components/auth/PasswordField";
import { useAuth } from "../../features/auth/AuthProvider";
import { loginFormSchema, type LoginFormValues } from "../../features/auth/schemas";
import { ApiError } from "../../lib/api";
import { dashboardPathForRole } from "../../lib/role-routes";

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (user) {
      navigate(dashboardPathForRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const authenticated = await login(values.email, values.password);
      const redirect =
        (location.state as { from?: string } | null)?.from ?? dashboardPathForRole(authenticated.role);
      navigate(redirect, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Не вдалося увійти. Спробуйте ще раз.");
      }
    }
  });

  return (
    <AuthPageShell
      title="Вхід до системи"
      subtitle="Увійдіть у свій акаунт, щоб отримати персональні рекомендації"
      footer={
        <>
          Ще не маєте акаунту?{" "}
          <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
            Зареєструйтеся
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-text">
            Електронна пошта
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none ring-brand-600 focus:ring-2"
            {...register("email")}
          />
          {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
        </div>

        <PasswordField
          id="password"
          label="Пароль"
          error={errors.password?.message}
          registration={register("password")}
        />

        {formError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? "Вхід…" : "Увійти"}
        </button>
      </form>
    </AuthPageShell>
  );
}
