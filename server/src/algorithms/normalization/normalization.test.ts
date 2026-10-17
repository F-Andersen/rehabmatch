import { describe, expect, it } from "vitest";
import {
  EXPERIENCE_YEARS_CAP,
  PRICE_MAX_UAH,
  PRICE_MIN_UAH,
  RATING_MISSING_FALLBACK,
} from "../config.js";
import type { RecommendationFilters, ScoringSpecialist } from "../types.js";
import { normalizeSpecialist } from "./normalize-specialist.js";

function baseSpecialist(overrides: Partial<ScoringSpecialist> = {}): ScoringSpecialist {
  return {
    id: "spec-1",
    experienceYears: 10,
    pricePerSession: 1000,
    ratingAvg: 4,
    ratingCount: 5,
    cityId: "city-a",
    districtId: "dist-a",
    formatIds: ["fmt-online"],
    injuryTypeIds: ["inj-1"],
    inclusiveSpace: true,
    verificationStatus: "APPROVED",
    isVisible: true,
    ...overrides,
  };
}

const filters: RecommendationFilters = {
  cityId: "city-a",
  districtId: "dist-a",
  formatId: "fmt-online",
  maxBudget: 2000,
};

describe("Normalization (SC-01..SC-05)", () => {
  it("SC-01 experience at cap normalizes to 1", () => {
    const norm = normalizeSpecialist(
      baseSpecialist({ experienceYears: EXPERIENCE_YEARS_CAP }),
      filters,
    );
    expect(norm.EXPERIENCE.value).toBe(1);
  });

  it("SC-02 price bounds", () => {
    const low = normalizeSpecialist(baseSpecialist({ pricePerSession: PRICE_MIN_UAH }), filters);
    const high = normalizeSpecialist(baseSpecialist({ pricePerSession: PRICE_MAX_UAH }), filters);
    expect(low.PRICE.value).toBe(1);
    expect(high.PRICE.value).toBe(0);
  });

  it("SC-03 zero reviews use fallback 0.5", () => {
    const norm = normalizeSpecialist(baseSpecialist({ ratingCount: 0, ratingAvg: 0 }), filters);
    expect(norm.RATING.value).toBe(RATING_MISSING_FALLBACK);
  });

  it("SC-04 non-matching city", () => {
    const norm = normalizeSpecialist(baseSpecialist({ cityId: "city-b" }), filters);
    expect(norm.LOCATION.value).toBe(0.2);
  });

  it("SC-05 format mismatch soft score", () => {
    const norm = normalizeSpecialist(
      baseSpecialist({ formatIds: ["other"] }),
      { ...filters, formatStrict: false },
    );
    expect(norm.FORMAT.value).toBe(0);
  });

  it("values stay within [0,1] and finite", () => {
    const norm = normalizeSpecialist(
      baseSpecialist({
        experienceYears: 999,
        pricePerSession: -100,
        ratingAvg: NaN,
        ratingCount: 0,
      }),
      {},
    );
    for (const key of Object.keys(norm) as Array<keyof typeof norm>) {
      expect(norm[key].value).toBeGreaterThanOrEqual(0);
      expect(norm[key].value).toBeLessThanOrEqual(1);
      expect(Number.isFinite(norm[key].value)).toBe(true);
    }
  });
});
