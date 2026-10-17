import { PreferenceMode, SpecialistStatus } from "@prisma/client";
import { calculateDirectWeights } from "../../algorithms/direct-wsm.js";
import { runPairwiseAhp } from "../../algorithms/ahp/pairwise.js";
import { ALGORITHM_VERSION, CR_THRESHOLD } from "../../algorithms/config.js";
import { rankSpecialists } from "../../algorithms/ranking/rank-specialists.js";
import type { CriterionKey } from "../../algorithms/types.js";
import { CRITERION_KEYS } from "../../algorithms/types.js";
import { AppError } from "../../lib/http-errors.js";
import { buildPaginationMeta } from "../../lib/pagination.js";
import { prisma } from "../../lib/prisma.js";
import type { FiltersSnapshot } from "../search/search.schemas.js";
import { filtersFromSnapshot as parseFilters } from "../search/search.service.js";
import {
  mapRankedItemToPersistence,
  mapRecommendationResponse,
  mapSpecialistToScoring,
} from "./recommendation.mapper.js";
import type { createRecommendationSchema, listRecommendationsQuerySchema } from "./recommendation.schemas.js";
import type { z } from "zod";

type CreateInput = z.infer<typeof createRecommendationSchema>;
type ListQuery = z.infer<typeof listRecommendationsQuerySchema>;

async function getCriterionIdMap() {
  const rows = await prisma.criterion.findMany();
  const map = new Map<CriterionKey, string>();
  for (const row of rows) {
    map.set(row.key as CriterionKey, row.id);
  }
  for (const key of CRITERION_KEYS) {
    if (!map.has(key)) {
      throw new AppError(500, "SEED_DATA_MISSING", "Довідник критеріїв недоступний");
    }
  }
  return map;
}

async function loadScoringSpecialists() {
  const rows = await prisma.specialist.findMany({
    where: {
      verificationStatus: SpecialistStatus.APPROVED,
      isVisible: true,
      cityId: { not: null },
    },
    include: {
      injuryTypes: true,
      specializations: true,
      appointmentFormats: true,
    },
  });
  return rows.map(mapSpecialistToScoring);
}

