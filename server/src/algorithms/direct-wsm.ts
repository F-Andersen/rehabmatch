import { AppError } from "../lib/http-errors.js";
import { ALGORITHM_VERSION } from "./config.js";
import type { CriterionKey, WeightsByKey } from "./types.js";
import { CRITERION_KEYS } from "./types.js";

export type DirectWsmInput = {
  priorities: Partial<Record<CriterionKey, number>>;
};

export type DirectWsmOutput = {
  mode: "DIRECT_WSM";
  algorithmVersion: string;
  weights: WeightsByKey;
  lambdaMax: null;
  ci: null;
  cr: null;
  isConsistent: true;
};

export function calculateDirectWeights(input: DirectWsmInput): DirectWsmOutput {
  const values: number[] = [];
  for (const key of CRITERION_KEYS) {
    const raw = input.priorities[key];
    if (raw === undefined || raw === null) {
      throw new AppError(400, "VALIDATION_ERROR", "Відсутня оцінка важливості критерію", { key });
    }
    if (!Number.isInteger(raw) || raw < 1 || raw > 9) {
      throw new AppError(
        400,
        "VALIDATION_ERROR",
        "Прямі ваги мають бути цілими числами від 1 до 9",
        { key, value: raw },
      );
    }
    values.push(raw);
  }

  const sum = values.reduce((acc, value) => acc + value, 0);
  if (sum <= 0) {
    throw new AppError(400, "VALIDATION_ERROR", "Сума пріоритетів повинна бути додатною");
  }

  const weights = CRITERION_KEYS.reduce<WeightsByKey>((acc, key, index) => {
    acc[key] = values[index] / sum;
    return acc;
  }, {} as WeightsByKey);

  return {
    mode: "DIRECT_WSM",
    algorithmVersion: ALGORITHM_VERSION,
    weights,
    lambdaMax: null,
    ci: null,
    cr: null,
    isConsistent: true,
  };
}
