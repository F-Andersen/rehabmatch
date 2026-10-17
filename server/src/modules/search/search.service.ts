import { Prisma } from "@prisma/client";
import { AppError } from "../../lib/http-errors.js";
import { prisma } from "../../lib/prisma.js";
import type { createSearchRequestSchema } from "./search.schemas.js";
import type { z } from "zod";
import type { FiltersSnapshot } from "./search.schemas.js";

type CreateInput = z.infer<typeof createSearchRequestSchema>;

async function validateForeignKeys(input: CreateInput) {
  const injury = await prisma.injuryType.findUnique({ where: { id: input.injuryTypeId } });
  if (!injury) throw new AppError(400, "VALIDATION_ERROR", "Невідомий тип травми");

  if (input.specializationId) {
    const spec = await prisma.specialization.findUnique({ where: { id: input.specializationId } });
    if (!spec) throw new AppError(400, "VALIDATION_ERROR", "Невідома спеціалізація");
  }

  if (input.cityId) {
    const city = await prisma.city.findUnique({ where: { id: input.cityId } });
    if (!city) throw new AppError(400, "VALIDATION_ERROR", "Невідоме місто");
  }

  if (input.districtId) {
    const district = await prisma.district.findUnique({ where: { id: input.districtId } });
    if (!district) throw new AppError(400, "VALIDATION_ERROR", "Невідомий район");
    if (input.cityId && district.cityId !== input.cityId) {
      throw new AppError(400, "VALIDATION_ERROR", "Район не належить обраному місту");
    }
  }

  if (input.formatId) {
    const format = await prisma.appointmentFormat.findUnique({ where: { id: input.formatId } });
    if (!format) throw new AppError(400, "VALIDATION_ERROR", "Невідомий формат прийому");
  }
}

function buildFiltersSnapshot(input: CreateInput): FiltersSnapshot {
  return {
    injuryTypeId: input.injuryTypeId,
    specializationId: input.specializationId ?? null,
    cityId: input.cityId ?? null,
    districtId: input.districtId ?? null,
    formatId: input.formatId ?? null,
    maxBudget: input.maxBudget,
    cityOnly: input.cityOnly ?? false,
    inclusiveOnly: input.inclusiveOnly ?? false,
    formatStrict: input.formatStrict ?? false,
  };
}

export async function createSearchRequest(patientId: string, input: CreateInput) {
  await validateForeignKeys(input);
  const filtersSnapshot = buildFiltersSnapshot(input);

  const created = await prisma.searchRequest.create({
    data: {
      patientId,
      injuryTypeId: input.injuryTypeId,
      cityId: input.cityId ?? null,
      districtId: input.districtId ?? null,
      formatId: input.formatId ?? null,
      maxBudget: new Prisma.Decimal(input.maxBudget),
      cityOnly: input.cityOnly ?? false,
      inclusiveOnly: input.inclusiveOnly ?? false,
      preferenceMode: input.preferenceMode,
      filtersSnapshot,
    },
  });

  return mapSearchRequest(created);
}

export async function getSearchRequestForPatient(patientId: string, searchRequestId: string) {
  const row = await prisma.searchRequest.findFirst({
    where: { id: searchRequestId, patientId },
    include: {
      comparisons: { include: { criterionA: true, criterionB: true } },
      priorities: { include: { criterion: true } },
      recommendations: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Пошуковий запит не знайдено");
  }
  return mapSearchRequestDetail(row);
}

function mapSearchRequest(row: {
  id: string;
  preferenceMode: string;
  maxBudget: Prisma.Decimal;
  cityOnly: boolean;
  inclusiveOnly: boolean;
  filtersSnapshot: unknown;
  createdAt: Date;
}) {
  const snapshot = row.filtersSnapshot as FiltersSnapshot;
  return {
    id: row.id,
    preferenceMode: row.preferenceMode,
    maxBudget: Number(row.maxBudget),
    cityOnly: row.cityOnly,
    inclusiveOnly: row.inclusiveOnly,
    filtersSnapshot: snapshot,
    createdAt: row.createdAt,
  };
}

function mapSearchRequestDetail(row: {
  id: string;
  preferenceMode: string;
  maxBudget: Prisma.Decimal;
  cityOnly: boolean;
  inclusiveOnly: boolean;
  consistencyRatio: number | null;
  filtersSnapshot: unknown;
  createdAt: Date;
  comparisons: Array<{
    value: number;
    criterionA: { key: string };
    criterionB: { key: string };
  }>;
  priorities: Array<{
    weight: number;
    rawValue: number | null;
    criterion: { key: string };
  }>;
  recommendations: Array<{ id: string }>;
}) {
  return {
    ...mapSearchRequest(row),
    consistencyRatio: row.consistencyRatio,
    comparisons: row.comparisons.map((item) => ({
      criterionA: item.criterionA.key,
      criterionB: item.criterionB.key,
      value: item.value,
    })),
    priorities: row.priorities.map((item) => ({
      key: item.criterion.key,
      weight: item.weight,
      rawValue: item.rawValue,
    })),
    latestRecommendationId: row.recommendations[0]?.id ?? null,
  };
}

export function filtersFromSnapshot(snapshot: FiltersSnapshot) {
  return {
    injuryTypeId: snapshot.injuryTypeId,
    specializationId: snapshot.specializationId ?? undefined,
    maxBudget: snapshot.maxBudget,
    cityId: snapshot.cityId ?? undefined,
    districtId: snapshot.districtId ?? undefined,
    formatId: snapshot.formatId ?? undefined,
    cityOnly: snapshot.cityOnly,
    inclusiveOnly: snapshot.inclusiveOnly,
    formatStrict: snapshot.formatStrict,
  };
}
