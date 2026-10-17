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

export const ahpCalculateBodySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("AHP_PAIRWISE"),
    keys: z.array(criterionKeySchema).length(5).optional(),
    comparisons: z.array(comparisonSchema).length(10),
  }),
  z.object({
    mode: z.literal("DIRECT_WSM"),
    priorities: prioritiesSchema,
  }),
]);
