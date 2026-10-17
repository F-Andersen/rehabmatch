import { Prisma, SpecialistStatus } from "@prisma/client";
import { AppError } from "../../lib/http-errors.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import { prisma } from "../../lib/prisma.js";
import { mapPublicSpecialist, mapPublicSpecialistCard } from "./specialist.mapper.js";
import { specialistPublicInclude } from "./specialist.includes.js";
import type { z } from "zod";
import type { specialistsListQuerySchema } from "./specialist.schemas.js";

type ListQuery = z.infer<typeof specialistsListQuerySchema>;

function buildOrderBy(sort: ListQuery["sort"]): Prisma.SpecialistOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ pricePerSession: "asc" }, { id: "asc" }];
    case "price_desc":
      return [{ pricePerSession: "desc" }, { id: "asc" }];
    case "experience_asc":
      return [{ experienceYears: "asc" }, { id: "asc" }];
    case "experience_desc":
      return [{ experienceYears: "desc" }, { id: "asc" }];
    case "newest":
      return [{ createdAt: "desc" }, { id: "asc" }];
    case "rating_desc":
    default:
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }, { id: "asc" }];
  }
}

export async function listPublicSpecialists(query: ListQuery) {
  const where: Prisma.SpecialistWhereInput = {
    verificationStatus: SpecialistStatus.APPROVED,
    isVisible: true,
    cityId: { not: null },
  };

  if (query.cityId) where.cityId = query.cityId;
  if (query.districtId) where.districtId = query.districtId;
  if (query.maxBudget !== undefined) {
    where.pricePerSession = { lte: new Prisma.Decimal(query.maxBudget) };
  }
  if (query.inclusiveOnly) where.inclusiveSpace = true;
  if (query.specializationId) {
    where.specializations = { some: { specializationId: query.specializationId } };
  }
  if (query.injuryTypeId) {
    where.injuryTypes = { some: { injuryTypeId: query.injuryTypeId } };
  }
  if (query.formatId) {
    where.appointmentFormats = { some: { formatId: query.formatId } };
  }
  if (query.q) {
    const q = query.q;
    where.OR = [
      { user: { fullName: { contains: q, mode: "insensitive" } } },
      {
        specializations: {
          some: { specialization: { name: { contains: q, mode: "insensitive" } } },
        },
      },
    ];
  }

  const skip = (query.page - 1) * query.pageSize;
  const [total, items] = await Promise.all([
    prisma.specialist.count({ where }),
    prisma.specialist.findMany({
      where,
      include: specialistPublicInclude,
      orderBy: buildOrderBy(query.sort),
      skip,
      take: query.pageSize,
    }),
  ]);

  return {
    data: items.map(mapPublicSpecialistCard),
    meta: buildPaginationMeta(query.page, query.pageSize, total),
  };
}

export async function getPublicSpecialistById(id: string) {
  const specialist = await prisma.specialist.findFirst({
    where: {
      id,
      verificationStatus: SpecialistStatus.APPROVED,
      isVisible: true,
      cityId: { not: null },
    },
    include: specialistPublicInclude,
  });

  if (!specialist) {
    throw new AppError(404, "NOT_FOUND", "Спеціаліста не знайдено");
  }

  return mapPublicSpecialist(specialist);
}

export async function listApprovedReviews(specialistId: string, page: number, pageSize: number) {
  const approved = await prisma.specialist.findFirst({
    where: {
      id: specialistId,
      verificationStatus: SpecialistStatus.APPROVED,
      isVisible: true,
    },
    select: { id: true },
  });
  if (!approved) {
    throw new AppError(404, "NOT_FOUND", "Спеціаліста не знайдено");
  }

  const where = { specialistId, status: "APPROVED" as const };
  const skip = (page - 1) * pageSize;
  const [total, items] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        patient: { select: { user: { select: { fullName: true } } } },
      },
    }),
  ]);

  return {
    data: items.map((item) => ({
      id: item.id,
      rating: item.rating,
      comment: item.comment,
      createdAt: item.createdAt,
      authorName: item.patient.user.fullName,
    })),
    meta: buildPaginationMeta(page, pageSize, total),
  };
}
