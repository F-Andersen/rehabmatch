import { prisma } from "../../lib/prisma.js";

export async function getCatalogDictionaries() {
  const [specializations, injuryTypes, cities, districts, formats, criteria] = await Promise.all([
    prisma.specialization.findMany({ orderBy: { name: "asc" } }),
    prisma.injuryType.findMany({ orderBy: { name: "asc" } }),
    prisma.city.findMany({ orderBy: { name: "asc" } }),
    prisma.district.findMany({ orderBy: [{ cityId: "asc" }, { name: "asc" }] }),
    prisma.appointmentFormat.findMany({ orderBy: { name: "asc" } }),
    prisma.criterion.findMany({
      where: { isActive: true },
      orderBy: { key: "asc" },
    }),
  ]);

  return {
    specializations,
    injuryTypes,
    cities,
    districts,
    formats,
    criteria,
  };
}
