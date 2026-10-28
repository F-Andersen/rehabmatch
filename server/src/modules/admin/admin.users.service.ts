import { UserRole } from "@prisma/client";
import { AppError } from "../../lib/http-errors.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";

export const adminUsersQuerySchema = z.object({
  q: z.string().trim().max(254).optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;

export async function listUsersForAdmin(query: AdminUsersQuery) {
  const where = {
    ...(query.q ? { OR: [
      { fullName: { contains: query.q, mode: "insensitive" as const } },
      { email: { contains: query.q, mode: "insensitive" as const } },
    ] } : {}),
    ...(query.role ? { role: query.role } : {}),
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
  };
  const skip = (query.page - 1) * query.pageSize;
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    data: users,
    meta: buildPaginationMeta(query.page, query.pageSize, total),
  };
}

export async function updateUserActiveStatus(userId: string, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "Користувача не знайдено");
  }
  if (user.role === UserRole.ADMIN && !isActive) {
    throw new AppError(422, "VALIDATION_ERROR", "Не можна деактивувати обліковий запис адміністратора");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return updated;
}
