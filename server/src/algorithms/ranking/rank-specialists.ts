import type {
  RankedSpecialist,
  RecommendationFilters,
  ScoringSpecialist,
  WeightsByKey,
} from "../types.js";
import { filterCandidates } from "../scoring/filters.js";
import { scoreSpecialist } from "../scoring/score-specialist.js";

export function rankSpecialists(
  specialists: ScoringSpecialist[],
  weights: WeightsByKey,
  filters: RecommendationFilters,
): RankedSpecialist[] {
  const eligible = filterCandidates(specialists, filters);
  const scored = eligible.map((specialist) => {
    const result = scoreSpecialist(specialist, weights, filters);
    return { specialist, result };
  });

  scored.sort((a, b) => {
    if (b.result.score !== a.result.score) {
      return b.result.score - a.result.score;
    }
    if (b.specialist.ratingCount !== a.specialist.ratingCount) {
      return b.specialist.ratingCount - a.specialist.ratingCount;
    }
    return a.specialist.id.localeCompare(b.specialist.id);
  });

  return scored.map((entry, index) => ({
    specialistId: entry.result.specialistId,
    rankPosition: index + 1,
    matchScore: Number(entry.result.score.toFixed(3)),
    score: entry.result.score,
    factors: entry.result.factors,
    explanation: entry.result.explanation,
  }));
}
