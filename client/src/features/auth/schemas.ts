import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().trim().email("Некоректна електронна пошта"),
  password: z.string().min(1, "Вкажіть пароль"),
});

export const registerFormSchema = z
  .object({
    fullName: z.string().trim().min(2, "Вкажіть ім'я та прізвище"),
    email: z.string().trim().email("Некоректна електронна пошта"),
    password: z.string().min(8, "Пароль має містити щонайменше 8 символів"),
    confirmPassword: z.string().min(1, "Підтвердіть пароль"),
    role: z.enum(["PATIENT", "SPECIALIST"]),
    acceptTerms: z.boolean().refine((value) => value, {
      message: "Потрібна згода з умовами",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Паролі не збігаються",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
