import { describe, expect, it } from "vitest";
import { CONTRIBUTION_SUM_TOLERANCE } from "../config.js";
import { calculateDirectWeights } from "../direct-wsm.js";
import { runPairwiseAhp } from "../ahp/pairwise.js";
import { CRITERION_KEYS } from "../types.js";
import { lexicographicPairs } from "../ahp/matrix.js";
import type { RecommendationFilters, ScoringSpecialist, WeightsByKey } from "../types.js";
import { filterCandidates } from "./filters.js";
import { rankSpecialists } from "../ranking/rank-specialists.js";
import { scoreSpecialist } from "./score-specialist.js";

function equalWeights(): WeightsByKey {
  return {
    EXPERIENCE: 0.2,
    PRICE: 0.2,
    RATING: 0.2,
    LOCATION: 0.2,
    FORMAT: 0.2,
  };
}

function specialist(
  id: string,
  patch: Partial<ScoringSpecialist>,
): ScoringSpecialist {
  return {
    id,
    experienceYears: 5,
    pricePerSession: 1200,
    ratingAvg: 4,
    ratingCount: 3,
    cityId: "city-kyiv",
    districtId: null,
    formatIds: ["fmt-1"],
    injuryTypeIds: ["inj-1"],
    inclusiveSpace: false,
    verificationStatus: "APPROVED",
    isVisible: true,
    ...patch,
  };
}

const filters: RecommendationFilters = {
  injuryTypeId: "inj-1",
  maxBudget: 2000,
  cityId: "city-kyiv",
  formatId: "fmt-1",
  formatStrict: false,
};

describe("Scoring & ranking (SC-06..SC-09)", () => {
  it("SC-06 budget filter removes expensive specialists", () => {
    const candidates = [
      specialist("a", { pricePerSession: 2500 }),
      specialist("b", { pricePerSession: 1500 }),
    ];
    const filtered = filterCandidates(candidates, { maxBudget: 2000, injuryTypeId: "inj-1" });
    expect(filtered.map((s) => s.id)).toEqual(["b"]);
  });

  it("SC-07 stable deterministic ranking", () => {
    const weights = equalWeights();
    const candidates = [
      specialist("b", { ratingCount: 1 }),
      specialist("a", { ratingCount: 2 }),
      specialist("c", { ratingCount: 2 }),
    ];
    const first = rankSpecialists(candidates, weights, filters);
    const second = rankSpecialists(candidates, weights, filters);
    expect(first.map((item) => item.specialistId)).toEqual(second.map((item) => item.specialistId));
    expect(first[0].specialistId).toBe("a");
  });

  it("SC-08 contributions sum to match score", () => {
    const weights = equalWeights();
    const result = scoreSpecialist(specialist("x", {}), weights, filters);
    const sum = result.factors.reduce((acc, factor) => acc + factor.contribution, 0);
    expect(Math.abs(sum - result.score)).toBeLessThan(CONTRIBUTION_SUM_TOLERANCE);
  });

  it("SC-09 scores stay within [0,1]", () => {
    const comparisons = lexicographicPairs(CRITERION_KEYS).map(([a, b]) => ({
      criterionA: a,
      criterionB: b,
      value: 1,
    }));
    const weights = runPairwiseAhp({ comparisons }).weights;
    const ranked = rankSpecialists(
      [
        specialist("1", { experienceYears: 20, pricePerSession: 300, ratingAvg: 5, ratingCount: 10 }),
        specialist("2", { experienceYears: 1, pricePerSession: 3000, ratingCount: 0 }),
      ],
      weights,
      filters,
    );
    for (const item of ranked) {
      expect(item.score).toBeGreaterThanOrEqual(0);
      expect(item.score).toBeLessThanOrEqual(1);
    }
  });

  it("ranking example: price-priority weights reorder specialists", () => {
    const weights = calculateDirectWeights({
      priorities: { EXPERIENCE: 1, PRICE: 9, RATING: 1, LOCATION: 1, FORMAT: 1 },
    }).weights;
    const ranked = rankSpecialists(
      [
        specialist("cheap", { pricePerSession: 400, experienceYears: 3 }),
        specialist("expensive", { pricePerSession: 1900, experienceYears: 18 }),
        specialist("mid", { pricePerSession: 1200, experienceYears: 10 }),
      ],
      weights,
      filters,
    );
    expect(ranked[0].specialistId).toBe("cheap");
    const expensive = ranked.find((item) => item.specialistId === "expensive");
    const cheap = ranked.find((item) => item.specialistId === "cheap");
    expect(cheap!.score).toBeGreaterThan(expensive!.score);
    expect(ranked.length).toBe(3);
  });

  it("formatStrict excludes incompatible format before scoring", () => {
    const weights = equalWeights();
    const ranked = rankSpecialists(
      [
        specialist("ok", { formatIds: ["fmt-1"] }),
        specialist("bad", { formatIds: ["other"] }),
      ],
      weights,
      { ...filters, formatStrict: true },
    );
    expect(ranked).toHaveLength(1);
    expect(ranked[0].specialistId).toBe("ok");
  });
});
