import { apiRequest } from "../../lib/api";
import type {
  CatalogDictionaries,
  PaginationMeta,
  SpecialistCard,
  SpecialistProfile,
  SpecialistReview,
} from "./types";

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, value);
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchCatalogDictionaries() {
  const res = await apiRequest<{ data: CatalogDictionaries }>("/api/v1/catalog");
  return res.data;
}

export async function fetchSpecialistsList(
  params: Record<string, string | undefined>,
) {
  return apiRequest<{ data: SpecialistCard[]; meta: PaginationMeta }>(
    `/api/v1/specialists${buildQuery(params)}`,
  );
}

export async function fetchSpecialistById(id: string) {
  const res = await apiRequest<{ data: SpecialistProfile }>(`/api/v1/specialists/${id}`);
  return res.data;
}

export async function fetchSpecialistReviews(id: string, page = "1") {
  return apiRequest<{ data: SpecialistReview[]; meta: PaginationMeta }>(
    `/api/v1/specialists/${id}/reviews${buildQuery({ page })}`,
  );
}

export async function fetchOwnSpecialistProfile() {
  const res = await apiRequest<{ data: SpecialistProfile }>("/api/v1/specialist/me");
  return res.data;
}

export type UpdateSpecialistPayload = {
  fullName?: string;
  description?: string;
  experienceYears?: number;
  pricePerSession?: number;
  cityId?: string | null;
  districtId?: string | null;
  inclusiveSpace?: boolean;
  photoUrl?: string | null;
  specializationIds?: string[];
  injuryTypeIds?: string[];
  formatIds?: string[];
};

export async function updateOwnSpecialistProfile(payload: UpdateSpecialistPayload) {
  const res = await apiRequest<{ data: SpecialistProfile }>("/api/v1/specialist/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res.data;
}

export type ServiceInput = { name: string; description?: string; price: number };

export async function uploadOwnSpecialistPhoto(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  const dataBase64 = btoa(binary);
  const mimeType = file.type;
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
    throw new Error("Дозволені формати: JPEG, PNG, WebP");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Максимальний розмір файлу — 2 МБ");
  }
  const res = await apiRequest<{ data: SpecialistProfile }>("/api/v1/specialist/me/photo", {
    method: "POST",
    body: JSON.stringify({ mimeType, dataBase64 }),
  });
  return res.data;
}

export async function replaceOwnSpecialistServices(services: ServiceInput[]) {
  const res = await apiRequest<{ data: SpecialistProfile }>("/api/v1/specialist/me/services", {
    method: "PUT",
    body: JSON.stringify({ services }),
  });
  return res.data;
}

export async function fetchAdminSpecialists(params: Record<string, string | undefined>) {
  return apiRequest<{
    data: (SpecialistProfile & { userId: string; updatedAt: string })[];
    meta: PaginationMeta;
  }>(`/api/v1/admin/specialists${buildQuery(params)}`);
}

export async function fetchAdminSpecialistById(id: string) {
  const res = await apiRequest<{ data: SpecialistProfile }>(`/api/v1/admin/specialists/${id}`);
  return res.data;
}

export async function patchSpecialistVerification(
  id: string,
  status: "PENDING" | "APPROVED" | "REJECTED",
) {
  const res = await apiRequest<{ data: SpecialistProfile }>(
    `/api/v1/admin/specialists/${id}/verification`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
  return res.data;
}
