import { ALGORITHM_VERSION, CR_THRESHOLD } from "../config.js";
import type { CriterionKey, PairwiseComparison, WeightsByKey } from "../types.js";
import { CRITERION_KEYS } from "../types.js";
import { buildReciprocalMatrix } from "./matrix.js";
import { calculateAhpFromMatrix } from "./calculate-ahp.js";

export type PairwiseAhpInput = {
  keys?: readonly CriterionKey[];
  comparisons: PairwiseComparison[];
};

export type PairwiseAhpOutput = {
  mode: "AHP_PAIRWISE";
  algorithmVersion: string;
  weights: WeightsByKey;
  lambdaMax: number;
  ci: number;
  cr: number;
  isConsistent: boolean;
  consistencyThreshold: number;
  matrix: number[][];
};

export function runPairwiseAhp(input: PairwiseAhpInput): PairwiseAhpOutput {
  const keys = input.keys ?? CRITERION_KEYS;
  if (keys.length !== CRITERION_KEYS.length) {
    throw new Error("MVP supports exactly five criteria");
  }

  const matrix = buildReciprocalMatrix(keys, input.comparisons);
  const result = calculateAhpFromMatrix(matrix, keys);

  return {
    mode: "AHP_PAIRWISE",
    algorithmVersion: ALGORITHM_VERSION,
    weights: result.weights,
    lambdaMax: result.lambdaMax,
    ci: result.ci,
    cr: result.cr,
    isConsistent: result.isConsistent,
    consistencyThreshold: CR_THRESHOLD,
    matrix,
  };
}
