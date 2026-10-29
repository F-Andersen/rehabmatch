import { z } from "zod";

export const matchingSearchSchema = z.object({
  injuryTypeId: z.string().uuid("Оберіть тип травми"),
  specializationId: z.string().uuid().optional().or(z.literal("")),
  cityId: z.string().uuid().optional().or(z.literal("")),
  districtId: z.string().uuid().optional().or(z.literal("")),
  formatId: z.string().uuid().optional().or(z.literal("")),
  maxBudget: z.coerce.number().positive("Бюджет має бути додатним").max(100_000),
  cityOnly: z.boolean(),
  inclusiveOnly: z.boolean(),
  formatStrict: z.boolean(),
  preferenceMode: z.enum(["AHP_PAIRWISE", "DIRECT_WSM"]),
});

export type MatchingSearchFormValues = z.infer<typeof matchingSearchSchema>;
export type MatchingSearchFormInput = z.input<typeof matchingSearchSchema>;
