import { CR_THRESHOLD, RANDOM_INDEX } from "../config.js";
import type { CriterionKey, WeightsByKey } from "../types.js";
import { CRITERION_KEYS } from "../types.js";

export type AhpCalculationResult = {
  weightsVector: number[];
  weights: WeightsByKey;
  lambdaMax: number;
  ci: number;
  cr: number;
  isConsistent: boolean;
};

function geometricMeanWeights(matrix: number[][]): number[] {
  const n = matrix.length;
  const raw = matrix.map((row) => {
    const product = row.reduce((acc, value) => acc * value, 1);
    return Math.pow(product, 1 / n);
  });
  const sum = raw.reduce((acc, value) => acc + value, 0);
  if (!Number.isFinite(sum) || sum <= 0) {
    throw new Error("Invalid geometric mean weights");
  }
  return raw.map((value) => value / sum);
}

function multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
  return matrix.map((row) => row.reduce((acc, value, index) => acc + value * vector[index], 0));
}

/**
 * λmax ≈ (1/n) * Σ_i ((A·w)_i / w_i) — standard AHP eigenvalue approximation.
 */
function calculateLambdaMax(matrix: number[][], weights: number[]): number {
  const n = matrix.length;
  const aw = multiplyMatrixVector(matrix, weights);
  const terms = aw.map((value, index) => value / weights[index]);
  return terms.reduce((acc, value) => acc + value, 0) / n;
}

export function calculateAhpFromMatrix(
  matrix: number[][],
  keys: readonly CriterionKey[] = CRITERION_KEYS,
): AhpCalculationResult {
  const n = matrix.length;
  if (n !== keys.length) {
    throw new Error("Matrix size must match criterion keys");
  }

  const weightsVector = geometricMeanWeights(matrix);
  const lambdaMax = calculateLambdaMax(matrix, weightsVector);
  const ci = n >= 3 ? Math.max(0, (lambdaMax - n) / (n - 1)) : 0;
  const ri = RANDOM_INDEX[n] ?? 0;
  const cr = ri > 0 ? ci / ri : 0;
  const isConsistent = cr <= CR_THRESHOLD;

  const weights = keys.reduce<WeightsByKey>((acc, key, index) => {
    acc[key] = weightsVector[index];
    return acc;
  }, {} as WeightsByKey);

  return {
    weightsVector,
    weights,
    lambdaMax,
    ci,
    cr,
    isConsistent,
  };
}
