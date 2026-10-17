import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AppError } from "../../lib/http-errors.js";
import { CRITERION_KEYS } from "../types.js";
import { calculateAhpFromMatrix } from "./calculate-ahp.js";
import { buildReciprocalMatrix, lexicographicPairs } from "./matrix.js";
import { runPairwiseAhp } from "./pairwise.js";
import { isAllowedSaatyValue } from "./saaty.js";
import { calculateDirectWeights } from "../direct-wsm.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const reference = JSON.parse(
  readFileSync(join(repoRoot, "fixtures/ahp-reference.json"), "utf-8"),
) as {
  matrix: number[][];
  expected: { weights: number[]; lambdaMax: number; ci: number; cr: number };
  tolerances: { weights: number; cr: number };
};

const demoScenarios = JSON.parse(
  readFileSync(join(repoRoot, "fixtures/demo-scenarios.json"), "utf-8"),
) as Array<{
  id: string;
  comparisons: { criterionA: string; criterionB: string; value: number }[];
  expected: { weights: Record<string, number>; cr: number };
}>;

function allOnesComparisons() {
  return lexicographicPairs(CRITERION_KEYS).map(([criterionA, criterionB]) => ({
    criterionA,
    criterionB,
    value: 1,
  }));
}

describe("AHP geometric mean (AH-01..AH-05)", () => {
  it("AH-01 matches fixtures/ahp-reference.json", () => {
    const result = calculateAhpFromMatrix(reference.matrix, ["C1", "C2", "C3"] as never);
    reference.expected.weights.forEach((expectedWeight, index) => {
      expect(result.weightsVector[index]).toBeCloseTo(expectedWeight, 5);
    });
    expect(result.lambdaMax).toBeCloseTo(reference.expected.lambdaMax, 4);
    expect(result.cr).toBeCloseTo(reference.expected.cr, 4);
    expect(result.isConsistent).toBe(true);
  });

  it("AH-02 five-by-five all ones yields equal weights and CR 0", () => {
    const output = runPairwiseAhp({ comparisons: allOnesComparisons() });
    for (const key of CRITERION_KEYS) {
      expect(output.weights[key]).toBeCloseTo(0.2, 8);
    }
    expect(output.cr).toBeCloseTo(0, 8);
    expect(output.isConsistent).toBe(true);
  });

  it("AH-03 highly inconsistent comparisons have CR > 0.10", () => {
    const comparisons = [
      { criterionA: "EXPERIENCE", criterionB: "PRICE", value: 9 },
      { criterionA: "EXPERIENCE", criterionB: "RATING", value: 9 },
      { criterionA: "EXPERIENCE", criterionB: "LOCATION", value: 9 },
      { criterionA: "EXPERIENCE", criterionB: "FORMAT", value: 9 },
      { criterionA: "PRICE", criterionB: "RATING", value: 9 },
      { criterionA: "PRICE", criterionB: "LOCATION", value: 9 },
      { criterionA: "PRICE", criterionB: "FORMAT", value: 9 },
      { criterionA: "RATING", criterionB: "LOCATION", value: 9 },
      { criterionA: "RATING", criterionB: "FORMAT", value: 9 },
      { criterionA: "LOCATION", criterionB: "FORMAT", value: 1 / 9 },
    ];
    const output = runPairwiseAhp({ comparisons });
    expect(output.cr).toBeGreaterThan(0.1);
    expect(output.isConsistent).toBe(false);
    expect(output.weights.EXPERIENCE).toBeGreaterThan(0);
  });

  it("AH-04 rejects invalid Saaty values", () => {
    const comparisons = allOnesComparisons();
    comparisons[0] = { ...comparisons[0], value: 0 };
    expect(() => runPairwiseAhp({ comparisons })).toThrow(AppError);
    expect(() => runPairwiseAhp({ comparisons: allOnesComparisons().slice(0, 5) })).toThrow(
      AppError,
    );
  });

  it("matrix diagonal is 1 and reciprocity holds", () => {
    const matrix = buildReciprocalMatrix(CRITERION_KEYS, allOnesComparisons());
    for (let i = 0; i < matrix.length; i += 1) {
      expect(matrix[i][i]).toBe(1);
      for (let j = 0; j < matrix.length; j += 1) {
        expect(matrix[i][j] * matrix[j][i]).toBeCloseTo(1, 6);
      }
    }
  });

  it("demo scenarios from fixtures/demo-scenarios.json", () => {
    for (const scenario of demoScenarios) {
      const output = runPairwiseAhp({
        comparisons: scenario.comparisons as never,
      });
      for (const key of CRITERION_KEYS) {
        expect(output.weights[key]).toBeCloseTo(scenario.expected.weights[key], 8);
      }
      expect(output.cr).toBeCloseTo(scenario.expected.cr, 8);
    }
  });

  it("weights sum to 1", () => {
    const output = runPairwiseAhp({ comparisons: allOnesComparisons() });
    const sum = CRITERION_KEYS.reduce((acc, key) => acc + output.weights[key], 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it("allows reciprocal Saaty values", () => {
    expect(isAllowedSaatyValue(0.125)).toBe(true);
    expect(isAllowedSaatyValue(8)).toBe(true);
    expect(isAllowedSaatyValue(3.5)).toBe(false);
  });
});

describe("DIRECT_WSM (WS-01..WS-03)", () => {
  it("WS-01 equal priorities normalize to 0.2 each", () => {
    const result = calculateDirectWeights({
      priorities: { EXPERIENCE: 1, PRICE: 1, RATING: 1, LOCATION: 1, FORMAT: 1 },
    });
    for (const key of CRITERION_KEYS) {
      expect(result.weights[key]).toBeCloseTo(0.2, 10);
    }
    expect(result.cr).toBeNull();
  });

  it("WS-02 dominant first criterion", () => {
    const result = calculateDirectWeights({
      priorities: { EXPERIENCE: 9, PRICE: 1, RATING: 1, LOCATION: 1, FORMAT: 1 },
    });
    expect(result.weights.EXPERIENCE).toBeCloseTo(9 / 13, 10);
    const sum = CRITERION_KEYS.reduce((acc, key) => acc + result.weights[key], 0);
    expect(sum).toBeCloseTo(1, 10);
  });

  it("WS-03 rejects invalid priorities", () => {
    expect(() =>
      calculateDirectWeights({
        priorities: { EXPERIENCE: 0, PRICE: 1, RATING: 1, LOCATION: 1, FORMAT: 1 },
      }),
    ).toThrow(AppError);
    expect(() =>
      calculateDirectWeights({
        priorities: { EXPERIENCE: 10, PRICE: 1, RATING: 1, LOCATION: 1, FORMAT: 1 },
      }),
    ).toThrow(AppError);
  });
});
