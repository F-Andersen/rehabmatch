import type { Prisma } from "@prisma/client";
import type { RankedSpecialist } from "../../algorithms/types.js";

export function mapSpecialistToScoring(row: {
  id: string;
  experienceYears: number;
  pricePerSession: Prisma.Decimal;
  ratingAvg: number | null;
  ratingCount: number;
  cityId: string | null;
  districtId: string | null;
  inclusiveSpace: boolean;
  verificationStatus: string;
  isVisible: boolean;
  injuryTypes: { injuryTypeId: string }[];
  specializations: { specializationId: string }[];
  appointmentFormats: { formatId: string }[];
}) {
  return {
    id: row.id,
    experienceYears: row.experienceYears,
    pricePerSession: Number(row.pricePerSession),
    ratingAvg: row.ratingAvg ?? 0,
    ratingCount: row.ratingCount,
    cityId: row.cityId,
    districtId: row.districtId,
    formatIds: row.appointmentFormats.map((item) => item.formatId),
    injuryTypeIds: row.injuryTypes.map((item) => item.injuryTypeId),
    specializationIds: row.specializations.map((item) => item.specializationId),
    inclusiveSpace: row.inclusiveSpace,
    verificationStatus: row.verificationStatus,
    isVisible: row.isVisible,
  };
}

export function mapRankedItemToPersistence(item: RankedSpecialist) {
  return {
    specialistId: item.specialistId,
    rankPosition: item.rankPosition,
    matchScore: item.score,
    scoreBreakdown: item.factors.map((factor) => ({
      key: factor.key,
      weight: factor.weight,
      normalizedValue: factor.normalizedValue,
      contribution: factor.contribution,
      rawLabel: factor.rawLabel,
    })),
    explanation: item.explanation,
  };
}

export function mapRecommendationResponse(
  recommendation: {
    id: string;
    method: string;
    algorithmVersion: string;
    createdAt: Date;
    weightsSnapshot: unknown;
    searchRequest: { consistencyRatio: number | null };
    items: Array<{
      rankPosition: number;
      matchScore: number;
      specialistId: string;
      scoreBreakdown: unknown;
      explanation: unknown;
      specialist: {
        user: { fullName: string };
        city: { name: string } | null;
        experienceYears: number;
        pricePerSession: Prisma.Decimal;
        ratingAvg: number | null;
        ratingCount: number;
        specializations: { specialization: { name: string } }[];
      };
    }>;
  },
  consistencyRatio: number | null,
) {
  const snapshot = recommendation.weightsSnapshot as
    | Record<string, number>
    | { weights: Record<string, number> };
  const weights =
    typeof snapshot === "object" && snapshot && "weights" in snapshot
      ? snapshot.weights
      : (snapshot as Record<string, number>);
  return {
    id: recommendation.id,
    mode: recommendation.method,
    algorithmVersion: recommendation.algorithmVersion,
    consistencyRatio,
    weights,
    createdAt: recommendation.createdAt,
    items: recommendation.items
      .sort((a, b) => a.rankPosition - b.rankPosition)
      .map((item) => ({
        rankPosition: item.rankPosition,
        specialistId: item.specialistId,
        matchScore: item.matchScore,
        matchScorePercent: Math.round(item.matchScore * 1000) / 10,
        fullName: item.specialist.user.fullName,
        city: item.specialist.city?.name ?? null,
        experienceYears: item.specialist.experienceYears,
        pricePerSession: Number(item.specialist.pricePerSession),
        ratingAvg: item.specialist.ratingAvg ?? 0,
        ratingCount: item.specialist.ratingCount,
        specializations: item.specialist.specializations.map((s) => s.specialization.name),
        factors: item.scoreBreakdown,
        explanation: item.explanation,
      })),
  };
}
