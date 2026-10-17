import { AppError } from "../../lib/http-errors.js";

const INTEGER_SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const RECIPROCAL_SCALE = INTEGER_SCALE.slice(1).map((n) => 1 / n);

const ALLOWED_SAATY = [...INTEGER_SCALE, ...RECIPROCAL_SCALE];

const SAATY_TOLERANCE = 1e-6;

export function isAllowedSaatyValue(value: number): boolean {
  if (!Number.isFinite(value) || value <= 0) {
    return false;
  }
  return ALLOWED_SAATY.some((allowed) => Math.abs(allowed - value) <= SAATY_TOLERANCE);
}

export function assertSaatyValue(value: number): void {
  if (!isAllowedSaatyValue(value)) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Некоректне значення шкали Сааті (дозволено 1–9 та обернені 1/2…1/9)",
      { value },
    );
  }
}
