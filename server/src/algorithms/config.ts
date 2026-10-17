import type { CriterionKey } from "./types.js";
import { CRITERION_KEYS } from "./types.js";

/** Algorithm version stored with recommendations (M5+). */
export const ALGORITHM_VERSION = "ahp-gm-wsm-fixed-v1";

/** Saaty consistency ratio threshold (n=5 MVP). */
export const CR_THRESHOLD = 0.1;

/**
 * Random Index (RI) by matrix size n — Saaty (1977), as in docs/04-AHP-ALGORITHM.md.
 * Used for CR = CI / RI[n].
 */
export const RANDOM_INDEX: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0.58,
  4: 0.9,
  5: 1.12,
};

/** Fixed MVP normalization bounds (not derived per candidate set). */
export const EXPERIENCE_YEARS_CAP = 20;
export const PRICE_MIN_UAH = 300;
export const PRICE_MAX_UAH = 3000;

export const RATING_MIN = 1;
export const RATING_MAX = 5;
export const RATING_MISSING_FALLBACK = 0.5;

export const LOCATION_SAME_DISTRICT = 1.0;
export const LOCATION_SAME_CITY = 0.7;
export const LOCATION_OTHER_CITY = 0.2;
export const LOCATION_NEUTRAL = 0.5;

export const FORMAT_MATCH = 1.0;
export const FORMAT_NO_MATCH = 0.0;
export const FORMAT_NEUTRAL = 0.5;

export const SCORE_EPSILON = 1e-9;
export const CONTRIBUTION_SUM_TOLERANCE = 1e-9;

export const DEFAULT_CRITERION_ORDER: readonly CriterionKey[] = CRITERION_KEYS;
