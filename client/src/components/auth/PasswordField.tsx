import { useState } from "react";

type PasswordFieldProps = {
  id: string;
  label: string;
  error?: string;
  registration?: React.InputHTMLAttributes<HTMLInputElement>;
};

export function PasswordField({ id, label, error, registration }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-text">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 pr-10 text-sm outline-none ring-brand-600 focus:ring-2"
          {...registration}
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-text-muted hover:text-text"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Приховати пароль" : "Показати пароль"}
        >
          {visible ? "Сховати" : "Показати"}
        </button>
      </div>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
