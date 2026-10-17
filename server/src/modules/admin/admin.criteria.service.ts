import { CriterionKey } from "@prisma/client";
import { AppError } from "../../lib/http-errors.js";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";

const REQUIRED_KEYS: CriterionKey[] = [
  CriterionKey.EXPERIENCE,
  CriterionKey.PRICE,
  CriterionKey.RATING,
  CriterionKey.LOCATION,
  CriterionKey.FORMAT,
];

export const criteriaPatchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

export async function listCriteriaAdmin() {
  return prisma.criterion.findMany({ orderBy: { key: "asc" } });
}

export async function patchCriterionAdmin(id: string, input: z.infer<typeof criteriaPatchSchema>) {
  const criterion = await prisma.criterion.findUnique({ where: { id } });
  if (!criterion) {
    throw new AppError(404, "NOT_FOUND", "Критерій не знайдено");
  }

  if (input.isActive === false && REQUIRED_KEYS.includes(criterion.key)) {
    throw new AppError(
      422,
      "VALIDATION_ERROR",
      "Не можна деактивувати обовʼязковий критерій алгоритму",
    );
  }

  return prisma.criterion.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
}
