export const CRITERION_KEYS = [
  "EXPERIENCE",
  "PRICE",
  "RATING",
  "LOCATION",
  "FORMAT",
] as const;

export type CriterionKey = (typeof CRITERION_KEYS)[number];

export type PreferenceMode = "AHP_PAIRWISE" | "DIRECT_WSM";

export type PairwiseComparison = {
  criterionA: CriterionKey;
  criterionB: CriterionKey;
  value: number;
};

export type RecommendationFilters = {
  injuryTypeId?: string;
  maxBudget?: number;
  cityId?: string | null;
  districtId?: string | null;
  formatId?: string | null;
  cityOnly?: boolean;
  inclusiveOnly?: boolean;
  formatStrict?: boolean;
};

export type ScoringSpecialist = {
  id: string;
  experienceYears: number;
  pricePerSession: number;
  ratingAvg: number;
  ratingCount: number;
  cityId: string | null;
  districtId: string | null;
  formatIds: string[];
  injuryTypeIds: string[];
  inclusiveSpace: boolean;
  verificationStatus?: string;
  isVisible?: boolean;
};

export type CriterionFactor = {
  key: CriterionKey;
  weight: number;
  normalizedValue: number;
  contribution: number;
  rawLabel: string;
};

export type SpecialistScoreResult = {
  specialistId: string;
  score: number;
  factors: CriterionFactor[];
  explanation: string[];
};

export type RankedSpecialist = SpecialistScoreResult & {
  rankPosition: number;
  matchScore: number;
};

export type WeightsByKey = Record<CriterionKey, number>;

export type AhpDiagnostics = {
  weights: WeightsByKey;
  lambdaMax: number;
  ci: number;
  cr: number;
  isConsistent: boolean;
  matrix: number[][];
};

export type DirectWsmResult = {
  weights: WeightsByKey;
  lambdaMax: null;
  ci: null;
  cr: null;
  isConsistent: true;
};
