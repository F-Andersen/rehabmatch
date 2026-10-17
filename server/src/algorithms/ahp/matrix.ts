import { AppError } from "../../lib/http-errors.js";
import type { CriterionKey, PairwiseComparison } from "../types.js";
import { assertSaatyValue } from "./saaty.js";

const RECIPROCITY_TOLERANCE = 1e-6;

export function lexicographicPairs(keys: readonly CriterionKey[]): Array<[CriterionKey, CriterionKey]> {
  const pairs: Array<[CriterionKey, CriterionKey]> = [];
  for (let i = 0; i < keys.length; i += 1) {
    for (let j = i + 1; j < keys.length; j += 1) {
      pairs.push([keys[i], keys[j]]);
    }
  }
  return pairs;
}

function pairKey(a: CriterionKey, b: CriterionKey): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function buildReciprocalMatrix(
  keys: readonly CriterionKey[],
  comparisons: PairwiseComparison[],
): number[][] {
  const n = keys.length;
  const expectedPairs = lexicographicPairs(keys);
  const map = new Map<string, PairwiseComparison>();

  for (const comparison of comparisons) {
    if (comparison.criterionA === comparison.criterionB) {
      throw new AppError(400, "VALIDATION_ERROR", "Критерій не можна порівнювати сам із собою");
    }
    const key = pairKey(comparison.criterionA, comparison.criterionB);
    if (map.has(key)) {
      throw new AppError(400, "VALIDATION_ERROR", "Дубльоване попарне порівняння", { pair: key });
    }
    assertSaatyValue(comparison.value);
    map.set(key, comparison);
  }

  if (map.size !== expectedPairs.length) {
    throw new AppError(422, "VALIDATION_ERROR", "Неповний або зайвий набір попарних порівнянь", {
      expected: expectedPairs.length,
      received: map.size,
    });
  }

  for (const [a, b] of expectedPairs) {
    if (!map.has(pairKey(a, b))) {
      throw new AppError(422, "VALIDATION_ERROR", "Відсутнє обовʼязкове попарне порівняння", {
        criterionA: a,
        criterionB: b,
      });
    }
  }

  const indexByKey = new Map(keys.map((key, index) => [key, index]));
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i += 1) {
    matrix[i][i] = 1;
  }

  for (const comparison of map.values()) {
    const i = indexByKey.get(comparison.criterionA);
    const j = indexByKey.get(comparison.criterionB);
    if (i === undefined || j === undefined) {
      throw new AppError(400, "VALIDATION_ERROR", "Невідомий ключ критерію");
    }
    const [row, col, value] =
      i < j ? [i, j, comparison.value] : [j, i, comparison.value];
    const inverseRow = col;
    const inverseCol = row;
    const inverseValue = 1 / value;
    matrix[row][col] = value;
    matrix[inverseRow][inverseCol] = inverseValue;
  }

  assertReciprocalMatrix(matrix);
  return matrix;
}

export function assertReciprocalMatrix(matrix: number[][]): void {
  const n = matrix.length;
  for (let i = 0; i < n; i += 1) {
    if (Math.abs(matrix[i][i] - 1) > RECIPROCITY_TOLERANCE) {
      throw new AppError(400, "VALIDATION_ERROR", "Діагональ матриці повинна дорівнювати 1");
    }
    for (let j = i + 1; j < n; j += 1) {
      const product = matrix[i][j] * matrix[j][i];
      if (!Number.isFinite(product) || Math.abs(product - 1) > RECIPROCITY_TOLERANCE) {
        throw new AppError(400, "VALIDATION_ERROR", "Порушена взаємна оберненість матриці", {
          i,
          j,
          aij: matrix[i][j],
          aji: matrix[j][i],
        });
      }
    }
  }
}
