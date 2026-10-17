import { PreferenceMode } from "@prisma/client";
import { z } from "zod";
import { CRITERION_KEYS } from "../../algorithms/types.js";

const criterionKeySchema = z.enum(CRITERION_KEYS);

const comparisonSchema = z.object({
  criterionA: criterionKeySchema,
  criterionB: criterionKeySchema,
  value: z.number().finite().positive(),
});

const prioritiesSchema = z.object({
  EXPERIENCE: z.number().int().min(1).max(9),
  PRICE: z.number().int().min(1).max(9),
  RATING: z.number().int().min(1).max(9),
  LOCATION: z.number().int().min(1).max(9),
  FORMAT: z.number().int().min(1).max(9),
});

export const createRecommendationSchema = z.discriminatedUnion("mode", [
  z.object({
    searchRequestId: z.string().uuid(),
    mode: z.literal(PreferenceMode.AHP_PAIRWISE),
    comparisons: z.array(comparisonSchema).length(10),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    idempotencyKey: z.string().max(120).optional(),
  }),
  z.object({
    searchRequestId: z.string().uuid(),
    mode: z.literal(PreferenceMode.DIRECT_WSM),
    priorities: prioritiesSchema,
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    idempotencyKey: z.string().max(120).optional(),
  }),
]);

export const listRecommendationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});
