import { apiRequest } from "../../lib/api";
import type { CriterionKey } from "./criteria";

export type SearchRequestPayload = {
  injuryTypeId: string;
  specializationId?: string;
  cityId?: string | null;
  districtId?: string | null;
  formatId?: string | null;
  maxBudget: number;
  cityOnly?: boolean;
  inclusiveOnly?: boolean;
  formatStrict?: boolean;
  preferenceMode: "AHP_PAIRWISE" | "DIRECT_WSM";
};

export async function createSearchRequest(payload: SearchRequestPayload) {
  const res = await apiRequest<{ data: { id: string } }>("/api/v1/search-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export type SearchRequestDetail = {
  id: string;
  preferenceMode: SearchRequestPayload["preferenceMode"];
  filtersSnapshot: Omit<SearchRequestPayload, "preferenceMode" | "specializationId"> & {
    specializationId?: string | null;
  };
};

export async function fetchSearchRequest(id: string) {
  const res = await apiRequest<{ data: SearchRequestDetail }>(`/api/v1/search-requests/${id}`);
  return res.data;
}

export type AhpPreview = {
  weights: Record<CriterionKey, number>;
  lambdaMax: number | null;
  ci: number | null;
  cr: number | null;
  isConsistent: boolean;
  consistencyThreshold: number | null;
};

export async function previewAhpPairwise(
  comparisons: Array<{ criterionA: CriterionKey; criterionB: CriterionKey; value: number }>,
) {
  const res = await apiRequest<{ data: AhpPreview }>("/api/v1/ahp/calculate", {
    method: "POST",
    body: JSON.stringify({ mode: "AHP_PAIRWISE", comparisons }),
  });
  return res.data;
}

export async function previewDirectWsm(priorities: Record<CriterionKey, number>) {
  const res = await apiRequest<{ data: AhpPreview }>("/api/v1/ahp/calculate", {
    method: "POST",
    body: JSON.stringify({ mode: "DIRECT_WSM", priorities }),
  });
  return res.data;
}

export type RecommendationItem = {
  rankPosition: number;
  specialistId: string;
  matchScore: number;
  matchScorePercent: number;
  fullName: string;
  city: string | null;
  experienceYears: number;
  pricePerSession: number;
  ratingAvg: number;
  ratingCount: number;
  specializations: string[];
  factors: Array<{
    key: string;
    weight: number;
    normalizedValue: number;
    contribution: number;
    rawLabel?: string;
  }>;
  explanation: string[];
};

export type RecommendationDetail = {
  id: string;
  searchRequestId: string;
  filtersSnapshot: SearchRequestDetail["filtersSnapshot"];
  mode: string;
  algorithmVersion: string;
  consistencyRatio: number | null;
  weights: Record<string, number>;
  createdAt: string;
  items: RecommendationItem[];
};

export async function createRecommendationAhp(
  searchRequestId: string,
  comparisons: Array<{ criterionA: CriterionKey; criterionB: CriterionKey; value: number }>,
) {
  const res = await apiRequest<{ data: RecommendationDetail }>("/api/v1/recommendations", {
    method: "POST",
    body: JSON.stringify({
      searchRequestId,
      mode: "AHP_PAIRWISE",
      comparisons,
      limit: 20,
    }),
  });
  return res.data;
}

export async function createRecommendationWsm(
  searchRequestId: string,
  priorities: Record<CriterionKey, number>,
) {
  const res = await apiRequest<{ data: RecommendationDetail }>("/api/v1/recommendations", {
    method: "POST",
    body: JSON.stringify({
      searchRequestId,
      mode: "DIRECT_WSM",
      priorities,
      limit: 20,
    }),
  });
  return res.data;
}

export async function fetchRecommendation(id: string) {
  const res = await apiRequest<{ data: RecommendationDetail }>(`/api/v1/recommendations/${id}`);
  return res.data;
}

export type RecommendationListItem = {
  id: string;
  createdAt: string;
  mode: string;
  injuryType: string;
  city: string | null;
  maxBudget: number;
};

export async function fetchRecommendations(page = 1) {
  return apiRequest<{ data: RecommendationListItem[]; meta: { total: number } }>(
    `/api/v1/recommendations?page=${page}&pageSize=20`,
  );
}

const storageKey = (searchId: string) => `rehabmatch:matching:${searchId}`;

export function loadMatchingDraft(searchId: string) {
  try {
    const raw = sessionStorage.getItem(storageKey(searchId));
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function saveMatchingDraft(searchId: string, data: Record<string, unknown>) {
  try {
    sessionStorage.setItem(storageKey(searchId), JSON.stringify(data));
  } catch {
    // The persisted search remains usable when browser storage is unavailable.
  }
}