export async function createRecommendation(patientId: string, input: CreateInput) {
  const searchRequest = await prisma.searchRequest.findFirst({
    where: { id: input.searchRequestId, patientId },
  });
  if (!searchRequest) {
    throw new AppError(404, "NOT_FOUND", "Пошуковий запит не знайдено");
  }

  if (searchRequest.preferenceMode !== input.mode) {
    throw new AppError(422, "MODE_MISMATCH", "Режим не збігається з пошуковим запитом");
  }

  const existing = await prisma.recommendation.findFirst({
    where: { searchRequestId: input.searchRequestId },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    throw new AppError(409, "DUPLICATE_RECOMMENDATION", "Рекомендація для цього запиту вже створена", {
      recommendationId: existing.id,
    });
  }

  let weights: Record<CriterionKey, number>;
  let consistencyRatio: number | null = null;
  let lambdaMax: number | null = null;
  let ci: number | null = null;

  if (input.mode === PreferenceMode.AHP_PAIRWISE) {
    const ahp = runPairwiseAhp({ comparisons: input.comparisons });
    if (!ahp.isConsistent) {
      throw new AppError(422, "AHP_INCONSISTENT", "Порівняння суперечливі", {
        cr: ahp.cr,
        threshold: CR_THRESHOLD,
        weights: ahp.weights,
      });
    }
    weights = ahp.weights;
    consistencyRatio = ahp.cr;
    lambdaMax = ahp.lambdaMax;
    ci = ahp.ci;
  } else {
    const wsm = calculateDirectWeights({ priorities: input.priorities });
    weights = wsm.weights;
  }

  const snapshot = searchRequest.filtersSnapshot as FiltersSnapshot;
  const filters = parseFilters(snapshot);
  const specialists = await loadScoringSpecialists();
  const ranked = rankSpecialists(specialists, weights, filters).slice(0, input.limit);

  const criterionIds = await getCriterionIdMap();

  const recommendation = await prisma.$transaction(async (tx) => {
    await tx.criterionComparison.deleteMany({ where: { searchRequestId: searchRequest.id } });
    await tx.criterionPriority.deleteMany({ where: { searchRequestId: searchRequest.id } });

    if (input.mode === PreferenceMode.AHP_PAIRWISE) {
      await tx.criterionComparison.createMany({
        data: input.comparisons.map((comparison) => ({
          searchRequestId: searchRequest.id,
          criterionAId: criterionIds.get(comparison.criterionA)!,
          criterionBId: criterionIds.get(comparison.criterionB)!,
          value: comparison.value,
        })),
      });
    } else {
      await tx.criterionPriority.createMany({
        data: CRITERION_KEYS.map((key) => ({
          searchRequestId: searchRequest.id,
          criterionId: criterionIds.get(key)!,
          rawValue: input.priorities[key],
          weight: weights[key],
        })),
      });
    }

    for (const key of CRITERION_KEYS) {
      if (input.mode === PreferenceMode.AHP_PAIRWISE) {
        await tx.criterionPriority.upsert({
          where: {
            searchRequestId_criterionId: {
              searchRequestId: searchRequest.id,
              criterionId: criterionIds.get(key)!,
            },
          },
          create: {
            searchRequestId: searchRequest.id,
            criterionId: criterionIds.get(key)!,
            weight: weights[key],
            rawValue: null,
          },
          update: { weight: weights[key] },
        });
      }
    }

    await tx.searchRequest.update({
      where: { id: searchRequest.id },
      data: { consistencyRatio },
    });

    const created = await tx.recommendation.create({
      data: {
        searchRequestId: searchRequest.id,
        method: input.mode,
        algorithmVersion: ALGORITHM_VERSION,
        weightsSnapshot: {
          weights,
          lambdaMax,
          ci,
          consistencyRatio,
        },
        items: {
          create: ranked.map(mapRankedItemToPersistence),
        },
      },
      include: {
        searchRequest: true,
        items: {
          include: {
            specialist: {
              include: {
                user: { select: { fullName: true } },
                city: true,
                specializations: { include: { specialization: true } },
              },
            },
          },
        },
      },
    });

    return created;
  });

  return mapRecommendationResponse(recommendation, consistencyRatio);
}

export async function getRecommendationForPatient(patientId: string, recommendationId: string) {
  const row = await prisma.recommendation.findFirst({
    where: {
      id: recommendationId,
      searchRequest: { patientId },
    },
    include: {
      searchRequest: true,
      items: {
        include: {
          specialist: {
            include: {
              user: { select: { fullName: true } },
              city: true,
              specializations: { include: { specialization: true } },
            },
          },
        },
      },
    },
  });
  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Рекомендацію не знайдено");
  }
  const snapshot = row.weightsSnapshot as { consistencyRatio?: number | null };
  return mapRecommendationResponse(row, snapshot.consistencyRatio ?? row.searchRequest.consistencyRatio);
}

export async function listRecommendationsForPatient(patientId: string, query: ListQuery) {
  const where = { searchRequest: { patientId } };
  const skip = (query.page - 1) * query.pageSize;
  const [total, items] = await Promise.all([
    prisma.recommendation.count({ where }),
    prisma.recommendation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: query.pageSize,
      include: {
        searchRequest: {
          include: {
            injuryType: true,
            city: true,
          },
        },
      },
    }),
  ]);

  return {
    data: items.map((item) => {
      const weights = item.weightsSnapshot as { weights?: Record<string, number> };
      const snapshot = item.searchRequest.filtersSnapshot as FiltersSnapshot;
      return {
        id: item.id,
        createdAt: item.createdAt,
        mode: item.method,
        algorithmVersion: item.algorithmVersion,
        injuryType: item.searchRequest.injuryType.name,
        city: item.searchRequest.city?.name ?? null,
        maxBudget: Number(item.searchRequest.maxBudget),
        filtersSnapshot: snapshot,
        weights: weights.weights ?? weights,
      };
    }),
    meta: buildPaginationMeta(query.page, query.pageSize, total),
  };
}
