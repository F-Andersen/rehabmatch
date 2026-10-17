import type { ScoringSpecialist } from "../algorithms/types.js";

const INJURY = "injury-fixed";
const SPEC = "spec-fixed";
const FORMAT = "format-fixed";
const CITY = "city-fixed";

export const FIXED_FILTERS = {
  injuryTypeId: INJURY,
  maxBudget: 3000,
  cityId: CITY,
  cityOnly: true,
};

/** Deterministic cohort for sensitivity experiments (10 specialists). */
export function fixedCohortSpecialists(): ScoringSpecialist[] {
  const rows: Array<[string, number, number, number, number]> = [
    ["cohort-a", 15, 1800, 4.8, 12],
    ["cohort-b", 3, 900, 4.2, 5],
    ["cohort-c", 8, 1400, 4.5, 8],
    ["cohort-d", 20, 2500, 4.9, 20],
    ["cohort-e", 1, 700, 3.8, 2],
    ["cohort-f", 10, 1600, 4.6, 10],
    ["cohort-g", 5, 1100, 4.0, 4],
    ["cohort-h", 12, 2000, 4.7, 15],
    ["cohort-i", 7, 1300, 4.3, 6],
    ["cohort-j", 2, 800, 3.9, 3],
  ];

  return rows.map(([id, experienceYears, pricePerSession, ratingAvg, ratingCount]) => ({
    id,
    experienceYears,
    pricePerSession,
    ratingAvg,
    ratingCount,
    cityId: CITY,
    districtId: null,
    formatIds: [FORMAT],
    injuryTypeIds: [INJURY],
    specializationIds: [SPEC],
    inclusiveSpace: false,
    verificationStatus: "APPROVED",
    isVisible: true,
  }));
}

/** Pseudo-random but reproducible synthetic pool for performance benchmarks. */
export function generateSyntheticSpecialists(count: number): ScoringSpecialist[] {
  const specialists: ScoringSpecialist[] = [];
  for (let i = 0; i < count; i += 1) {
    const seed = (i * 9301 + 49297) % 233280;
    const experienceYears = seed % 25;
    const pricePerSession = 500 + (seed % 2000);
    const ratingAvg = 3 + (seed % 20) / 10;
    const ratingCount = seed % 30;
    specialists.push({
      id: `bench-${i.toString().padStart(5, "0")}`,
      experienceYears,
      pricePerSession,
      ratingAvg,
      ratingCount,
      cityId: CITY,
      districtId: null,
      formatIds: [FORMAT],
      injuryTypeIds: [INJURY],
      specializationIds: [SPEC],
      inclusiveSpace: i % 7 === 0,
      verificationStatus: "APPROVED",
      isVisible: true,
    });
  }
  return specialists;
}
