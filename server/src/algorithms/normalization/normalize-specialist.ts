import {
  EXPERIENCE_YEARS_CAP,
  FORMAT_MATCH,
  FORMAT_NEUTRAL,
  FORMAT_NO_MATCH,
  LOCATION_NEUTRAL,
  LOCATION_OTHER_CITY,
  LOCATION_SAME_CITY,
  LOCATION_SAME_DISTRICT,
  PRICE_MAX_UAH,
  PRICE_MIN_UAH,
  RATING_MAX,
  RATING_MIN,
  RATING_MISSING_FALLBACK,
} from "../config.js";
import type { CriterionKey, RecommendationFilters, ScoringSpecialist } from "../types.js";
import { CRITERION_KEYS } from "../types.js";
import { clamp01 } from "./clamp.js";

export type NormalizedCriterion = {
  key: CriterionKey;
  value: number;
  rawLabel: string;
};

function normalizeExperience(years: number): NormalizedCriterion {
  const safeYears = Number.isFinite(years) && years > 0 ? years : 0;
  const value = clamp01(safeYears / EXPERIENCE_YEARS_CAP);
  return {
    key: "EXPERIENCE",
    value,
    rawLabel: `${safeYears} років досвіду`,
  };
}

function normalizePrice(price: number): NormalizedCriterion {
  const safePrice = Number.isFinite(price) && price >= 0 ? price : PRICE_MAX_UAH;
  const span = PRICE_MAX_UAH - PRICE_MIN_UAH;
  const value = span > 0 ? clamp01((PRICE_MAX_UAH - safePrice) / span) : 0;
  return {
    key: "PRICE",
    value,
    rawLabel: `${Math.round(safePrice)} грн за консультацію`,
  };
}

function normalizeRating(ratingAvg: number, ratingCount: number): NormalizedCriterion {
  if (ratingCount >= 1 && Number.isFinite(ratingAvg)) {
    const clampedRating = Math.min(RATING_MAX, Math.max(RATING_MIN, ratingAvg));
    const value = clamp01((clampedRating - RATING_MIN) / (RATING_MAX - RATING_MIN));
    return {
      key: "RATING",
      value,
      rawLabel: `рейтинг ${clampedRating.toFixed(1)} (${ratingCount} відгуків)`,
    };
  }
  return {
    key: "RATING",
    value: RATING_MISSING_FALLBACK,
    rawLabel: "недостатньо відгуків для рейтингу",
  };
}

function normalizeLocation(
  specialist: ScoringSpecialist,
  filters: RecommendationFilters,
): NormalizedCriterion {
  const preferredCityId = filters.cityId ?? null;
  const preferredDistrictId = filters.districtId ?? null;

  if (!preferredCityId) {
    return {
      key: "LOCATION",
      value: LOCATION_NEUTRAL,
      rawLabel: "місто не задано у запиті",
    };
  }

  if (!specialist.cityId) {
    return {
      key: "LOCATION",
      value: LOCATION_OTHER_CITY,
      rawLabel: "місто спеціаліста не вказано",
    };
  }

  if (specialist.cityId !== preferredCityId) {
    return {
      key: "LOCATION",
      value: LOCATION_OTHER_CITY,
      rawLabel: "інше місто, ніж у вашому запиті",
    };
  }

  if (preferredDistrictId && specialist.districtId === preferredDistrictId) {
    return {
      key: "LOCATION",
      value: LOCATION_SAME_DISTRICT,
      rawLabel: "той самий район",
    };
  }

  return {
    key: "LOCATION",
    value: LOCATION_SAME_CITY,
    rawLabel: "те саме місто",
  };
}

function normalizeFormat(
  specialist: ScoringSpecialist,
  filters: RecommendationFilters,
): NormalizedCriterion {
  const formatId = filters.formatId ?? null;
  if (!formatId) {
    return {
      key: "FORMAT",
      value: FORMAT_NEUTRAL,
      rawLabel: "формат консультації не задано",
    };
  }

  const supports = specialist.formatIds.includes(formatId);
  return {
    key: "FORMAT",
    value: supports ? FORMAT_MATCH : FORMAT_NO_MATCH,
    rawLabel: supports ? "підтримує обраний формат" : "не підтримує обраний формат",
  };
}

export function normalizeSpecialist(
  specialist: ScoringSpecialist,
  filters: RecommendationFilters,
): Record<CriterionKey, NormalizedCriterion> {
  const experience = normalizeExperience(specialist.experienceYears);
  const price = normalizePrice(specialist.pricePerSession);
  const rating = normalizeRating(specialist.ratingAvg, specialist.ratingCount);
  const location = normalizeLocation(specialist, filters);
  const format = normalizeFormat(specialist, filters);

  return {
    EXPERIENCE: experience,
    PRICE: price,
    RATING: rating,
    LOCATION: location,
    FORMAT: format,
  };
}

export function normalizedValuesRecord(
  normalized: Record<CriterionKey, NormalizedCriterion>,
): Record<CriterionKey, number> {
  return CRITERION_KEYS.reduce<Record<CriterionKey, number>>((acc, key) => {
    acc[key] = normalized[key].value;
    return acc;
  }, {} as Record<CriterionKey, number>);
}
