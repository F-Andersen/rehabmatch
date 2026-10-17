import { z } from "zod";
import { AppError } from "./http-errors.js";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function buildPaginationMeta(page: number, pageSize: number, total: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

export function parsePagination(query: Record<string, unknown>): PaginationQuery {
  const parsed = paginationQuerySchema.safeParse(query);
  if (!parsed.success) {
    throw new AppError(400, "VALIDATION_ERROR", "Некоректні параметри пагінації", parsed.error.flatten());
  }
  return parsed.data;
}
