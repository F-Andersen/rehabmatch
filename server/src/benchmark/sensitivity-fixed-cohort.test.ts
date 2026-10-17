import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runPairwiseAhp } from "../algorithms/ahp/pairwise.js";
import { rankSpecialists } from "../algorithms/ranking/rank-specialists.js";
import type { CriterionKey } from "../algorithms/types.js";
import { FIXED_FILTERS, fixedCohortSpecialists } from "./synthetic-specialists.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const scenarios = JSON.parse(
  readFileSync(join(repoRoot, "fixtures/demo-scenarios.json"), "utf-8"),
) as Array<{
  id: string;
  comparisons: Array<{ criterionA: string; criterionB: string; value: number }>;
}>;

const cohort = fixedCohortSpecialists();

function top5(scenarioId: string) {
  const scenario = scenarios.find((s) => s.id === scenarioId);
  expect(scenario).toBeTruthy();
  const ahp = runPairwiseAhp({
    comparisons: scenario!.comparisons.map((c) => ({
      criterionA: c.criterionA as CriterionKey,
      criterionB: c.criterionB as CriterionKey,
      value: c.value,
    })),
  });
  expect(ahp.isConsistent).toBe(true);
  const ranked = rankSpecialists(cohort, ahp.weights, FIXED_FILTERS).slice(0, 5);
  return { weights: ahp.weights, ranked };
}

describe("M7 fixed cohort sensitivity", () => {
  it("same 10 candidates — equal vs PRICE vs EXPERIENCE weights change ranking", () => {
    const equal = top5("DEMO-EQUAL");
    const price = top5("DEMO-PRICE");
    const experience = top5("DEMO-EXPERIENCE");

    expect(equal.ranked.length).toBe(5);
    expect(price.ranked.length).toBe(5);
    expect(experience.ranked.length).toBe(5);

    const equalTop = equal.ranked[0]!.specialistId;
    const priceTop = price.ranked[0]!.specialistId;
    const expTop = experience.ranked[0]!.specialistId;

    expect(price.weights.PRICE).toBeGreaterThan(price.weights.EXPERIENCE);
    expect(experience.weights.EXPERIENCE).toBeGreaterThan(experience.weights.PRICE);

    expect(priceTop).toBe("cohort-e");
    expect(expTop).toBe("cohort-d");

    const orderChanged =
      equal.ranked.map((r) => r.specialistId).join(",") !==
      price.ranked.map((r) => r.specialistId).join(",");
    expect(orderChanged).toBe(true);
  });
});
