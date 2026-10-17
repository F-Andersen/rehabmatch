import type { RecommendationFilters, ScoringSpecialist } from "../types.js";

export function passesHardFilters(
  specialist: ScoringSpecialist,
  filters: RecommendationFilters,
): boolean {
  if (specialist.verificationStatus && specialist.verificationStatus !== "APPROVED") {
    return false;
  }
  if (specialist.isVisible === false) {
    return false;
  }

  if (filters.injuryTypeId && !specialist.injuryTypeIds.includes(filters.injuryTypeId)) {
    return false;
  }

  if (
    filters.specializationId &&
    !specialist.specializationIds.includes(filters.specializationId)
  ) {
    return false;
  }

  if (filters.maxBudget !== undefined && specialist.pricePerSession > filters.maxBudget) {
    return false;
  }

  if (filters.inclusiveOnly && !specialist.inclusiveSpace) {
    return false;
  }

  if (filters.cityOnly && filters.cityId && specialist.cityId !== filters.cityId) {
    return false;
  }

  if (filters.formatStrict && filters.formatId) {
    if (!specialist.formatIds.includes(filters.formatId)) {
      return false;
    }
  }

  return true;
}

export function filterCandidates(
  specialists: ScoringSpecialist[],
  filters: RecommendationFilters,
): ScoringSpecialist[] {
  return specialists.filter((specialist) => passesHardFilters(specialist, filters));
}
