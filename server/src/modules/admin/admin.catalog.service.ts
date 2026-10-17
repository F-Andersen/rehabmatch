import { AppError } from "../../lib/http-errors.js";
import { prisma } from "../../lib/prisma.js";
import { z } from "zod";

const CATALOG_TYPES = [
  "injury-types",
  "specializations",
  "cities",
  "districts",
  "appointment-formats",
] as const;

export type CatalogType = (typeof CATALOG_TYPES)[number];

export function parseCatalogType(type: string): CatalogType {
  if (!CATALOG_TYPES.includes(type as CatalogType)) {
    throw new AppError(400, "VALIDATION_ERROR", "Невідомий тип довідника");
  }
  return type as CatalogType;
}

export const catalogCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  cityId: z.string().uuid().optional(),
});

export const catalogPatchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(500).optional(),
});

export async function listCatalogAdmin(type: CatalogType) {
  switch (type) {
    case "injury-types":
      return prisma.injuryType.findMany({ orderBy: { name: "asc" } });
    case "specializations":
      return prisma.specialization.findMany({ orderBy: { name: "asc" } });
    case "cities":
      return prisma.city.findMany({ orderBy: { name: "asc" } });
    case "districts":
      return prisma.district.findMany({
        orderBy: [{ city: { name: "asc" } }, { name: "asc" }],
        include: { city: { select: { id: true, name: true } } },
      });
    case "appointment-formats":
      return prisma.appointmentFormat.findMany({ orderBy: { name: "asc" } });
    default:
      throw new AppError(400, "VALIDATION_ERROR", "Невідомий тип довідника");
  }
}

export async function createCatalogAdmin(
  type: CatalogType,
  input: z.infer<typeof catalogCreateSchema>,
) {
  switch (type) {
    case "injury-types":
      return prisma.injuryType.create({
        data: { name: input.name, description: input.description ?? null },
      });
    case "specializations":
      return prisma.specialization.create({
        data: { name: input.name, description: input.description ?? null },
      });
    case "cities":
      return prisma.city.create({ data: { name: input.name } });
    case "districts": {
      if (!input.cityId) {
        throw new AppError(400, "VALIDATION_ERROR", "cityId обовʼязковий для району");
      }
      return prisma.district.create({
        data: { cityId: input.cityId, name: input.name },
        include: { city: { select: { id: true, name: true } } },
      });
    }
    case "appointment-formats":
      return prisma.appointmentFormat.create({ data: { name: input.name } });
    default:
      throw new AppError(400, "VALIDATION_ERROR", "Невідомий тип довідника");
  }
}

export async function patchCatalogAdmin(
  type: CatalogType,
  id: string,
  input: z.infer<typeof catalogPatchSchema>,
) {
  const data = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
  };

  switch (type) {
    case "injury-types":
      return prisma.injuryType.update({ where: { id }, data });
    case "specializations":
      return prisma.specialization.update({ where: { id }, data });
    case "cities":
      return prisma.city.update({
        where: { id },
        data: input.name !== undefined ? { name: input.name } : {},
      });
    case "districts":
      return prisma.district.update({
        where: { id },
        data: input.name !== undefined ? { name: input.name } : {},
        include: { city: { select: { id: true, name: true } } },
      });
    case "appointment-formats":
      return prisma.appointmentFormat.update({
        where: { id },
        data: input.name !== undefined ? { name: input.name } : {},
      });
    default:
      throw new AppError(400, "VALIDATION_ERROR", "Невідомий тип довідника");
  }
}
