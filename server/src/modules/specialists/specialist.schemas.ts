import { z } from "zod";

export const specialistsListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  injuryTypeId: z.string().uuid().optional(),
  specializationId: z.string().uuid().optional(),
  cityId: z.string().uuid().optional(),
  districtId: z.string().uuid().optional(),
  maxBudget: z.coerce.number().positive().optional(),
  formatId: z.string().uuid().optional(),
  inclusiveOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  sort: z
    .enum(["price_asc", "price_desc", "experience_desc", "experience_asc", "rating_desc", "newest"])
    .default("rating_desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

export const updateSpecialistProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(5000).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  pricePerSession: z.number().min(0).max(100_000).optional(),
  cityId: z.string().uuid().nullable().optional(),
  districtId: z.string().uuid().nullable().optional(),
  inclusiveSpace: z.boolean().optional(),
  photoUrl: z.string().url().max(500).nullable().optional(),
  specializationIds: z.array(z.string().uuid()).min(1).max(5).optional(),
  injuryTypeIds: z.array(z.string().uuid()).min(1).max(10).optional(),
  formatIds: z.array(z.string().uuid()).min(1).max(3).optional(),
});

export const replaceServicesSchema = z.object({
  services: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(120),
        description: z.string().trim().max(1000).optional(),
        price: z.number().min(0).max(100_000),
      }),
    )
    .max(20),
});

export const adminSpecialistsQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const adminVerificationSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});
