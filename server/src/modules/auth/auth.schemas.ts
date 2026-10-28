import { UserRole } from "@prisma/client";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Пароль має містити щонайменше 8 символів")
  .max(128, "Пароль занадто довгий");

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Вкажіть ім'я").max(120),
  email: z.string().trim().email("Некоректна електронна пошта").max(254),
  password: passwordSchema,
  role: z.enum([UserRole.PATIENT, UserRole.SPECIALIST]),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Некоректна електронна пошта").max(254),
  password: z.string().min(1, "Вкажіть пароль").max(128),
});

export const updateMeSchema = z.object({
  cityId: z.string().uuid().nullable().optional(),
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(32).refine((value) => {
    const digits = value.replace(/\D/g, "");
    return value === "" || (/^\+?[0-9 ()-]+$/.test(value) && digits.length >= 10 && digits.length <= 15);
  }, "Вкажіть номер телефону: від 10 до 15 цифр")
    .transform((value) => value.replace(/[ ()-]/g, "") || null).nullable().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
