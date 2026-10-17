import { CONTRIBUTION_SUM_TOLERANCE } from "../config.js";
import { normalizeSpecialist } from "../normalization/normalize-specialist.js";
import type {
  CriterionFactor,
  RecommendationFilters,
  ScoringSpecialist,
  WeightsByKey,
} from "../types.js";
import { CRITERION_KEYS } from "../types.js";
import { buildExplanation } from "../explanation/build-explanation.js";

export type ScoreSpecialistResult = {
  specialistId: string;
  score: number;
  factors: CriterionFactor[];
  explanation: string[];
};

export function scoreSpecialist(
  specialist: ScoringSpecialist,
  weights: WeightsByKey,
  filters: RecommendationFilters,
): ScoreSpecialistResult {
  const normalized = normalizeSpecialist(specialist, filters);
  const factors: CriterionFactor[] = CRITERION_KEYS.map((key) => {
    const weight = weights[key];
    const normalizedValue = normalized[key].value;
    const contribution = weight * normalizedValue;
    return {
      key,
      weight,
      normalizedValue,
      contribution,
      rawLabel: normalized[key].rawLabel,
    };
  });

  const score = factors.reduce((acc, factor) => acc + factor.contribution, 0);
  const contributionSum = factors.reduce((acc, factor) => acc + factor.contribution, 0);
  if (Math.abs(contributionSum - score) > CONTRIBUTION_SUM_TOLERANCE) {
    throw new Error("Contribution sum mismatch");
  }

  const explanation = buildExplanation(factors, weights);

  return {
    specialistId: specialist.id,
    score,
    factors,
    explanation,
  };
}
