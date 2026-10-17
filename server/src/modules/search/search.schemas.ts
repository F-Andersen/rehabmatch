import { PreferenceMode } from "@prisma/client";
import { z } from "zod";

export const createSearchRequestSchema = z.object({
  injuryTypeId: z.string().uuid(),
  specializationId: z.string().uuid().optional(),
  cityId: z.string().uuid().nullable().optional(),
  districtId: z.string().uuid().nullable().optional(),
  formatId: z.string().uuid().nullable().optional(),
  maxBudget: z.coerce.number().positive().max(100_000),
  cityOnly: z.boolean().optional().default(false),
  inclusiveOnly: z.boolean().optional().default(false),
  formatStrict: z.boolean().optional().default(false),
  preferenceMode: z.nativeEnum(PreferenceMode),
});

export type FiltersSnapshot = {
  injuryTypeId: string;
  specializationId?: string | null;
  cityId?: string | null;
  districtId?: string | null;
  formatId?: string | null;
  maxBudget: number;
  cityOnly: boolean;
  inclusiveOnly: boolean;
  formatStrict: boolean;
};
