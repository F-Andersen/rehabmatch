import { ReviewStatus } from "@prisma/client";
import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(2000),
});

export const adminReviewStatusSchema = z.object({
  status: z.enum([ReviewStatus.APPROVED, ReviewStatus.REJECTED]),
});

export const adminReviewsQuerySchema = z.object({
  status: z.enum([ReviewStatus.PENDING, ReviewStatus.APPROVED, ReviewStatus.REJECTED]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
